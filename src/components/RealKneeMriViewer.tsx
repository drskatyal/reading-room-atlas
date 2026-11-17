import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DRAG_MODE,
  MULTIPLANAR_TYPE,
  Niivue,
  SHOW_RENDER,
  SLICE_TYPE,
  type NiiVueLocation,
} from '@niivue/niivue';
import { motion } from 'motion/react';
import { MRI_CONTRAST_PRESETS, STRUCTURES_INFO } from '../data/kneeClinicalAtlas';
import type {
  KneeLandmarks,
  MriContrastPreset,
  MriOverlayMode,
  MriPlaneMode,
  StructureId,
} from '../types/atlas';

interface RealKneeMriViewerProps {
  landmarks: KneeLandmarks | null;
  contrastPreset: MriContrastPreset;
  onContrastChange: (preset: MriContrastPreset) => void;
  planeMode: MriPlaneMode;
  onPlaneModeChange: (plane: MriPlaneMode) => void;
  activeStructure: StructureId;
  targetRasMm: [number, number, number] | null;
  onRasCrosshairChange: (mm: [number, number, number]) => void;
  onSelectStructureFromMri: (id: StructureId) => void;
}

// Clinical 16-structure palette (subtle medical atlas tones when segmentation overlay is toggled ON)
const SEG_COLORMAP = {
  R: [0, 212, 204, 192, 218, 124, 108, 102, 134, 48, 38, 217, 174, 86, 98, 206, 196],
  G: [0, 202, 194, 184, 208, 206, 194, 186, 212, 178, 152, 166, 132, 192, 198, 168, 158],
  B: [0, 184, 178, 168, 190, 232, 224, 218, 236, 172, 184, 104, 214, 154, 140, 210, 202],
  A: [0, 110, 110, 110, 110, 205, 205, 205, 205, 225, 225, 240, 240, 225, 225, 200, 200],
  I: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
};

// Stanford OpenMSK Quantitative Subregional Cartilage & Meniscus Palette
const SUBREGION_COLORMAP = {
  R: [0, 126, 0, 82, 108, 45, 38, 198, 190, 205, 0, 92, 218, 56, 226, 48],
  G: [0, 208, 0, 186, 202, 168, 148, 190, 182, 196, 0, 164, 154, 194, 116, 138],
  B: [0, 234, 0, 214, 230, 162, 176, 174, 168, 182, 0, 236, 86, 148, 94, 218],
  A: [0, 215, 0, 210, 210, 210, 210, 80, 80, 80, 0, 220, 225, 220, 225, 220],
  I: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
};

const LABEL_INDEX_TO_ID: Record<number, StructureId> = {
  1: 'Femur',
  2: 'Tibia',
  3: 'Fibula',
  4: 'Patella',
  5: 'FemoralCartilage',
  6: 'MedialTibialCartilage',
  7: 'LateralTibialCartilage',
  8: 'PatellarCartilage',
  9: 'MedialMeniscus',
  10: 'LateralMeniscus',
  11: 'ACL',
  12: 'PCL',
  13: 'MCL',
  14: 'LCL',
  15: 'PatellarTendon',
  16: 'QuadricepsTendon',
};

const SUBREGION_NAMES: Record<number, string> = {
  1: 'Patellar Cartilage',
  3: 'Medial Tibial Cartilage',
  4: 'Lateral Tibial Cartilage',
  5: 'Medial Meniscus',
  6: 'Lateral Meniscus',
  7: 'Femur',
  8: 'Tibia',
  9: 'Patella',
  11: 'Trochlear Femoral Cartilage',
  12: 'Medial Weight-Bearing Femoral Cartilage',
  13: 'Lateral Weight-Bearing Femoral Cartilage',
  14: 'Posterior Medial Femoral Cartilage',
  15: 'Posterior Lateral Femoral Cartilage',
};

const PLANE_OPTIONS: Array<{ id: MriPlaneMode; label: string; sliceType: SLICE_TYPE }> = [
  { id: 'sagittal', label: 'Sagittal', sliceType: SLICE_TYPE.SAGITTAL },
  { id: 'coronal', label: 'Coronal', sliceType: SLICE_TYPE.CORONAL },
  { id: 'axial', label: 'Axial', sliceType: SLICE_TYPE.AXIAL },
  { id: 'multiplanar', label: '3-Plane MPR', sliceType: SLICE_TYPE.MULTIPLANAR },
];

