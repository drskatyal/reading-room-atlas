import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layers, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import type {
  JointAtlasDefinition,
  MriContrastPreset,
  MriPlaneMode,
} from '../types/atlas';

export interface ClinicalSequenceMeta {
  id: string;
  label: string;
  plane: 'axial' | 'coronal' | 'sagittal';
  weighting: string;
  width: number;
  height: number;
  slices: number;
  sliceThicknessMm: number;
  pixelSpacingMm: [number, number];
  defaultWindow: number;
  defaultLevel: number;
  defaultSlice: number;
  file: string;
}

export interface ClinicalStudyManifest {
  jointId: string;
  modality: string;
  sequences: ClinicalSequenceMeta[];
}

interface ClinicalStackMriViewerProps {
  jointDef: JointAtlasDefinition;
  planeMode: MriPlaneMode;
  contrastPreset: MriContrastPreset;
  focusTrigger?: number;
  hidden?: boolean;
  onSwitchTo3DSync: () => void;
}

type MouseTool = 'scroll' | 'wl' | 'pan';

// Module-level cache of decompressed pixel stacks (pure uint8 pixel arrays, zero PHI)
const sequenceDataCache = new Map<string, Uint8Array>();
const manifestCache = new Map<string, ClinicalStudyManifest>();

async function fetchAndDecompressStack(url: string, expectedBytes: number): Promise<Uint8Array> {
  const cached = sequenceDataCache.get(url);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rawBuf = await res.arrayBuffer();
  const rawU8 = new Uint8Array(rawBuf);

  let pixels: Uint8Array;
  // Detect gzip magic bytes (0x1f 0x8b) so it works identically whether or not proxy decompressed it
  if (rawU8.length >= 2 && rawU8[0] === 0x1f && rawU8[1] === 0x8b && typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const stream = new Response(rawU8).body!.pipeThrough(ds);
    const outBuf = await new Response(stream).arrayBuffer();
    pixels = new Uint8Array(outBuf);
  } else {
    pixels = rawU8;
  }

  if (pixels.length < expectedBytes) {
    throw new Error(`Unexpected sequence byte length (${pixels.length} < ${expectedBytes})`);
  }

  // Keep cache bounded (~12 sequences max in RAM)
  if (sequenceDataCache.size >= 14) {
    const firstKey = sequenceDataCache.keys().next().value;
    if (firstKey) sequenceDataCache.delete(firstKey);
  }
  sequenceDataCache.set(url, pixels);
  return pixels;
}

function pickBestSequenceForContext(
  sequences: ClinicalSequenceMeta[],
  planeMode: MriPlaneMode,
  contrastPreset: MriContrastPreset
): ClinicalSequenceMeta | null {
  if (!sequences.length) return null;
  const targetPlane = planeMode === 'multiplanar' ? null : planeMode;
  const inPlane = targetPlane
    ? sequences.filter((s) => s.plane === targetPlane)
    : sequences;
  const pool = inPlane.length > 0 ? inPlane : sequences;

  const presetLower = contrastPreset.toLowerCase();
  const wantsFluid =
    presetLower.includes('pdfat') ||
    presetLower.includes('marrow') ||
    presetLower.includes('edema') ||
    presetLower.includes('qdess') ||
    presetLower.includes('fluid') ||
    presetLower.includes('hill-sachs');
  const wantsChondral =
    presetLower.includes('chondral') ||
    presetLower.includes('labrum') ||
    presetLower.includes('tfcc');

  if (wantsChondral) {
    const hit = pool.find((s) => /3d|ge|pd-fs|t2-fs/i.test(s.weighting) || /3d|pd-fs/i.test(s.label));
    if (hit) return hit;
  }
  if (wantsFluid) {
    const hit = pool.find((s) => /pd-fs|t2-fs|stir/i.test(s.weighting));
    if (hit) return hit;
  }
  const t1Hit = pool.find((s) => /^t1$|^pd$/i.test(s.weighting));
  return t1Hit ?? pool[0];
}

