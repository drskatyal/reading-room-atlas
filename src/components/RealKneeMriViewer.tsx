import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Crosshair,
  Maximize2,
  Minus,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DRAG_MODE,
  MULTIPLANAR_TYPE,
  Niivue,
  SHOW_RENDER,
  SLICE_TYPE,
  type NiiVueLocation,
} from '@niivue/niivue';
import { MRI_CONTRAST_PRESETS, STRUCTURES_INFO } from '../data/kneeClinicalAtlas';
import type {
  KneeLandmarks,
  MriAnnotation,
  MriContrastPreset,
  MriOverlayMode,
  MriPlaneMode,
  StructureId,
} from '../types/atlas';
import { MriPathologyOverlay } from './MriPathologyOverlay';

interface RealKneeMriViewerProps {
  landmarks: KneeLandmarks | null;
  contrastPreset: MriContrastPreset;
  onContrastChange: (preset: MriContrastPreset) => void;
  planeMode: MriPlaneMode;
  onPlaneModeChange: (plane: MriPlaneMode) => void;
  mriZoom: number;
  onMriZoomChange: (zoom: number) => void;
  targetRasMm: [number, number, number] | null;
  focusTrigger?: number;
  targetBadge?: string;
  mriAnnotations?: MriAnnotation[];
  showTargetPointer: boolean;
  onToggleTargetPointer: () => void;
  hideTargetForQuiz?: boolean;
  quizCandidateStructures?: StructureId[];
  overlayModeProp?: MriOverlayMode;
  onOverlayModeChange?: (mode: MriOverlayMode) => void;
  hidden?: boolean;
  onRasCrosshairChange: (mm: [number, number, number]) => void;
  onSelectStructureFromMri: (id: StructureId) => void;
  onQuizMriClick?: (id: StructureId) => void;
}

const SEG_COLORMAP = {
  R: [0, 212, 204, 192, 218, 124, 108, 102, 134, 48, 38, 217, 174, 86, 98, 206, 196],
  G: [0, 202, 194, 184, 208, 206, 194, 186, 212, 178, 152, 166, 132, 192, 198, 168, 158],
  B: [0, 184, 178, 168, 190, 232, 224, 218, 236, 172, 184, 104, 214, 154, 140, 210, 202],
  A: [0, 110, 110, 110, 110, 205, 205, 205, 205, 225, 225, 240, 240, 225, 225, 200, 200],
  I: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
};

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

const PLANE_OPTIONS: Array<{ id: MriPlaneMode; label: string; sliceType: SLICE_TYPE }> = [
  { id: 'sagittal', label: 'Sag', sliceType: SLICE_TYPE.SAGITTAL },
  { id: 'coronal', label: 'Cor', sliceType: SLICE_TYPE.CORONAL },
  { id: 'axial', label: 'Axi', sliceType: SLICE_TYPE.AXIAL },
  { id: 'multiplanar', label: 'MPR', sliceType: SLICE_TYPE.MULTIPLANAR },
];

function clampZoom(z: number): number {
  return Number(Math.max(1.0, Math.min(3.5, z)).toFixed(2));
}

function applyCenteredZoom(
  nv: Niivue,
  zoom: number,
  focusMm: [number, number, number] | null
): void {
  if (!nv.volumes[0]) return;
  if (zoom <= 1.02 || !focusMm) {
    nv.setPan2Dxyzmm([0, 0, 0, 1.0]);
    return;
  }
  const vc = nv.frac2mm([0.5, 0.5, 0.5]);
  nv.setPan2Dxyzmm([
    vc[0] - zoom * focusMm[0],
    vc[1] - zoom * focusMm[1],
    vc[2] - zoom * focusMm[2],
    zoom,
  ]);
}

function findNearestLandmarkStructure(
  mm: [number, number, number],
  landmarks: KneeLandmarks | null,
  candidates?: StructureId[],
  maxDistMm = 18
): StructureId | null {
  if (!landmarks) return null;
  const pool =
    candidates && candidates.length > 0
      ? candidates
      : (Object.keys(STRUCTURES_INFO) as StructureId[]);

  let bestId: StructureId | null = null;
  let bestDist = maxDistMm;
  for (const sid of pool) {
    const lm = landmarks.structures[sid];
    if (!lm) continue;
    const d = Math.hypot(
      mm[0] - lm.centroidRas[0],
      mm[1] - lm.centroidRas[1],
      mm[2] - lm.centroidRas[2]
    );
    if (d < bestDist) {
      bestDist = d;
      bestId = sid;
    }
  }
  return bestId;
}

