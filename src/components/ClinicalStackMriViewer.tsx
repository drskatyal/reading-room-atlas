import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minus, Plus, RotateCcw, Tag } from 'lucide-react';
import {
  CLINICAL_MRI_LABELS,
  findPinForStructure,
  type ClinicalMriPin,
} from '../data/clinicalMriLabels';
import type {
  JointAtlasDefinition,
  MriContrastPreset,
  MriPlaneMode,
  StructureId,
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
  activeStructure: StructureId;
  enabledStructures: Set<StructureId>;
  showAllLabels: boolean;
  onToggleAllLabels: () => void;
  isPathologyMode: boolean;
  targetBadge?: string;
  hideLabels?: boolean;
  focusTrigger?: number;
  hidden?: boolean;
  onSelectStructure: (id: StructureId) => void;
}

type MouseTool = 'scroll' | 'wl' | 'pan';

interface ImageViewportBox {
  dx: number;
  dy: number;
  drawW: number;
  drawH: number;
  cssW: number;
  cssH: number;
}

interface ProjectedMriLabel {
  id: string;
  structureId: StructureId;
  text: string;
  side: 'left' | 'right';
  ax: number;
  ay: number;
  lx: number;
  ly: number;
  isCaseTarget: boolean;
  isActive: boolean;
}

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

  // Keep cache bounded (~14 sequences max in RAM)
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

function relaxColumn(items: ProjectedMriLabel[], minY: number, maxY: number, minGap = 24) {
  items.sort((a, b) => a.ly - b.ly);
  for (let i = 1; i < items.length; i++) {
    if (items[i].ly - items[i - 1].ly < minGap) {
      items[i].ly = items[i - 1].ly + minGap;
    }
  }
  if (items.length > 0 && items[items.length - 1].ly > maxY) {
    items[items.length - 1].ly = maxY;
    for (let i = items.length - 2; i >= 0; i--) {
      if (items[i + 1].ly - items[i].ly < minGap) {
        items[i].ly = items[i + 1].ly - minGap;
      }
    }
  }
  for (const item of items) {
    item.ly = Math.max(minY, Math.min(maxY, item.ly));
  }
}