export function ClinicalStackMriViewer({
  jointDef,
  planeMode,
  contrastPreset,
  focusTrigger = 0,
  hidden = false,
  onSwitchTo3DSync,
}: ClinicalStackMriViewerProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const [manifest, setManifest] = useState<ClinicalStudyManifest | null>(null);
  const [activeSeqId, setActiveSeqId] = useState<string>('');
  const [sliceIndex, setSliceIndex] = useState<number>(0);
  const [winWidth, setWinWidth] = useState<number>(220);
  const [winLevel, setWinLevel] = useState<number>(110);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mouseTool, setMouseTool] = useState<MouseTool>('scroll');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stackVersion, setStackVersion] = useState<number>(0);

  const pixelsRef = useRef<Uint8Array | null>(null);
  const seqRef = useRef<ClinicalSequenceMeta | null>(null);
  const lastFocusTriggerRef = useRef<number>(focusTrigger);

  const activeSeq = useMemo(
    () => manifest?.sequences.find((s) => s.id === activeSeqId) ?? manifest?.sequences[0] ?? null,
    [manifest, activeSeqId]
  );

  // Load manifest when joint changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);
    pixelsRef.current = null;
    seqRef.current = null;

    const url = `/studies/${jointDef.id}/manifest.json`;
    const cached = manifestCache.get(url);

    const applyManifest = (data: ClinicalStudyManifest) => {
      if (cancelled) return;
      setManifest(data);
      const initial =
        pickBestSequenceForContext(data.sequences, planeMode, contrastPreset) ??
        data.sequences[0];
      if (initial) {
        setActiveSeqId(initial.id);
        setSliceIndex(initial.defaultSlice);
        setWinWidth(initial.defaultWindow);
        setWinLevel(initial.defaultLevel);
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
      }
    };

    if (cached) {
      applyManifest(cached);
      return;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Study manifest unavailable (${res.status})`);
        return res.json() as Promise<ClinicalStudyManifest>;
      })
      .then((data) => {
        manifestCache.set(url, data);
        applyManifest(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Unable to load study manifest');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jointDef.id]);

  // Auto-select matching sequence when user explicitly clicks a structure or pathology step
  useEffect(() => {
    if (!manifest || focusTrigger === lastFocusTriggerRef.current) return;
    lastFocusTriggerRef.current = focusTrigger;
    const best = pickBestSequenceForContext(manifest.sequences, planeMode, contrastPreset);
    if (best && best.id !== activeSeqId) {
      const prev = manifest.sequences.find((s) => s.id === activeSeqId);
      const samePlane = prev && prev.plane === best.plane;
      const frac = prev && prev.slices > 1 ? sliceIndex / (prev.slices - 1) : 0.5;
      setActiveSeqId(best.id);
      setSliceIndex(
        samePlane
          ? Math.max(0, Math.min(best.slices - 1, Math.round(frac * (best.slices - 1))))
          : best.defaultSlice
      );
      setWinWidth(best.defaultWindow);
      setWinLevel(best.defaultLevel);
    }
  }, [focusTrigger, manifest, planeMode, contrastPreset, activeSeqId, sliceIndex]);

  // Fetch active sequence pixel buffer + background-prefetch next sequence in same plane
  useEffect(() => {
    if (!activeSeq) return;
    let cancelled = false;
    const expectedBytes = activeSeq.slices * activeSeq.height * activeSeq.width;
    const cachedBuf = sequenceDataCache.get(activeSeq.file);
    if (cachedBuf) {
      pixelsRef.current = cachedBuf;
      seqRef.current = activeSeq;
      setLoading(false);
      setErrorMsg(null);
      setStackVersion((v) => v + 1);
      return;
    }
    pixelsRef.current = null;
    seqRef.current = null;
    setLoading(true);
    setErrorMsg(null);

    fetchAndDecompressStack(activeSeq.file, expectedBytes)
      .then((buf) => {
        if (cancelled) return;
        pixelsRef.current = buf;
        seqRef.current = activeSeq;
        setLoading(false);
        setStackVersion((v) => v + 1);

        // Background prefetch sibling sequence in same plane (e.g. T1 -> STIR)
        if (manifest) {
          const sibling = manifest.sequences.find(
            (s) => s.id !== activeSeq.id && s.plane === activeSeq.plane && !sequenceDataCache.has(s.file)
          );
          if (sibling) {
            fetchAndDecompressStack(
              sibling.file,
              sibling.slices * sibling.height * sibling.width
            ).catch(() => {});
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Unable to load MRI sequence');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeSeq, manifest]);

  // Fast <1ms 2D canvas render with live W/L LUT + zoom/pan
  const renderSlice = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const pixels = pixelsRef.current;
    const seq = seqRef.current;
    if (!canvas || !wrap || !pixels || !seq || hidden) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(1, wrap.clientWidth);
    const cssH = Math.max(1, wrap.clientHeight);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Offscreen slice canvas matching native matrix
    let off = offscreenRef.current;
    if (!off) {
      off = document.createElement('canvas');
      offscreenRef.current = off;
    }
    if (off.width !== seq.width || off.height !== seq.height) {
      off.width = seq.width;
      off.height = seq.height;
    }
    const offCtx = off.getContext('2d');
    if (!offCtx) return;

    const sIdx = Math.max(0, Math.min(seq.slices - 1, sliceIndex));
    const sliceLen = seq.width * seq.height;
    const offset = sIdx * sliceLen;

    // Precompute 256-entry Window/Level LUT
    const lut = new Uint8ClampedArray(256);
    const wMin = winLevel - winWidth / 2;
    const invW = 255 / Math.max(8, winWidth);
    for (let i = 0; i < 256; i++) {
      const v = (i - wMin) * invW;
      lut[i] = v <= 0 ? 0 : v >= 255 ? 255 : Math.round(v);
    }

    const imgData = offCtx.createImageData(seq.width, seq.height);
    const dst = imgData.data;
    for (let i = 0, p = 0; i < sliceLen; i++, p += 4) {
      const g = lut[pixels[offset + i]];
      dst[p] = g;
      dst[p + 1] = g;
      dst[p + 2] = g;
      dst[p + 3] = 255;
    }
    offCtx.putImageData(imgData, 0, 0);

    // Draw into main viewport with physical aspect ratio + zoom + pan
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#04070d';
    ctx.fillRect(0, 0, targetW, targetH);

    const rowSp = seq.pixelSpacingMm?.[0] || 1;
    const colSp = seq.pixelSpacingMm?.[1] || 1;
    const physW = seq.width * colSp;
    const physH = seq.height * rowSp;
    const pad = 16 * dpr;
    const fitScale = Math.min((targetW - pad * 2) / physW, (targetH - pad * 2) / physH);
    const drawW = physW * fitScale * zoom;
    const drawH = physH * fitScale * zoom;
    const dx = (targetW - drawW) / 2 + pan.x * dpr;
    const dy = (targetH - drawH) / 2 + pan.y * dpr;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, dx, dy, drawW, drawH);
  }, [sliceIndex, winWidth, winLevel, zoom, pan, hidden]);

  useEffect(() => {
    renderSlice();
  }, [renderSlice, stackVersion]);

  // ResizeObserver for crisp redraws on window/pane resize
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => renderSlice());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [renderSlice]);

  const handleSelectSequence = useCallback(
    (seq: ClinicalSequenceMeta) => {
      if (seq.id === activeSeqId) return;
      const prev = manifest?.sequences.find((s) => s.id === activeSeqId);
      const samePlane = prev && prev.plane === seq.plane;
      const frac = prev && prev.slices > 1 ? sliceIndex / (prev.slices - 1) : 0.5;
      setActiveSeqId(seq.id);
      setSliceIndex(
        samePlane
          ? Math.max(0, Math.min(seq.slices - 1, Math.round(frac * (seq.slices - 1))))
          : seq.defaultSlice
      );
      setWinWidth(seq.defaultWindow);
      setWinLevel(seq.defaultLevel);
      setPan({ x: 0, y: 0 });
    },
    [activeSeqId, manifest, sliceIndex]
  );

  const handleResetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    if (activeSeq) {
      setWinWidth(activeSeq.defaultWindow);
      setWinLevel(activeSeq.defaultLevel);
    }
  }, [activeSeq]);

  // Wheel slice scrolling (non-passive) + FlowRad pointer drag (Left=active tool, Right=W/L, Middle/Shift=Pan)
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let wheelAccum = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.ctrlKey || e.metaKey) {
        setZoom((z) => Math.max(0.6, Math.min(4.0, Number((z + (e.deltaY < 0 ? 0.16 : -0.16)).toFixed(2)))));
        return;
      }
      const normDelta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      wheelAccum += normDelta;
      const steps = Math.trunc(wheelAccum / 24);
      if (steps !== 0) {
        wheelAccum -= steps * 24;
        const maxS = Math.max(0, (seqRef.current?.slices ?? 1) - 1);
        setSliceIndex((idx) => Math.max(0, Math.min(maxS, idx + steps)));
      }
    };

    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', onWheel);
  }, []);

  // Pointer drag state for Scroll / W-L / Pan
  const dragRef = useRef<{
    mode: MouseTool;
    lastX: number;
    lastY: number;
    scrollAccum: number;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    let mode: MouseTool = mouseTool;
    if (e.button === 2) {
      mode = 'wl';
    } else if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      mode = 'pan';
    } else if (e.button !== 0) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      mode,
      lastX: e.clientX,
      lastY: e.clientY,
      scrollAccum: 0,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;

    if (d.mode === 'scroll') {
      d.scrollAccum += dy;
      const steps = Math.trunc(d.scrollAccum / 7);
      if (steps !== 0) {
        d.scrollAccum -= steps * 7;
        const maxS = Math.max(0, (seqRef.current?.slices ?? 1) - 1);
        setSliceIndex((idx) => Math.max(0, Math.min(maxS, idx + steps)));
      }
    } else if (d.mode === 'wl') {
      setWinWidth((w) => Math.max(16, Math.min(400, Math.round(w + dx * 0.9))));
      setWinLevel((l) => Math.max(0, Math.min(255, Math.round(l + dy * 0.6))));
    } else if (d.mode === 'pan') {
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore if not captured
      }
    }
  };

  // Keyboard shortcuts when viewport is focused/hovered
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!manifest) return;
    const maxS = Math.max(0, (activeSeq?.slices ?? 1) - 1);
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ']') {
      e.preventDefault();
      setSliceIndex((idx) => Math.min(maxS, idx + 1));
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === '[') {
      e.preventDefault();
      setSliceIndex((idx) => Math.max(0, idx - 1));
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      handleResetView();
    } else if (e.key >= '1' && e.key <= '9') {
      const idx = Number(e.key) - 1;
      if (manifest.sequences[idx]) {
        e.preventDefault();
        handleSelectSequence(manifest.sequences[idx]);
      }
    }
  };

  const totalSlices = activeSeq?.slices ?? 1;
  const planeLabel = activeSeq
    ? `${activeSeq.plane.slice(0, 3).toUpperCase()} · ${activeSeq.weighting}`
    : 'MRI';

  return (
    <section className="stage-pane" aria-label={`Clinical ${jointDef.shortName} MRI Sequences`}>
      <header className="pane-header">
        <div className="pane-title-group">
          <span className="pane-title">Clinical MRI</span>
          {activeSeq && (
            <span className="pane-badge">
              {activeSeq.label} · {activeSeq.sliceThicknessMm}mm
            </span>
          )}
        </div>
        <div className="pane-actions">
          <div className="segmented-pill" role="group" aria-label="MRI Viewer Mode">
            <button
              type="button"
              className="pill-btn active"
              title="Real multi-sequence clinical MRI study"
            >
              Sequences
            </button>
            <button
              type="button"
              className="pill-btn"
              onClick={onSwitchTo3DSync}
              title="Switch to 3D-synced MPR volume & segmentation overlays"
            >
              <Layers size={11} style={{ marginRight: 4, verticalAlign: '-1px' }} />
              3D Sync
            </button>
          </div>
        </div>
      </header>

      {/* Multi-Sequence Switcher Strip (FlowRad-style series selector, zero patient data) */}
      {manifest && manifest.sequences.length > 0 && (
        <div className="clinical-seq-strip" role="tablist" aria-label="MRI Sequences">
          {manifest.sequences.map((seq, idx) => {
            const isActive = seq.id === (activeSeq?.id ?? '');
            return (
              <button
                key={seq.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`clinical-seq-pill ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectSequence(seq)}
                title={`${seq.label} (${seq.slices} slices, ${seq.sliceThicknessMm}mm) — Shortcut: ${idx + 1}`}
              >
                <span className="clinical-seq-name">{seq.label}</span>
                <span className="clinical-seq-count">{seq.slices}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Native Zero-Lag Canvas Viewport */}
      <div
        ref={wrapRef}
        className={`mri-canvas-wrap clinical-canvas-wrap tool-${mouseTool}`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={onKeyDown}
      >
        <canvas ref={canvasRef} className="clinical-mri-canvas" />

        {/* Clean technical-only HUD corners (ZERO patient data) */}
        {activeSeq && !errorMsg && (
          <>
            <div className="clinical-hud-tl">
              <span>{planeLabel}</span>
              <span>{activeSeq.width}×{activeSeq.height}</span>
            </div>
            <div className="clinical-hud-bl">
              <span>W {winWidth} / L {winLevel}</span>
            </div>
          </>
        )}

        {loading && (
          <div className="viewport-overlay">
            <div className="spinner" />
            <span>Loading {activeSeq?.label ?? 'MRI'} sequence…</span>
          </div>
        )}
        {errorMsg && (
          <div className="viewport-overlay is-error">
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* FlowRad-style PACS Footer Bar */}
      <footer className="mri-footer-bar">
        <div className="slice-control">
          <span className="footer-label">
            Slice {sliceIndex + 1}/{totalSlices}
          </span>
          <input
            type="range"
            className="slice-slider"
            min={0}
            max={Math.max(0, totalSlices - 1)}
            step={1}
            value={sliceIndex}
            onChange={(e) => setSliceIndex(Number(e.target.value))}
            aria-label="Scroll MRI slices"
          />
        </div>

        <div className="mri-footer-right">
          <div className="segmented-pill mini-seg" role="group" aria-label="Left mouse tool">
            <button
              type="button"
              className={`pill-btn ${mouseTool === 'scroll' ? 'active' : ''}`}
              onClick={() => setMouseTool('scroll')}
              title="Left-drag or mouse wheel scrolls slices (Right-drag adjusts W/L)"
            >
              Scroll
            </button>
            <button
              type="button"
              className={`pill-btn ${mouseTool === 'wl' ? 'active' : ''}`}
              onClick={() => setMouseTool('wl')}
              title="Left-drag adjusts Window / Level"
            >
              W/L
            </button>
            <button
              type="button"
              className={`pill-btn ${mouseTool === 'pan' ? 'active' : ''}`}
              onClick={() => setMouseTool('pan')}
              title="Left-drag pans image"
            >
              Pan
            </button>
          </div>

          <div className="zoom-pill" role="group" aria-label="MRI zoom controls">
            <button
              type="button"
              className="zoom-btn"
              onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.2).toFixed(2))))}
              title="Zoom out MRI"
              aria-label="Zoom out MRI"
            >
              <Minus size={12} />
            </button>
            <span className="zoom-readout">{zoom.toFixed(1)}×</span>
            <button
              type="button"
              className="zoom-btn"
              onClick={() => setZoom((z) => Math.min(4.0, Number((z + 0.2).toFixed(2))))}
              title="Zoom in MRI (Ctrl+Wheel)"
              aria-label="Zoom in MRI"
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              className="zoom-reset-btn"
              onClick={handleResetView}
              title="Reset zoom, pan & W/L (Shortcut: R)"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              className="zoom-reset-btn"
              onClick={() => {
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
              }}
              title="Fit to viewport"
            >
              <Maximize2 size={11} />
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}