export function RealKneeMriViewer({
  landmarks,
  contrastPreset,
  onContrastChange,
  planeMode,
  onPlaneModeChange,
  mriZoom,
  onMriZoomChange,
  targetRasMm,
  focusTrigger = 0,
  targetBadge,
  mriAnnotations = [],
  showTargetPointer,
  onToggleTargetPointer,
  hideTargetForQuiz = false,
  quizCandidateStructures,
  overlayModeProp,
  onOverlayModeChange,
  hidden = false,
  onRasCrosshairChange,
  onSelectStructureFromMri,
  onQuizMriClick,
}: RealKneeMriViewerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wlPopoverRef = useRef<HTMLDivElement>(null);

  const nvRef = useRef<Niivue | null>(null);
  const readyRef = useRef(false);
  const baseLoadedRef = useRef(false);
  const loadedOverlayFileRef = useRef<'atlas' | 'subregions'>('atlas');
  const suppressingSyncRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const lastPanSigRef = useRef('');
  const currentMmRef = useRef<[number, number, number]>([112.6, 20.6, -11.9]);

  const propsRef = useRef({
    planeMode,
    mriZoom,
    targetRasMm,
    showTargetPointer,
    hideTargetForQuiz,
    landmarks,
    quizCandidateStructures,
    hasAnnotations: mriAnnotations.length > 0,
    onRasCrosshairChange,
    onSelectStructureFromMri,
    onQuizMriClick,
    onMriZoomChange,
  });
  propsRef.current = {
    planeMode,
    mriZoom,
    targetRasMm,
    showTargetPointer,
    hideTargetForQuiz,
    landmarks,
    quizCandidateStructures,
    hasAnnotations: mriAnnotations.length > 0,
    onRasCrosshairChange,
    onSelectStructureFromMri,
    onQuizMriClick,
    onMriZoomChange,
  };

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wlMenuOpen, setWlMenuOpen] = useState(false);
  const [mouseTool, setMouseTool] = useState<'scroll' | 'pan'>('scroll');
  const mouseToolRef = useRef<'scroll' | 'pan'>('scroll');
  mouseToolRef.current = mouseTool;
  const [sliceInfo, setSliceInfo] = useState<{ index: number; total: number }>({
    index: 48,
    total: 96,
  });
  const [internalOverlayMode, setInternalOverlayMode] = useState<MriOverlayMode>('none');
  const overlayMode = overlayModeProp ?? internalOverlayMode;
  const setOverlayMode = useCallback(
    (next: MriOverlayMode | ((prev: MriOverlayMode) => MriOverlayMode)) => {
      const resolved = typeof next === 'function' ? next(overlayModeRef.current) : next;
      setInternalOverlayMode(resolved);
      onOverlayModeChange?.(resolved);
    },
    [onOverlayModeChange]
  );
  const [segOpacity, setSegOpacity] = useState(0.32);
  const [sliceFrac, setSliceFrac] = useState(0.5);
  const [canvasBox, setCanvasBox] = useState({ w: 0, h: 0 });
  const [pxPerMm, setPxPerMm] = useState(4.0);
  const [, setRenderTick] = useState(0);
  const [spotlight, setSpotlight] = useState<{
    x: number;
    y: number;
    visible: boolean;
    offSlice: boolean;
  }>({ x: 0, y: 0, visible: false, offSlice: false });

  const overlayModeRef = useRef<MriOverlayMode>('none');
  overlayModeRef.current = overlayMode;

  const projectRas = useCallback((ras: [number, number, number]): [number, number] | null => {
    const nv = nvRef.current;
    const canvas = canvasRef.current;
    if (!nv || !baseLoadedRef.current || !nv.volumes[0] || !canvas) return null;
    const slices = nv.screenSlices;
    if (!slices || slices.length === 0) return null;

    const plane = propsRef.current.planeMode;
    const targetSliceType =
      plane === 'axial'
        ? SLICE_TYPE.AXIAL
        : plane === 'coronal'
          ? SLICE_TYPE.CORONAL
          : SLICE_TYPE.SAGITTAL;

    const tile =
      slices.find(
        (s) =>
          s.axCorSag === targetSliceType &&
          s.fovMM?.length >= 2 &&
          s.leftTopMM?.length >= 2 &&
          s.leftTopWidthHeight?.length >= 4 &&
          s.fovMM[0] !== 0 &&
          s.fovMM[1] !== 0
      ) ??
      slices.find(
        (s) =>
          s.axCorSag <= SLICE_TYPE.SAGITTAL &&
          s.fovMM?.length >= 2 &&
          s.leftTopMM?.length >= 2 &&
          s.leftTopWidthHeight?.length >= 4 &&
          s.fovMM[0] !== 0 &&
          s.fovMM[1] !== 0
      );
    if (!tile) return null;

    let xMM = ras[0];
    let yMM = ras[1];
    if (tile.axCorSag === SLICE_TYPE.CORONAL) {
      xMM = ras[0];
      yMM = ras[2];
    } else if (tile.axCorSag === SLICE_TYPE.SAGITTAL) {
      xMM = ras[1];
      yMM = ras[2];
    }

    const fracX = (xMM - tile.leftTopMM[0]) / tile.fovMM[0];
    const fracY = (yMM - tile.leftTopMM[1]) / tile.fovMM[1];

    const ltwh = tile.leftTopWidthHeight;
    let left = ltwh[0];
    const top = ltwh[1];
    let width = ltwh[2];
    const height = ltwh[3];
    let screenFracX = fracX;
    if (width < 0) {
      left += width;
      width = -width;
      screenFracX = 1 - fracX;
    }
    const screenFracY = 1 - fracY;
    const devX = left + screenFracX * width;
    const devY = top + screenFracY * height;

    const sx = canvas.clientWidth / Math.max(1, canvas.width);
    const sy = canvas.clientHeight / Math.max(1, canvas.height);
    return [devX * sx, devY * sy];
  }, []);

  const presetMeta = useMemo(
    () => MRI_CONTRAST_PRESETS.find((s) => s.id === contrastPreset) ?? MRI_CONTRAST_PRESETS[0],
    [contrastPreset]
  );

  // Close W/L dropdown on outside click
  useEffect(() => {
    if (!wlMenuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (wlPopoverRef.current && !wlPopoverRef.current.contains(e.target as Node)) {
        setWlMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [wlMenuOpen]);

  const recomputeSpotlight = useCallback(() => {
    const nv = nvRef.current;
    const canvas = canvasRef.current;
    const p = propsRef.current;
    if (canvas) {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      setCanvasBox((prev) => (prev.w === cw && prev.h === ch ? prev : { w: cw, h: ch }));
    }

    if (
      !nv ||
      !canvas ||
      !baseLoadedRef.current ||
      !nv.volumes[0] ||
      !p.showTargetPointer ||
      p.hideTargetForQuiz ||
      !p.targetRasMm
    ) {
      setSpotlight((prev) =>
        prev.visible || prev.offSlice ? { x: 0, y: 0, visible: false, offSlice: false } : prev
      );
      return;
    }

    const cur = currentMmRef.current;
    const tgt = p.targetRasMm;
    const perpDist =
      p.planeMode === 'multiplanar'
        ? 0
        : p.planeMode === 'coronal'
          ? Math.abs(cur[1] - tgt[1])
          : p.planeMode === 'axial'
            ? Math.abs(cur[2] - tgt[2])
            : Math.abs(cur[0] - tgt[0]);

    if (perpDist > 10.5) {
      setSpotlight((prev) =>
        !prev.offSlice || prev.visible ? { x: 0, y: 0, visible: false, offSlice: true } : prev
      );
      return;
    }

    const pMain = projectRas(tgt);
    if (!pMain) {
      setSpotlight((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const stepVec: [number, number, number] =
      p.planeMode === 'axial' ? [tgt[0] + 10, tgt[1], tgt[2]] : [tgt[0], tgt[1], tgt[2] + 10];
    const pStep = projectRas(stepVec);
    if (pStep) {
      const measured = Math.max(1.5, Math.min(18, Math.hypot(pStep[0] - pMain[0], pStep[1] - pMain[1]) / 10));
      setPxPerMm((prev) => (Math.abs(prev - measured) < 0.08 ? prev : measured));
    }

    const [x, y] = pMain;
    const inBounds =
      x >= 10 &&
      x <= canvas.clientWidth - 10 &&
      y >= 10 &&
      y <= canvas.clientHeight - 10;

    setSpotlight((prev) => {
      if (
        prev.visible === inBounds &&
        prev.offSlice === false &&
        Math.abs(prev.x - x) < 0.7 &&
        Math.abs(prev.y - y) < 0.7
      ) {
        return prev;
      }
      return { x, y, visible: inBounds, offSlice: false };
    });

    const panSig = `${Array.from(nv.scene.pan2Dxyzmm)
      .map((v) => v.toFixed(2))
      .join(',')}|${canvas.clientWidth}x${canvas.clientHeight}`;
    if (p.hasAnnotations || panSig !== lastPanSigRef.current) {
      lastPanSigRef.current = panSig;
      setRenderTick((t) => (t + 1) % 10000);
    }
  }, [projectRas]);

  const syncSliceReadout = useCallback((nv: Niivue, fracPos: number[]) => {
    const plane = propsRef.current.planeMode;
    const axisIdx = plane === 'coronal' ? 1 : plane === 'axial' ? 2 : 0;
    const dims = nv.volumes[0]?.hdr?.dims;
    const total = Math.max(1, Math.round(dims?.[axisIdx + 1] ?? (axisIdx === 0 ? 96 : 512)));
    const rawFrac = fracPos[axisIdx];
    if (typeof rawFrac === 'number') {
      const clamped = Math.max(0, Math.min(1, rawFrac));
      setSliceFrac(Number(clamped.toFixed(3)));
      const idx = Math.max(1, Math.min(total, Math.round(clamped * (total - 1)) + 1));
      setSliceInfo((prev) => (prev.index === idx && prev.total === total ? prev : { index: idx, total }));
    }
  }, []);

  const stepSliceBy = useCallback(
    (deltaSteps: number, clientX?: number, clientY?: number) => {
      const nv = nvRef.current;
      const canvas = canvasRef.current;
      if (!nv || !baseLoadedRef.current || !nv.volumes[0] || !canvas || deltaSteps === 0) return;

      const plane = propsRef.current.planeMode;
      let axisIdx = plane === 'coronal' ? 1 : plane === 'axial' ? 2 : 0;

      if (
        plane === 'multiplanar' &&
        typeof clientX === 'number' &&
        typeof clientY === 'number' &&
        nv.screenSlices?.length
      ) {
        const rect = canvas.getBoundingClientRect();
        const devX = (clientX - rect.left) * (canvas.width / Math.max(1, rect.width));
        const devY = (clientY - rect.top) * (canvas.height / Math.max(1, rect.height));
        for (const tile of nv.screenSlices) {
          if (tile.axCorSag > SLICE_TYPE.SAGITTAL || !tile.leftTopWidthHeight?.length) continue;
          let left = tile.leftTopWidthHeight[0];
          const top = tile.leftTopWidthHeight[1];
          let width = tile.leftTopWidthHeight[2];
          const height = tile.leftTopWidthHeight[3];
          if (width < 0) {
            left += width;
            width = -width;
          }
          if (devX >= left && devX <= left + width && devY >= top && devY <= top + height) {
            axisIdx = 2 - tile.axCorSag;
            break;
          }
        }
      }

      const dims = nv.volumes[0].hdr?.dims;
      const total = Math.max(1, Math.round(dims?.[axisIdx + 1] ?? (axisIdx === 0 ? 96 : 512)));
      const fracPerStep = axisIdx === 0 ? 1 / total : 2 / total;
      const pos = [...nv.scene.crosshairPos] as [number, number, number];
      pos[axisIdx] = Math.max(0.01, Math.min(0.99, pos[axisIdx] + deltaSteps * fracPerStep));
      nv.scene.crosshairPos = pos;
      nv.drawScene();
      nv.createOnLocationChange();
      syncSliceReadout(nv, pos);
    },
    [syncSliceReadout]
  );

  // Initialize NiiVue once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;

    const nv = new Niivue({
      backColor: [0.01, 0.015, 0.028, 1],
      crosshairColor: [0.49, 0.83, 0.99, 0.62],
      crosshairWidth: 0,
      show3Dcrosshair: false,
      isSliceMM: true,
      isRadiologicalConvention: true,
      sagittalNoseLeft: true,
      isCornerOrientationText: false,
      isOrientationTextVisible: true,
      textHeight: 0.028,
      fontColor: [0.86, 0.9, 0.96, 0.84],
      scrollRequiresFocus: false,
      dragMode: DRAG_MODE.windowing,
      dragModePrimary: DRAG_MODE.none,
      mouseEventConfig: {
        leftButton: {
          primary: DRAG_MODE.none,
          withShift: DRAG_MODE.pan,
        },
        rightButton: DRAG_MODE.windowing,
        centerButton: DRAG_MODE.pan,
      },
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
      currentMmRef.current = mm;

      if (loc.frac) {
        syncSliceReadout(nv, loc.frac as number[]);
      } else {
        syncSliceReadout(nv, Array.from(nv.scene.crosshairPos));
      }

      if (!suppressingSyncRef.current) {
        propsRef.current.onRasCrosshairChange(mm);
      }
      recomputeSpotlight();
    };

    (async () => {
      try {
        await nv.attachToCanvas(canvas);
        if (disposed) return;
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
        const match = PLANE_OPTIONS.find((opt) => opt.id === propsRef.current.planeMode);
        if (match) nv.setSliceType(match.sliceType);

        const ras = propsRef.current.targetRasMm;
        if (ras && nv.volumes[0]) {
          suppressingSyncRef.current = true;
          const frac = nv.mm2frac(ras);
          nv.scene.crosshairPos = [
            Math.max(0.02, Math.min(0.98, frac[0])),
            Math.max(0.02, Math.min(0.98, frac[1])),
            Math.max(0.02, Math.min(0.98, frac[2])),
          ];
          currentMmRef.current = ras;
          applyCenteredZoom(nv, propsRef.current.mriZoom, ras);
          nv.updateGLVolume();
          nv.drawScene();
          nv.createOnLocationChange();
          window.requestAnimationFrame(() => recomputeSpotlight());
          window.setTimeout(() => {
            suppressingSyncRef.current = false;
          }, 50);
        } else {
          applyCenteredZoom(nv, propsRef.current.mriZoom, null);
          nv.updateGLVolume();
          syncSliceReadout(nv, Array.from(nv.scene.crosshairPos));
        }
        setLoading(false);
      } catch (err) {
        if (!disposed) {
          setErrorMsg(err instanceof Error ? err.message : 'Unable to load 3T qDESS MRI volume');
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
  }, [recomputeSpotlight, syncSliceReadout]);

  // ResizeObserver + PACS Wheel Slice Scroll, Cine-Stack Left-Drag & Structure Pick
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let downPos: { x: number; y: number } | null = null;
    let cineDragging = false;
    let lastCineY = 0;
    let cineAccumY = 0;
    let panDragging = false;
    let pointerMoved = false;

    const handleCleanClick = (clientX: number, clientY: number) => {
      const nv = nvRef.current;
      if (!nv || !baseLoadedRef.current || !nv.volumes[0] || suppressingSyncRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const dprX = canvas.width / Math.max(1, rect.width);
      const dprY = canvas.height / Math.max(1, rect.height);
      const texFrac = nv.canvasPos2frac([
        (clientX - rect.left) * dprX,
        (clientY - rect.top) * dprY,
      ]);
      if (!texFrac || texFrac[0] < 0) return;

      const mmRaw = nv.frac2mm(texFrac);
      const mm: [number, number, number] = [mmRaw[0], mmRaw[1], mmRaw[2]];
      const p = propsRef.current;
      let pickedId: StructureId | null = null;

      if (loadedOverlayFileRef.current === 'atlas' && nv.volumes[1]?.img && nv.volumes[1]?.hdr) {
        const vox = nv.frac2vox(texFrac, 1);
        const dims = nv.volumes[1].hdr.dims;
        const nx = dims?.[1] ?? 0;
        const ny = dims?.[2] ?? 0;
        const nz = dims?.[3] ?? 0;
        const ix = Math.round(vox[0]);
        const iy = Math.round(vox[1]);
        const iz = Math.round(vox[2]);
        if (ix >= 0 && ix < nx && iy >= 0 && iy < ny && iz >= 0 && iz < nz) {
          const labelVal = Math.round(nv.volumes[1].img[ix + iy * nx + iz * nx * ny] ?? 0);
          pickedId = LABEL_INDEX_TO_ID[labelVal] ?? null;
        }
      }

      if (!pickedId) {
        pickedId = findNearestLandmarkStructure(
          mm,
          p.landmarks,
          p.hideTargetForQuiz ? p.quizCandidateStructures : undefined,
          p.hideTargetForQuiz ? 22 : 18
        );
      }

      if (pickedId) {
        if (p.hideTargetForQuiz && p.onQuizMriClick) {
          p.onQuizMriClick(pickedId);
        } else {
          p.onSelectStructureFromMri(pickedId);
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
      pointerMoved = false;
      if (e.button === 0 && !e.shiftKey && !e.ctrlKey && mouseToolRef.current === 'scroll') {
        cineDragging = true;
        lastCineY = e.clientY;
        cineAccumY = 0;
        panDragging = false;
      } else {
        cineDragging = false;
        panDragging = true;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (downPos && !pointerMoved) {
        if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) >= 4) {
          pointerMoved = true;
        }
      }
      if (cineDragging) {
        const dy = e.clientY - lastCineY;
        lastCineY = e.clientY;
        cineAccumY += dy;
        const steps = Math.trunc(cineAccumY / 5);
        if (steps !== 0) {
          cineAccumY -= steps * 5;
          stepSliceBy(steps, e.clientX, e.clientY);
        }
      } else if (panDragging) {
        recomputeSpotlight();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasClick = downPos !== null && !pointerMoved && e.button === 0;
      downPos = null;
      cineDragging = false;
      panDragging = false;
      if (wasClick) {
        handleCleanClick(e.clientX, e.clientY);
      }
      window.requestAnimationFrame(() => recomputeSpotlight());
    };

    const onWheelCapture = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY < 0 ? 0.18 : -0.18;
        propsRef.current.onMriZoomChange(clampZoom(propsRef.current.mriZoom + delta));
        return;
      }

      const normDelta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      wheelAccumRef.current += normDelta;
      const steps = Math.trunc(wheelAccumRef.current / 20);
      if (steps !== 0) {
        wheelAccumRef.current -= steps * 20;
        stepSliceBy(steps, e.clientX, e.clientY);
      }
    };

    const ro = new ResizeObserver(() => {
      if (wrap.clientWidth < 40 || wrap.clientHeight < 40) return;
      const nv = nvRef.current;
      if (nv && readyRef.current) {
        nv.resizeListener?.();
        nv.drawScene();
        recomputeSpotlight();
        window.requestAnimationFrame(() => recomputeSpotlight());
      }
    });
    ro.observe(wrap);

    canvas.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    wrap.addEventListener('wheel', onWheelCapture, { capture: true, passive: false });

    return () => {
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      wrap.removeEventListener('wheel', onWheelCapture, { capture: true });
    };
  }, [recomputeSpotlight, stepSliceBy]);

  // Left-Mouse Tool Mode Sync (Scroll vs Pan; Right-Drag stays Window/Level, Shift/Middle stays Pan)
  useEffect(() => {
    const nv = nvRef.current;
    if (!nv || !readyRef.current) return;
    const primary = mouseTool === 'pan' ? DRAG_MODE.pan : DRAG_MODE.none;
    nv.opts.dragModePrimary = primary;
    nv.setMouseEventConfig({
      leftButton: {
        primary,
        withShift: DRAG_MODE.pan,
      },
      rightButton: DRAG_MODE.windowing,
      centerButton: DRAG_MODE.pan,
    });
  }, [mouseTool]);

  // W/L Preset Sync
  useEffect(() => {
    const nv = nvRef.current;
    if (!nv || !baseLoadedRef.current || !nv.volumes[0]) return;
    const wl = landmarks?.wlPresets?.[contrastPreset] ?? {
      min: presetMeta.defaultMin,
      max: presetMeta.defaultMax,
    };
    nv.volumes[0].cal_min = wl.min;
    nv.volumes[0].cal_max = wl.max;
    nv.updateGLVolume();
  }, [contrastPreset, landmarks, presetMeta, loading]);

  // Plane Mode Sync (Hide center crosshair in single-plane views; show in MPR)
  useEffect(() => {
    const nv = nvRef.current;
    if (!nv || !readyRef.current) return;
    const match = PLANE_OPTIONS.find((p) => p.id === planeMode);
    if (match) {
      nv.opts.crosshairWidth = planeMode === 'multiplanar' ? 0.55 : 0;
      nv.setSliceType(match.sliceType);
      applyCenteredZoom(nv, propsRef.current.mriZoom, currentMmRef.current ?? propsRef.current.targetRasMm);
      nv.drawScene();
      syncSliceReadout(nv, Array.from(nv.scene.crosshairPos));
      window.requestAnimationFrame(() => recomputeSpotlight());
    }
  }, [planeMode, recomputeSpotlight, syncSliceReadout]);

  // Segmentation Overlay Sync
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
          // Safe fallback if interrupted mid-load
        }
      } else if (nv.volumes[1]) {
        nv.setOpacity(1, segOpacity);
      }
    };

    syncOverlay();
    return () => {
      cancelled = true;
    };
  }, [overlayMode, segOpacity, loading]);

  // Crosshair Jump on Explicit Target Focus (Sidebar / Pathology Step / Quiz / Guide Link)
  useEffect(() => {
    const nv = nvRef.current;
    const ras = propsRef.current.targetRasMm;
    if (!nv || !baseLoadedRef.current || !nv.volumes[0] || !ras) return;
    suppressingSyncRef.current = true;
    const frac = nv.mm2frac(ras);
    nv.scene.crosshairPos = [
      Math.max(0.01, Math.min(0.99, frac[0])),
      Math.max(0.01, Math.min(0.99, frac[1])),
      Math.max(0.01, Math.min(0.99, frac[2])),
    ];
    currentMmRef.current = ras;
    applyCenteredZoom(nv, propsRef.current.mriZoom, ras);
    nv.drawScene();
    nv.createOnLocationChange();
    window.requestAnimationFrame(() => recomputeSpotlight());
    window.setTimeout(() => {
      suppressingSyncRef.current = false;
    }, 50);
  }, [focusTrigger, recomputeSpotlight]);

  // Zoom Change Centered Around Current Slice Position (Preserves User Scroll Position)
  useEffect(() => {
    const nv = nvRef.current;
    if (!nv || !baseLoadedRef.current || !nv.volumes[0]) return;
    const curMm = nv.frac2mm(nv.scene.crosshairPos);
    const focusMm: [number, number, number] = [curMm[0], curMm[1], curMm[2]];
    applyCenteredZoom(nv, mriZoom, focusMm);
    nv.drawScene();
    window.requestAnimationFrame(() => recomputeSpotlight());
  }, [mriZoom, recomputeSpotlight]);

  // Refresh Target Spotlight When Picking Structures Directly Without Jumping Slice
  useEffect(() => {
    window.requestAnimationFrame(() => recomputeSpotlight());
  }, [targetRasMm, recomputeSpotlight]);

  // Refresh vector overlay positions immediately whenever sub-step annotations change or initial volume load finishes
  useEffect(() => {
    window.requestAnimationFrame(() => recomputeSpotlight());
  }, [mriAnnotations, recomputeSpotlight]);

  useEffect(() => {
    if (!loading) {
      window.requestAnimationFrame(() => recomputeSpotlight());
    }
  }, [loading, recomputeSpotlight]);

  // Reflow persistent NiiVue canvas immediately when un-hidden from /3d or /report-guide
  useEffect(() => {
    if (hidden) return;
    const id = window.requestAnimationFrame(() => {
      const nv = nvRef.current;
      const wrap = wrapRef.current;
      if (!nv || !readyRef.current || !wrap || wrap.clientWidth < 40) return;
      nv.resizeListener?.();
      nv.drawScene();
      recomputeSpotlight();
    });
    return () => window.cancelAnimationFrame(id);
  }, [hidden, recomputeSpotlight]);

  // Keyboard shortcut O toggles Anatomy Colors
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'o') {
        setOverlayMode((m) => (m === 'none' ? 'atlas' : 'none'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOverlayMode]);

  const jumpToTargetSlice = () => {
    const nv = nvRef.current;
    if (!nv || !baseLoadedRef.current || !nv.volumes[0] || !targetRasMm) return;
    const frac = nv.mm2frac(targetRasMm);
    nv.scene.crosshairPos = [
      Math.max(0.01, Math.min(0.99, frac[0])),
      Math.max(0.01, Math.min(0.99, frac[1])),
      Math.max(0.01, Math.min(0.99, frac[2])),
    ];
    currentMmRef.current = targetRasMm;
    applyCenteredZoom(nv, mriZoom, targetRasMm);
    nv.drawScene();
    nv.createOnLocationChange();
    window.requestAnimationFrame(() => recomputeSpotlight());
  };

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
    syncSliceReadout(nv, pos);
  };

  return (
    <section className="stage-pane" aria-label="In-Vivo 3T Knee qDESS MRI Viewer">
      {/* Simplified Header: Plane Tabs + Target Pointer + Colors + W/L Popover */}
      <header className="pane-header">
        <div className="pane-title-group">
          <span className="pane-title">3T qDESS MRI</span>
          <span className="pane-badge">{presetMeta.shortLabel}</span>
        </div>

        <div className="pane-actions">
          <div className="segmented-pill" role="tablist" aria-label="MRI imaging plane">
            {PLANE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={planeMode === opt.id}
                className={`pill-btn ${planeMode === opt.id ? 'active' : ''}`}
                onClick={() => onPlaneModeChange(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {!hideTargetForQuiz && (
            <button
              type="button"
              className={`chip-btn ${showTargetPointer ? 'active' : ''}`}
              onClick={onToggleTargetPointer}
              title="Toggle on-MRI pathology & directional overlays (H)"
            >
              <Crosshair size={13} />
              <span>Overlays</span>
            </button>
          )}

          <div className="popover-anchor" ref={wlPopoverRef}>
            <button
              type="button"
              className={`chip-btn ${wlMenuOpen ? 'active' : ''}`}
              onClick={() => setWlMenuOpen((v) => !v)}
              aria-expanded={wlMenuOpen}
              title="Window/Level & Color Segmentation Overlay"
            >
              <SlidersHorizontal size={13} />
              <span>W/L</span>
              <ChevronDown size={12} />
            </button>

            {wlMenuOpen && (
              <div className="popover-panel" role="dialog" aria-label="Window Level and Overlays">
                <div className="popover-section">
                  <div className="popover-heading">Window / Level Presets</div>
                  <div className="wl-list">
                    {MRI_CONTRAST_PRESETS.map((wl) => (
                      <button
                        key={wl.id}
                        type="button"
                        className={`wl-option ${wl.id === contrastPreset ? 'active' : ''}`}
                        onClick={() => {
                          onContrastChange(wl.id);
                          setWlMenuOpen(false);
                        }}
                      >
                        <span className="wl-name">{wl.label}</span>
                        <span className="wl-spec">{wl.spec}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="popover-section">
                  <div className="popover-heading">Color Overlay Mode</div>
                  <div className="camera-grid">
                    {(
                      [
                        ['none', 'Clean Grayscale'],
                        ['atlas', '16-Tissue Atlas'],
                        ['subregions', 'OA Subregions'],
                      ] as Array<[MriOverlayMode, string]>
                    ).map(([modeId, lbl]) => (
                      <button
                        key={modeId}
                        type="button"
                        className={`mini-chip ${overlayMode === modeId ? 'active' : ''}`}
                        onClick={() => setOverlayMode(modeId)}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>

                  {overlayMode !== 'none' && (
                    <label className="opacity-row">
                      <span>Opacity ({Math.round(segOpacity * 100)}%)</span>
                      <input
                        type="range"
                        min={0.1}
                        max={0.75}
                        step={0.05}
                        value={segOpacity}
                        onChange={(e) => setSegOpacity(Number(e.target.value))}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MRI Canvas Viewport + On-MRI Target Spotlight Ring */}
      <div className="mri-canvas-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} className="mri-canvas" data-tool={mouseTool} />

        {loading && !errorMsg && (
          <div className="viewport-status">
            <span>Loading 3T qDESS MRI volume…</span>
          </div>
        )}
        {errorMsg && (
          <div className="viewport-status error">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* RAS-Registered MRI Pathology Arrows, Tear Clefts & Edema Overlays */}
        {!loading && (
          <MriPathologyOverlay
            annotations={mriAnnotations}
            visible={showTargetPointer && !hideTargetForQuiz}
            offSlice={spotlight.offSlice}
            width={canvasBox.w}
            height={canvasBox.h}
            pxPerMm={pxPerMm}
            projectRas={projectRas}
          />
        )}

        {/* Spotlight Ring & Label when viewing normal structures without custom vector diagram */}
        {!loading &&
          showTargetPointer &&
          !hideTargetForQuiz &&
          mriAnnotations.length === 0 &&
          spotlight.visible && (
            <div
              className="mri-spotlight-overlay"
              style={{
                left: `${spotlight.x}px`,
                top: `${spotlight.y}px`,
              }}
              aria-hidden="true"
            >
              <div className="mri-spotlight-ring" />
              {targetBadge && (
                <div className="mri-spotlight-badge">{targetBadge}</div>
              )}
            </div>
          )}

        {/* Off-Slice Quick Return */}
        {!loading && showTargetPointer && !hideTargetForQuiz && spotlight.offSlice && (
          <button
            type="button"
            className="mri-jump-btn"
            onClick={jumpToTargetSlice}
          >
            <Crosshair size={12} />
            <span>Jump to {targetBadge ?? 'Target'} Slice</span>
          </button>
        )}
      </div>

      {/* Bottom Scrubber + Scroll/Pan Mode + Landmark-Centered Zoom Bar */}
      <footer className="mri-footer-bar">
        <div className="slice-control">
          <span className="footer-label">
            Slice {sliceInfo.index}/{sliceInfo.total}
          </span>
          <input
            type="range"
            className="slice-slider"
            min={0.01}
            max={0.99}
            step={0.004}
            value={sliceFrac}
            onChange={(e) => handleSliceScrub(Number(e.target.value))}
            aria-label="Scroll MRI slices"
          />
        </div>

        <div className="mri-footer-right">
          <div className="segmented-pill mini-seg" role="group" aria-label="Left mouse tool">
            <button
              type="button"
              className={`pill-btn ${mouseTool === 'scroll' ? 'active' : ''}`}
              onClick={() => setMouseTool('scroll')}
              title="Left-drag or mouse wheel scrolls slices (Shift+Drag pans)"
            >
              Scroll
            </button>
            <button
              type="button"
              className={`pill-btn ${mouseTool === 'pan' ? 'active' : ''}`}
              onClick={() => setMouseTool('pan')}
              title="Left-drag pans zoomed MRI (wheel still scrolls slices)"
            >
              Pan
            </button>
          </div>

          <div className="zoom-pill" role="group" aria-label="MRI zoom controls">
            <button
              type="button"
              className="zoom-btn"
              onClick={() => onMriZoomChange(clampZoom(mriZoom - 0.25))}
              title="Zoom out MRI"
              aria-label="Zoom out MRI"
            >
              <Minus size={12} />
            </button>
            <span className="zoom-readout">{mriZoom.toFixed(1)}×</span>
            <button
              type="button"
              className="zoom-btn"
              onClick={() => onMriZoomChange(clampZoom(mriZoom + 0.25))}
              title="Zoom in MRI onto target (Ctrl+Wheel)"
              aria-label="Zoom in MRI"
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              className="zoom-reset-btn"
              onClick={() => onMriZoomChange(1.0)}
              title="Fit full knee FOV"
            >
              <Maximize2 size={11} />
              <span>Fit</span>
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}