export function ClinicalStackMriViewer({
  jointDef,
  planeMode,
  contrastPreset,
  activeStructure,
  enabledStructures,
  showAllLabels,
  onToggleAllLabels,
  isPathologyMode,
  targetBadge,
  hideLabels = false,
  focusTrigger = 0,
  hidden = false,
  onSelectStructure,
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
  const [imgBox, setImgBox] = useState<ImageViewportBox | null>(null);

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
        const pinHit = findPinForStructure(jointDef.id, activeStructure, initial.plane);
        const targetSlice =
          pinHit && pinHit.plane === initial.plane
            ? Math.max(0, Math.min(initial.slices - 1, Math.round(pinHit.pin.sliceFrac * (initial.slices - 1))))
            : initial.defaultSlice;
        setActiveSeqId(initial.id);
        setSliceIndex(targetSlice);
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

  // Auto-select matching sequence + exact anatomical slice when user clicks a structure or pathology step
  useEffect(() => {
    if (!manifest || focusTrigger === lastFocusTriggerRef.current) return;
    lastFocusTriggerRef.current = focusTrigger;
    const best = pickBestSequenceForContext(manifest.sequences, planeMode, contrastPreset);
    if (!best) return;

    const pinHit = findPinForStructure(jointDef.id, activeStructure, best.plane);
    const targetSlice =
      pinHit && pinHit.plane === best.plane
        ? Math.max(0, Math.min(best.slices - 1, Math.round(pinHit.pin.sliceFrac * (best.slices - 1))))
        : best.defaultSlice;

    if (best.id !== activeSeqId) {
      setActiveSeqId(best.id);
      setWinWidth(best.defaultWindow);
      setWinLevel(best.defaultLevel);
    }
    setSliceIndex(targetSlice);
  }, [focusTrigger, manifest, planeMode, contrastPreset, activeStructure, jointDef.id, activeSeqId]);

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

  // Fast <1ms 2D canvas render with live W/L LUT + zoom/pan + exact CSS image box tracking
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

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#04070d';
    ctx.fillRect(0, 0, targetW, targetH);

    const rowSp = seq.pixelSpacingMm?.[0] || 1;
    const colSp = seq.pixelSpacingMm?.[1] || 1;
    const physW = seq.width * colSp;
    const physH = seq.height * rowSp;
    const padCss = 16;
    const fitScaleCss = Math.min((cssW - padCss * 2) / physW, (cssH - padCss * 2) / physH);
    const drawWCss = physW * fitScaleCss * zoom;
    const drawHCss = physH * fitScaleCss * zoom;
    const dxCss = (cssW - drawWCss) / 2 + pan.x;
    const dyCss = (cssH - drawHCss) / 2 + pan.y;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, dxCss * dpr, dyCss * dpr, drawWCss * dpr, drawHCss * dpr);

    setImgBox((prev) => {
      if (
        prev &&
        Math.abs(prev.dx - dxCss) < 0.5 &&
        Math.abs(prev.dy - dyCss) < 0.5 &&
        Math.abs(prev.drawW - drawWCss) < 0.5 &&
        Math.abs(prev.drawH - drawHCss) < 0.5 &&
        Math.abs(prev.cssW - cssW) < 0.5 &&
        Math.abs(prev.cssH - cssH) < 0.5
      ) {
        return prev;
      }
      return { dx: dxCss, dy: dyCss, drawW: drawWCss, drawH: drawHCss, cssW, cssH };
    });
  }, [sliceIndex, winWidth, winLevel, zoom, pan, hidden]);

  useEffect(() => {
    renderSlice();
  }, [renderSlice, stackVersion]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => renderSlice());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [renderSlice]);

  // Compute non-overlapping projected MRI anatomical + case pathology labels
  const projectedLabels = useMemo<ProjectedMriLabel[]>(() => {
    if (hideLabels || loading || errorMsg || !activeSeq || !imgBox) return [];
    const planePins: ClinicalMriPin[] = CLINICAL_MRI_LABELS[jointDef.id]?.[activeSeq.plane] ?? [];
    if (!planePins.length) return [];

    const curFrac = activeSeq.slices > 1 ? sliceIndex / (activeSeq.slices - 1) : 0.5;
    const visiblePins: Array<{ pin: ClinicalMriPin; isCaseTarget: boolean; isActive: boolean }> = [];

    for (const pin of planePins) {
      const isFocus = pin.structureId === activeStructure;
      const onSlice = Math.abs(curFrac - pin.sliceFrac) <= pin.sliceSpan;
      if (!onSlice) continue;

      if (isPathologyMode) {
        if (isFocus) {
          visiblePins.push({ pin, isCaseTarget: true, isActive: true });
        } else if (showAllLabels && enabledStructures.has(pin.structureId)) {
          visiblePins.push({ pin, isCaseTarget: false, isActive: false });
        }
      } else {
        if (showAllLabels) {
          if (enabledStructures.has(pin.structureId)) {
            visiblePins.push({ pin, isCaseTarget: false, isActive: isFocus });
          }
        } else if (isFocus && enabledStructures.has(pin.structureId)) {
          visiblePins.push({ pin, isCaseTarget: false, isActive: true });
        }
      }
    }

    if (!visiblePins.length) return [];

    const cx = imgBox.dx + imgBox.drawW / 2;
    const leftCol: ProjectedMriLabel[] = [];
    const rightCol: ProjectedMriLabel[] = [];

    for (const { pin, isCaseTarget, isActive } of visiblePins) {
      const ax = imgBox.dx + (pin.xPct / 100) * imgBox.drawW;
      const ay = imgBox.dy + (pin.yPct / 100) * imgBox.drawH;
      if (ax < -20 || ax > imgBox.cssW + 20 || ay < -20 || ay > imgBox.cssH + 20) continue;

      const text = isCaseTarget && targetBadge ? targetBadge : pin.label;
      const estWidth = Math.min(220, Math.max(54, text.length * 6.8 + 20));
      const isLeft = ax < cx;
      // Left pills are right-aligned at lx (transform: translate(-100%, -50%)) so leader hits right edge;
      // Right pills are left-aligned at lx (transform: translate(0, -50%)) so leader hits left edge;
      // Both are strictly clamped inside [10 .. cssW - 10] so long pathology badges never clip!
      const lx = isLeft
        ? Math.max(estWidth + 10, Math.min(ax - 22, imgBox.dx + Math.max(8, imgBox.drawW * 0.14)))
        : Math.min(imgBox.cssW - estWidth - 10, Math.max(ax + 22, imgBox.dx + Math.min(imgBox.drawW - 8, imgBox.drawW * 0.86)));

      const item: ProjectedMriLabel = {
        id: `${activeSeq.plane}-${pin.structureId}`,
        structureId: pin.structureId,
        text,
        side: isLeft ? 'left' : 'right',
        ax,
        ay,
        lx,
        ly: ay,
        isCaseTarget,
        isActive,
      };
      if (isLeft) leftCol.push(item);
      else rightCol.push(item);
    }

    const minY = 34;
    const maxY = Math.max(minY + 40, imgBox.cssH - 34);
    relaxColumn(leftCol, minY, maxY, 24);
    relaxColumn(rightCol, minY, maxY, 24);

    return [...leftCol, ...rightCol];
  }, [
    hideLabels,
    loading,
    errorMsg,
    activeSeq,
    imgBox,
    jointDef.id,
    sliceIndex,
    activeStructure,
    isPathologyMode,
    showAllLabels,
    enabledStructures,
    targetBadge,
  ]);

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

  const dragRef = useRef<{
    mode: MouseTool;
    lastX: number;
    lastY: number;
    scrollAccum: number;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
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
          {!hideLabels && (
            <button
              type="button"
              className={`chip-btn ${showAllLabels ? 'active' : ''}`}
              aria-pressed={showAllLabels}
              onClick={onToggleAllLabels}
              title="Toggle anatomical labels across 3D & MRI slices"
            >
              <Tag size={12} />
              <span>{showAllLabels ? 'Labels On' : 'Labels'}</span>
            </button>
          )}
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

      {/* Native Zero-Lag Canvas Viewport + Anatomical / Case Pathology Labels */}
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

        {/* Synchronized On-MRI Anatomical & Pathology Callout Layer */}
        {projectedLabels.length > 0 && imgBox && (
          <div className="callout-layer mri-callout-layer" aria-label="MRI Anatomical Labels">
            <svg
              className="callout-svg"
              viewBox={`0 0 ${imgBox.cssW} ${imgBox.cssH}`}
              preserveAspectRatio="none"
            >
              {projectedLabels.map((lbl) => (
                <g key={lbl.id}>
                  <line
                    x1={lbl.ax}
                    y1={lbl.ay}
                    x2={lbl.lx}
                    y2={lbl.ly}
                    className={`mri-leader-line ${
                      lbl.isCaseTarget ? 'is-case' : lbl.isActive ? 'is-active' : ''
                    }`}
                  />
                  {lbl.isCaseTarget && (
                    <circle
                      cx={lbl.ax}
                      cy={lbl.ay}
                      r={7}
                      className="mri-anchor-ring-case"
                    />
                  )}
                  <circle
                    cx={lbl.ax}
                    cy={lbl.ay}
                    r={lbl.isCaseTarget ? 3.5 : 3}
                    className={`mri-anchor-dot ${
                      lbl.isCaseTarget ? 'is-case' : lbl.isActive ? 'is-active' : ''
                    }`}
                  />
                </g>
              ))}
            </svg>

            {projectedLabels.map((lbl) => (
              <button
                key={lbl.id}
                type="button"
                className={`pin-pill mri-pin-pill side-${lbl.side} ${
                  lbl.isCaseTarget ? 'is-case-target' : lbl.isActive ? 'is-active' : ''
                }`}
                style={{ left: `${lbl.lx}px`, top: `${lbl.ly}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStructure(lbl.structureId);
                }}
              >
                {lbl.text}
              </button>
            ))}
          </div>
        )}

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