export function RealKneeMriViewer({
  landmarks,
  contrastPreset,
  onContrastChange,
  planeMode,
  onPlaneModeChange,
  activeStructure,
  targetRasMm,
  onRasCrosshairChange,
  onSelectStructureFromMri,
}: RealKneeMriViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nvRef = useRef<Niivue | null>(null);
  const readyRef = useRef(false);
  const baseLoadedRef = useRef(false);
  const loadedOverlayFileRef = useRef<'atlas' | 'subregions'>('atlas');
  const suppressingSyncRef = useRef(false);
  const planeModeRef = useRef(planeMode);
  const overlayModeRef = useRef<MriOverlayMode>('none');
  const targetRasRef = useRef(targetRasMm);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [overlayMode, setOverlayMode] = useState<MriOverlayMode>('none');
  const [segOpacity, setSegOpacity] = useState(0.28);
  const [crosshairVisible, setCrosshairVisible] = useState(true);
  const [sliceFrac, setSliceFrac] = useState(0.5);
  const [rasReadout, setRasReadout] = useState<[number, number, number]>([112, 21, -12]);
  const [tissueUnderCursor, setTissueUnderCursor] = useState<string | null>(null);

  useEffect(() => {
    planeModeRef.current = planeMode;
    overlayModeRef.current = overlayMode;
    targetRasRef.current = targetRasMm;
  }, [planeMode, overlayMode, targetRasMm]);

  const presetMeta = useMemo(
    () =>
      MRI_CONTRAST_PRESETS.find((s) => s.id === contrastPreset) ?? MRI_CONTRAST_PRESETS[0],
    [contrastPreset]
  );

  // Initialize NiiVue once with clean clinical PACS settings + trilinear interpolation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;

    const nv = new Niivue({
      backColor: [0.008, 0.012, 0.024, 1],
      crosshairColor: [0.58, 0.78, 0.98, 0.55],
      crosshairWidth: 0.45,
      show3Dcrosshair: false,
      isSliceMM: true,
      isRadiologicalConvention: true,
      sagittalNoseLeft: true,
      isCornerOrientationText: false,
      isOrientationTextVisible: true,
      textHeight: 0.028,
      fontColor: [0.85, 0.89, 0.94, 0.82],
      dragMode: DRAG_MODE.contrast,
      multiplanarLayout: MULTIPLANAR_TYPE.GRID,
      multiplanarShowRender: SHOW_RENDER.NEVER,
      sliceType: SLICE_TYPE.SAGITTAL,
    });

    nvRef.current = nv;

    nv.onLocationChange = (locObj: unknown) => {
      const loc = locObj as NiiVueLocation | undefined;
      if (!loc || !loc.mm) return;
      const mm: [number, number, number] = [
        Number(loc.mm[0].toFixed(1)),
        Number(loc.mm[1].toFixed(1)),
        Number(loc.mm[2].toFixed(1)),
      ];
      setRasReadout(mm);

      const axisIdx =
        nv.opts.sliceType === SLICE_TYPE.CORONAL
          ? 1
          : nv.opts.sliceType === SLICE_TYPE.AXIAL
            ? 2
            : 0;
      if (loc.frac && typeof loc.frac[axisIdx] === 'number') {
        setSliceFrac(Number(loc.frac[axisIdx].toFixed(3)));
      }

      const segSample = loc.values?.[1]?.value;
      if (typeof segSample === 'number') {
        const rounded = Math.round(segSample);
        if (overlayModeRef.current === 'subregions') {
          setTissueUnderCursor(SUBREGION_NAMES[rounded] ?? null);
        } else {
          const structId = LABEL_INDEX_TO_ID[rounded];
          setTissueUnderCursor(structId ? STRUCTURES_INFO[structId].shortLabel : null);
        }
      } else {
        setTissueUnderCursor(null);
      }

      if (!suppressingSyncRef.current) {
        onRasCrosshairChange(mm);
      }
    };

    (async () => {
      try {
        await nv.attachToCanvas(canvas);
        if (disposed) return;
        // Enable smooth trilinear MPR interpolation for high-res coronal & axial reconstructions
        nv.setInterpolation(true);
        readyRef.current = true;

        setLoading(true);
        setErrorMsg(null);
        await nv.loadVolumes([
          {
            url: '/volumes/knee-invivo-3t-qdess.nii.gz',
            colormap: 'gray',
            cal_min: 14,
            cal_max: 222,
            trustCalMinMax: true,
          },
          {
            // Preload 16-tissue label volume at opacity 0 for instant hover anatomy & toggle
            url: '/volumes/knee-invivo-seg.nii.gz',
            opacity: 0,
            cal_min: 0,
            cal_max: 16,
            trustCalMinMax: true,
          },
        ]);
        if (disposed) return;

        baseLoadedRef.current = true;
        loadedOverlayFileRef.current = 'atlas';
        if (nv.volumes[1]) {
          nv.volumes[1].setColormapLabel(SEG_COLORMAP);
          nv.setOpacity(1, 0);
        }
        nv.setSliceMM(true);
        const match = PLANE_OPTIONS.find((p) => p.id === planeModeRef.current);
        if (match) {
          nv.setSliceType(match.sliceType);
        }
        nv.setPan2Dxyzmm([0, 0, 0, 1.05]);
        nv.updateGLVolume();

        const ras = targetRasRef.current;
        if (ras && nv.volumes[0]) {
          suppressingSyncRef.current = true;
          const frac = nv.mm2frac(ras);
          nv.scene.crosshairPos = [
            Math.max(0.02, Math.min(0.98, frac[0])),
            Math.max(0.02, Math.min(0.98, frac[1])),
            Math.max(0.02, Math.min(0.98, frac[2])),
          ];
          nv.drawScene();
          nv.createOnLocationChange();
          window.setTimeout(() => {
            suppressingSyncRef.current = false;
          }, 50);
        }
        setLoading(false);
      } catch (err) {
        if (!disposed) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Unable to initialize 3T qDESS MRI viewer'
          );
          setLoading(false);
        }
      }
    })();

    return () => {
      disposed = true;
      readyRef.current = false;
      baseLoadedRef.current = false;
      nvRef.current = null;
    };
  }, [onRasCrosshairChange]);

  // Instant Window/Level preset update (zero network reload!)
  useEffect(() => {
    const nv = nvRef.current;
    if (!nv || !baseLoadedRef.current || !nv.volumes[0]) return;
    const presetWl = landmarks?.wlPresets?.[contrastPreset] ?? {
      min: presetMeta.defaultMin,
      max: presetMeta.defaultMax,
    };
    nv.volumes[0].cal_min = presetWl.min;
    nv.volumes[0].cal_max = presetWl.max;
    nv.updateGLVolume();
  }, [contrastPreset, landmarks, presetMeta]);

  // Sync plane mode
  useEffect(() => {
    const nv = nvRef.current;
    if (!nv || !readyRef.current) return;
    const match = PLANE_OPTIONS.find((p) => p.id === planeMode);
    if (match) {
      nv.setSliceType(match.sliceType);
    }
  }, [planeMode]);

  // Sync crosshair visibility (toggleable thin 0.45px PACS line vs pure unblemished film)
  useEffect(() => {
    const nv = nvRef.current;
    if (!nv || !readyRef.current) return;
    nv.setCrosshairWidth(crosshairVisible ? 0.45 : 0);
  }, [crosshairVisible]);

  // Sync overlay mode ('none' | 'atlas' | 'subregions') and opacity without reloading base MRI
  useEffect(() => {
    const nv = nvRef.current;
    if (!nv || !baseLoadedRef.current) return;
    let cancelled = false;

    const syncOverlay = async () => {
      if (overlayMode === 'none') {
        if (nv.volumes[1]) nv.setOpacity(1, 0);
        return;
      }

      if (overlayMode !== loadedOverlayFileRef.current) {
        try {
          if (nv.volumes.length > 1) {
            nv.removeVolumeByIndex(1);
          }
          const url =
            overlayMode === 'subregions'
              ? '/volumes/knee-invivo-subregions.nii.gz'
              : '/volumes/knee-invivo-seg.nii.gz';
          await nv.addVolumeFromUrl({
            url,
            opacity: segOpacity,
            cal_min: 0,
            cal_max: 16,
            trustCalMinMax: true,
          });
          if (cancelled) return;
          loadedOverlayFileRef.current = overlayMode;
          if (nv.volumes[1]) {
            nv.volumes[1].setColormapLabel(
              overlayMode === 'subregions' ? SUBREGION_COLORMAP : SEG_COLORMAP
            );
            nv.setOpacity(1, segOpacity);
          }
          nv.updateGLVolume();
        } catch {
          // Graceful fallback if overlay switch interrupted
        }
      } else if (nv.volumes[1]) {
        nv.setOpacity(1, segOpacity);
      }
    };

    syncOverlay();
    return () => {
      cancelled = true;
    };
  }, [overlayMode, segOpacity]);

  // Shortcuts: O cycles Seg overlay, C toggles PACS Crosshair
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (key === 'o') {
        setOverlayMode((m) => (m === 'none' ? 'atlas' : m === 'atlas' ? 'subregions' : 'none'));
      } else if (key === 'c') {
        setCrosshairVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Jump MRI crosshair when 3D structure or chapter requests a RAS target
  useEffect(() => {
    const nv = nvRef.current;
    if (!nv || !baseLoadedRef.current || !nv.volumes[0] || !targetRasMm) return;
    suppressingSyncRef.current = true;
    const frac = nv.mm2frac(targetRasMm);
    nv.scene.crosshairPos = [
      Math.max(0.01, Math.min(0.99, frac[0])),
      Math.max(0.01, Math.min(0.99, frac[1])),
      Math.max(0.01, Math.min(0.99, frac[2])),
    ];
    nv.drawScene();
    nv.createOnLocationChange();
    window.setTimeout(() => {
      suppressingSyncRef.current = false;
    }, 40);
  }, [targetRasMm]);

  const handleSliceScrub = (nextFrac: number) => {
    setSliceFrac(nextFrac);
    const nv = nvRef.current;
    if (!nv || !baseLoadedRef.current || !nv.volumes[0]) return;
    const pos = [...nv.scene.crosshairPos] as [number, number, number];
    const axisIdx = planeMode === 'coronal' ? 1 : planeMode === 'axial' ? 2 : 0;
    pos[axisIdx] = nextFrac;
    nv.scene.crosshairPos = pos;
    nv.drawScene();
    nv.createOnLocationChange();
  };

  const jumpToStructure = useCallback(
    (id: StructureId) => {
      onSelectStructureFromMri(id);
      const lm = landmarks?.structures[id];
      const nv = nvRef.current;
      if (lm && nv && nv.volumes[0]) {
        const frac = nv.mm2frac(lm.centroidRas);
        nv.scene.crosshairPos = [
          Math.max(0.01, Math.min(0.99, frac[0])),
          Math.max(0.01, Math.min(0.99, frac[1])),
          Math.max(0.01, Math.min(0.99, frac[2])),
        ];
        nv.drawScene();
        nv.createOnLocationChange();
      }
    },
    [landmarks, onSelectStructureFromMri]
  );

  return (
    <section className="stage-pane" aria-label="In-Vivo 3T Knee qDESS MRI Viewer">
      <div className="pane-header">
        <div className="pane-heading">
          <h2 className="pane-title">In-Vivo 3T qDESS MRI</h2>
          <span className="pane-note">{presetMeta.spec}</span>
        </div>

        <div className="seg-group" role="tablist" aria-label="PACS window level preset">
          {MRI_CONTRAST_PRESETS.map((wl) => {
            const active = wl.id === contrastPreset;
            return (
              <button
                key={wl.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`seg-btn ${active ? 'active' : ''}`}
                onClick={() => onContrastChange(wl.id)}
              >
                {active && (
                  <motion.span
                    layoutId="mri-wl-pill"
                    className="seg-indicator"
                    transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                  />
                )}
                {wl.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mri-stage">
        <div className="mri-subbar">
          <div className="seg-group" role="tablist" aria-label="MRI plane">
            {PLANE_OPTIONS.map((opt) => {
              const active = opt.id === planeMode;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`seg-btn ${active ? 'active' : ''}`}
                  onClick={() => onPlaneModeChange(opt.id)}
                >
                  {active && (
                    <motion.span
                      layoutId="mri-plane-pill"
                      className="seg-indicator"
                      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                    />
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="mri-hud-pill">
            <span>
              RAS ({rasReadout[0]}, {rasReadout[1]}, {rasReadout[2]}) mm
            </span>
            {tissueUnderCursor && (
              <span style={{ color: 'var(--accent-telemetry)' }}>· {tissueUnderCursor}</span>
            )}
          </div>
        </div>

        <div className="niivue-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="niivue-canvas"
            aria-label="OpenMSK in-vivo 3T qDESS Right Knee MRI canvas"
          />

          <div className="pacs-corner pacs-tl">
            <div>STANFORD OPENMSK · 3.0T 3D qDESS</div>
            <div>RIGHT KNEE · IN-VIVO</div>
          </div>

          <div className="pacs-corner pacs-tr">
            <div>512×512×96 · 0.31×0.31×1.0 mm</div>
            <div>
              W/L [{presetMeta.shortLabel}] · BScore {landmarks?.bScore ?? -0.203}
            </div>
          </div>

          <div className="pacs-corner pacs-bl">
            <div>Drag L: W/L · Wheel: Scroll Slices</div>
          </div>

          {loading && <div className="loading-overlay">Streaming In-Vivo 3T qDESS NIfTI…</div>}
          {errorMsg && (
            <div className="loading-overlay" style={{ color: 'var(--accent-crimson)' }}>
              MRI load error: {errorMsg}
            </div>
          )}
        </div>

        <div className="mri-controls-bar">
          <label className="slider-inline" htmlFor="mri-slice-scrubber">
            <span>Slice</span>
            <input
              id="mri-slice-scrubber"
              type="range"
              min={0.05}
              max={0.95}
              step={0.01}
              value={sliceFrac}
              onChange={(e) => handleSliceScrub(Number(e.target.value))}
            />
            <span className="mono-val">{Math.round(sliceFrac * 100)}%</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`chip-toggle ${crosshairVisible ? 'active' : ''}`}
              onClick={() => setCrosshairVisible((v) => !v)}
              title="Toggle PACS crosshair (Shortcut C)"
            >
              Crosshair
            </button>
            <button
              type="button"
              className={`chip-toggle ${overlayMode === 'none' ? 'active' : ''}`}
              onClick={() => setOverlayMode('none')}
              title="Unretouched 3T grayscale MRI"
            >
              Clean MRI
            </button>
            <button
              type="button"
              className={`chip-toggle ${overlayMode === 'atlas' ? 'active' : ''}`}
              onClick={() => setOverlayMode((m) => (m === 'atlas' ? 'none' : 'atlas'))}
              title="16-structure segmentation overlay (Shortcut O)"
            >
              16-Tissue Seg
            </button>
            <button
              type="button"
              className={`chip-toggle ${overlayMode === 'subregions' ? 'active' : ''}`}
              onClick={() => setOverlayMode((m) => (m === 'subregions' ? 'none' : 'subregions'))}
              title="OpenMSK chondral subregions"
            >
              OA Subregions
            </button>

            {overlayMode !== 'none' && (
              <input
                type="range"
                aria-label="Segmentation overlay opacity"
                min={0.1}
                max={0.65}
                step={0.02}
                value={segOpacity}
                onChange={(e) => setSegOpacity(Number(e.target.value))}
                style={{ width: 58, accentColor: 'var(--accent-telemetry)' }}
              />
            )}

            <button
              type="button"
              className="chip-toggle"
              onClick={() => jumpToStructure(activeStructure)}
              title="Center MRI slice on active 3D structure"
            >
              Locate {STRUCTURES_INFO[activeStructure].shortLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
