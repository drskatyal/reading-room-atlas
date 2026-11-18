import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Compass,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  Scan,
} from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  applyBoneOsteologyShading,
  createAnatomyTextureBank,
  createStudioVignetteTexture,
  createTissueMaterial,
  syncSpecimenMaterialsAndVisibility,
  type AnatomyTextureBank,
} from '../core/anatomyMaterials';
import { rasToThree } from '../core/coordinates';
import {
  createDeclarativePathologySystem,
  createPathologyOverlaySystem,
  type PathologyOverlaySystem,
} from '../core/pathologyMeshes';
import type {
  CameraPresetKey,
  JointAtlasDefinition,
  KneeKinematics,
  KneeLandmarks,
  KneeModuleId,
  MeniscalTearMorphology,
  MriPlaneMode,
  SpecimenViewMode,
  StructureId,
  ThemeMode,
  TissueVisibility,
} from '../types/atlas';

interface KneeSpecimen3DProps {
  jointDef: JointAtlasDefinition;
  landmarks: KneeLandmarks | null;
  moduleId: KneeModuleId;
  subStepId: string;
  meniscalTearMorphology?: MeniscalTearMorphology;
  targetRasOverride?: [number, number, number];
  targetBadge?: string;
  viewMode: SpecimenViewMode;
  onChangeViewMode: (mode: SpecimenViewMode) => void;
  visibility: TissueVisibility;
  enabledStructures?: ReadonlySet<StructureId>;
  paused?: boolean;
  cameraPreset: CameraPresetKey;
  cameraDistanceScale?: number;
  cameraTrigger: number;
  onSelectCameraPreset: (preset: CameraPresetKey) => void;
  activeStructure: StructureId;
  onSelectStructure: (id: StructureId) => void;
  flexionDeg: number;
  kinematics: KneeKinematics;
  showAllLabels: boolean;
  onToggleAllLabels: () => void;
  showSlicePlane: boolean;
  onToggleSlicePlane: () => void;
  mriSliceRas: [number, number, number];
  mriPlane: MriPlaneMode;
  theme: ThemeMode;
  hideLabels?: boolean;
  isFullScreenPage?: boolean;
  onToggleFullScreenPage?: () => void;
  onQuizStructureClick?: (id: StructureId) => void;
}

function computeFramedCamera(
  jointDef: JointAtlasDefinition,
  presetKey: CameraPresetKey,
  distanceScale: number,
  moduleId: KneeModuleId,
  activeStructure: StructureId,
  container: HTMLDivElement | null
): { pos: THREE.Vector3; target: THREE.Vector3 } {
  const presets = jointDef.cameraPresets;
  const preset = presets[presetKey] ?? presets.anterior;
  const target = new THREE.Vector3(...preset.target);
  const basePos = new THREE.Vector3(...preset.pos);

  // When focusing knee patellar dislocation or extensor structures, elevate framing to patellofemoral zone
  if (
    jointDef.id === 'knee' &&
    (moduleId === 'patellar-dislocation' ||
      activeStructure === 'Patella' ||
      activeStructure === 'PatellarCartilage' ||
      activeStructure === 'QuadricepsTendon')
  ) {
    if (presetKey === 'medial') {
      target.set(0.25, 1.08, 0.9);
      basePos.set(7.6, 1.65, 2.6);
    } else if (presetKey === 'lateral') {
      target.set(-0.25, 1.08, 0.9);
      basePos.set(-7.6, 1.65, 2.6);
    } else {
      target.set(-0.05, 1.05, 0.85);
      basePos.set(0.25, 1.75, 8.2);
    }
  }

  const cw = container?.clientWidth ?? 640;
  const ch = container?.clientHeight ?? 640;
  const aspect = Math.max(0.45, cw / Math.max(1, ch));
  const safeScale = Math.max(0.96, distanceScale);
  const aspectFactor = aspect < 1.0 ? Math.min(1.65, 1.04 / aspect) : 1.0;

  const offset = basePos.sub(target).multiplyScalar(safeScale * aspectFactor);
  return { pos: target.clone().add(offset), target };
}

function isStructureId(val: string, jointDef: JointAtlasDefinition): val is StructureId {
  return val in jointDef.structuresInfo;
}

function getEffectiveVisibility(
  base: TissueVisibility,
  viewMode: SpecimenViewMode,
  moduleId: KneeModuleId
) {
  return {
    bones: base.bones,
    xrayBones: viewMode === 'joint-interior',
    extensor:
      viewMode === 'plateau-topdown' || viewMode === 'cartilage-map'
        ? false
        : viewMode === 'joint-interior'
          ? moduleId === 'patellar-dislocation'
          : base.extensor,
    cartilage: viewMode === 'cartilage-map' ? true : base.cartilage,
    thicknessMap: viewMode === 'cartilage-map',
    menisci: base.menisci,
    cruciates: base.cruciates,
    collaterals: base.collaterals,
    plateauDissection: viewMode === 'plateau-topdown',
  };
}

export function KneeSpecimen3D({
  jointDef,
  landmarks,
  moduleId,
  subStepId,
  meniscalTearMorphology,
  targetRasOverride,
  targetBadge,
  viewMode,
  onChangeViewMode,
  visibility,
  enabledStructures,
  paused = false,
  cameraPreset,
  cameraDistanceScale = 1.0,
  cameraTrigger,
  onSelectCameraPreset,
  activeStructure,
  onSelectStructure,
  flexionDeg,
  kinematics,
  showAllLabels,
  onToggleAllLabels,
  showSlicePlane,
  onToggleSlicePlane,
  mriSliceRas,
  mriPlane,
  theme,
  hideLabels = false,
  isFullScreenPage = false,
  onToggleFullScreenPage,
  onQuizStructureClick,
}: KneeSpecimen3DProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const layersRef = useRef<HTMLDivElement | null>(null);
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);

  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const viewModes = useMemo<Array<{ id: SpecimenViewMode; label: string }>>(() => {
    const base: Array<{ id: SpecimenViewMode; label: string }> = [
      { id: 'solid', label: 'Solid' },
      { id: 'joint-interior', label: 'X-Ray Bone' },
    ];
    if (jointDef.supportsPlateauView) {
      base.push({ id: 'plateau-topdown', label: 'Plateau Top' });
    }
    if (jointDef.supportsCartilageMap) {
      base.push({ id: 'cartilage-map', label: 'Cartilage mm' });
    }
    return base;
  }, [jointDef.supportsPlateauView, jointDef.supportsCartilageMap]);

  const focusedLabel = useMemo(() => {
    if (targetBadge) return targetBadge;
    return jointDef.structuresInfo[activeStructure]?.shortLabel ?? activeStructure;
  }, [targetBadge, activeStructure, jointDef.structuresInfo]);

  const focusedLabelRef = useRef(focusedLabel);
  focusedLabelRef.current = focusedLabel;

  const hoveredStructureRef = useRef<StructureId | null>(null);
  const calloutLayerRef = useRef<HTMLDivElement | null>(null);
  const calloutLineRef = useRef<SVGLineElement | null>(null);
  const calloutDotRef = useRef<SVGCircleElement | null>(null);
  const calloutBadgeRef = useRef<HTMLDivElement | null>(null);
  const allPinsLayerRef = useRef<HTMLDivElement | null>(null);
  const pinButtonsRef = useRef<Map<StructureId, HTMLButtonElement>>(new Map());

  // Latest props ref for rAF loop (zero React re-renders during drag/orbit)
  const stateRef = useRef({
    jointDef,
    moduleId,
    subStepId,
    meniscalTearMorphology,
    targetRasOverride,
    viewMode,
    visibility,
    enabledStructures,
    paused,
    activeStructure,
    kinematics,
    showAllLabels,
    showSlicePlane,
    mriSliceRas,
    mriPlane,
    hideLabels,
    landmarks,
  });
  stateRef.current = {
    jointDef,
    moduleId,
    subStepId,
    meniscalTearMorphology,
    targetRasOverride,
    viewMode,
    visibility,
    enabledStructures,
    paused,
    activeStructure,
    kinematics,
    showAllLabels,
    showSlicePlane,
    mriSliceRas,
    mriPlane,
    hideLabels,
    landmarks,
  };

  const callbacksRef = useRef({ onSelectStructure, onQuizStructureClick });
  callbacksRef.current = { onSelectStructure, onQuizStructureClick };

  const sceneRefs = useRef<{
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    renderer: THREE.WebGLRenderer;
    meshes: Map<string, THREE.Mesh>;
    materials: Map<string, THREE.MeshPhysicalMaterial>;
    xrayUniform: { uXrayMode: { value: number } };
    clipPlane: THREE.Plane;
    textureBank: AnatomyTextureBank;
    femurGroup: THREE.Group;
    tibiaPivotGroup: THREE.Group;
    tibiaTranslationGroup: THREE.Group;
    tibiaScrewGroup: THREE.Group;
    tibiaBodyGroup: THREE.Group;
    medialMeniscusGroup: THREE.Group;
    patellaGroup: THREE.Group;
    focusedTargetAnchor: THREE.Object3D;
    kneePathologySystem: PathologyOverlaySystem | null;
    declarativePathologySystem: PathologyOverlaySystem | null;
    slicePlaneMesh: THREE.Mesh;
    sliceOutline: THREE.LineLoop;
    vignetteMat: THREE.MeshBasicMaterial;
    animTargetPos: THREE.Vector3 | null;
    animTargetLook: THREE.Vector3 | null;
    syncSize: () => void;
    wake: (frames?: number) => void;
    dirtyShadow: () => void;
    tibiaPivotVec: THREE.Vector3;
    tibiaPivotAxis: THREE.Vector3;
    patellaCenterVec: THREE.Vector3;
    loadGen: number;
  } | null>(null);

  // Close layers popover on outside click
  useEffect(() => {
    if (!layersMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (layersRef.current && !layersRef.current.contains(e.target as Node)) {
        setLayersMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [layersMenuOpen]);

  // Initialize Three.js Scene + Postprocessing + GLB Load
  useEffect(() => {
    const container = stageRef.current;
    if (!container) return;

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 80);
    camera.position.set(0.22, 0.55, 8.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.89;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.domElement.className = 'specimen-canvas';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.16;
    controls.rotateSpeed = 0.95;
    controls.zoomToCursor = true;
    controls.zoomSpeed = 1.3;
    controls.panSpeed = 0.95;
    controls.minDistance = 1.2;
    controls.maxDistance = 18.0;
    controls.target.set(0.0, 0.18, 0.15);
    controls.update();

    // Environment & Surgical Suite Studio Lighting
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const hemiLight = new THREE.HemisphereLight(0xf1f5f9, 0x261f19, 0.24);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7eb, 1.48);
    keyLight.position.set(6.4, 5.4, 2.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -3.6;
    keyLight.shadow.camera.right = 3.6;
    keyLight.shadow.camera.top = 3.8;
    keyLight.shadow.camera.bottom = -3.8;
    keyLight.shadow.camera.near = 1.5;
    keyLight.shadow.camera.far = 16.0;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.018;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xc8e2f8, 0.22);
    fillLight.position.set(-5.2, 1.4, 2.8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 0.68);
    rimLight.position.set(0.4, 3.4, -6.0);
    scene.add(rimLight);

    // Subtle Studio Backdrop Sphere with vignette texture
    const vignetteTex = createStudioVignetteTexture(theme);
    const vignetteMat = new THREE.MeshBasicMaterial({
      map: vignetteTex,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const backdropDome = new THREE.Mesh(new THREE.SphereGeometry(28, 32, 24), vignetteMat);
    scene.add(backdropDome);

    // Kinematic Scene Hierarchy
    const specimenRoot = new THREE.Group();
    scene.add(specimenRoot);

    const femurGroup = new THREE.Group();
    const tibiaPivotGroup = new THREE.Group();
    const tibiaTranslationGroup = new THREE.Group();
    const tibiaScrewGroup = new THREE.Group();
    const tibiaBodyGroup = new THREE.Group();
    const medialMeniscusGroup = new THREE.Group();
    const patellaGroup = new THREE.Group();

    specimenRoot.add(femurGroup);
    specimenRoot.add(tibiaPivotGroup);
    tibiaPivotGroup.add(tibiaTranslationGroup);
    tibiaTranslationGroup.add(tibiaScrewGroup);
    tibiaScrewGroup.add(tibiaBodyGroup);
    tibiaBodyGroup.add(medialMeniscusGroup);
    specimenRoot.add(patellaGroup);

    const focusedTargetAnchor = new THREE.Object3D();
    femurGroup.add(focusedTargetAnchor);

    // Subtle MRI Slice Reference Frame in 3D
    const slicePlaneGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const slicePlaneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const slicePlaneMesh = new THREE.Mesh(slicePlaneGeo, slicePlaneMat);
    slicePlaneMesh.visible = false;
    scene.add(slicePlaneMesh);

    const outlinePts = [
      new THREE.Vector3(-2.1, -2.1, 0),
      new THREE.Vector3(2.1, -2.1, 0),
      new THREE.Vector3(2.1, 2.1, 0),
      new THREE.Vector3(-2.1, 2.1, 0),
    ];
    const sliceOutlineGeo = new THREE.BufferGeometry().setFromPoints(outlinePts);
    const sliceOutlineMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.72,
    });
    const sliceOutline = new THREE.LineLoop(sliceOutlineGeo, sliceOutlineMat);
    slicePlaneMesh.add(sliceOutline);

    // Load 3T In-Vivo Specimen GLB (single-pass hardware MSAA for 60fps OrbitControls)
    const textureBank = createAnatomyTextureBank();
    const xrayUniform = { uXrayMode: { value: 0.0 } };
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
    const meshes = new Map<string, THREE.Mesh>();
    const materials = new Map<string, THREE.MeshPhysicalMaterial>();

    let activeFrames = 60;
    const wake = (frames = 45) => {
      activeFrames = Math.max(activeFrames, frames);
    };
    const dirtyShadow = () => {
      renderer.shadowMap.needsUpdate = true;
      wake(30);
    };

    controls.addEventListener('start', () => wake(45));
    controls.addEventListener('change', () => wake(35));

    const refs = {
      camera,
      controls,
      renderer,
      meshes,
      materials,
      xrayUniform,
      clipPlane,
      textureBank,
      femurGroup,
      tibiaPivotGroup,
      tibiaTranslationGroup,
      tibiaScrewGroup,
      tibiaBodyGroup,
      medialMeniscusGroup,
      patellaGroup,
      focusedTargetAnchor,
      kneePathologySystem: null as PathologyOverlaySystem | null,
      declarativePathologySystem: null as PathologyOverlaySystem | null,
      slicePlaneMesh,
      sliceOutline,
      vignetteMat,
      animTargetPos: null as THREE.Vector3 | null,
      animTargetLook: null as THREE.Vector3 | null,
      syncSize: () => {},
      wake,
      dirtyShadow,
      tibiaPivotVec: new THREE.Vector3(0, 0.2, 0.1),
      tibiaPivotAxis: new THREE.Vector3(1, 0, 0),
      patellaCenterVec: new THREE.Vector3(-0.44, 1.47, 1.97),
      loadGen: 0,
    };
    sceneRefs.current = refs;

    // Hover & Click / Double-click raycasting
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let pointerDownPos: { x: number; y: number } | null = null;
    let lastHoverCheckMs = 0;

    const pickStructureAt = (clientX: number, clientY: number): { id: StructureId; point: THREE.Vector3 } | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const visibleTargets = Array.from(meshes.values()).filter((m) => m.visible);
      const hits = raycaster.intersectObjects(visibleTargets, false);
      const jDef = stateRef.current.jointDef;
      for (const hit of hits) {
        const raw = hit.object.userData.structureName as string;
        const mapped =
          raw === 'BucketHandleFragment' || raw === 'MedialMeniscusTruncated'
            ? 'MedialMeniscus'
            : raw;
        if (isStructureId(mapped, jDef)) {
          return { id: mapped, point: hit.point };
        }
      }
      return null;
    };

    const onPointerMove = (e: PointerEvent) => {
      // Zero raycasting while dragging/orbiting for locked 60fps pointer latency
      if (e.buttons !== 0) {
        renderer.domElement.style.cursor = 'grabbing';
        if (hoveredStructureRef.current !== null) {
          hoveredStructureRef.current = null;
        }
        wake(35);
        return;
      }

      const now = performance.now();
      if (now - lastHoverCheckMs < 75) return;
      lastHoverCheckMs = now;

      const hit = pickStructureAt(e.clientX, e.clientY);
      const nextId = hit ? hit.id : null;
      if (hoveredStructureRef.current !== nextId) {
        hoveredStructureRef.current = nextId;
        wake(6);
      }
      renderer.domElement.style.cursor = nextId ? 'pointer' : 'grab';
    };

    const onPointerDown = (e: PointerEvent) => {
      // Cancel scripted fly-to animation as soon as the user grabs the canvas
      refs.animTargetPos = null;
      refs.animTargetLook = null;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      renderer.domElement.style.cursor = 'grabbing';
      wake(40);
    };

    const onPointerUp = (e: PointerEvent) => {
      renderer.domElement.style.cursor = 'grab';
      wake(35);
      if (!pointerDownPos) return;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      pointerDownPos = null;
      if (dist > 5) return;

      const hit = pickStructureAt(e.clientX, e.clientY);
      if (hit) {
        if (callbacksRef.current.onQuizStructureClick && stateRef.current.hideLabels) {
          callbacksRef.current.onQuizStructureClick(hit.id);
        } else {
          callbacksRef.current.onSelectStructure(hit.id);
        }
      }
    };

    const onWheel = () => wake(35);

    const onDoubleClick = (e: MouseEvent) => {
      const hit = pickStructureAt(e.clientX, e.clientY);
      if (hit) {
        const dir = camera.position.clone().sub(controls.target).normalize();
        const curDist = camera.position.distanceTo(controls.target);
        const nextDist = Math.max(1.8, Math.min(curDist * 0.72, 3.6));
        refs.animTargetLook = hit.point.clone();
        refs.animTargetPos = hit.point.clone().addScaledVector(dir, nextDist);
        callbacksRef.current.onSelectStructure(hit.id);
      } else {
        const preset = stateRef.current.jointDef.cameraPresets.anterior;
        refs.animTargetPos = new THREE.Vector3(...preset.pos);
        refs.animTargetLook = new THREE.Vector3(...preset.target);
      }
      wake(50);
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });
    renderer.domElement.addEventListener('dblclick', onDoubleClick);

    const tmpWorldPos = new THREE.Vector3();
    const tmpProj = new THREE.Vector3();
    const tmpBox = new THREE.Box3();
    const tmpCenter = new THREE.Vector3();

    const projectCalloutPins = () => {
      const s = stateRef.current;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const layerEl = calloutLayerRef.current;
      const lineEl = calloutLineRef.current;
      const dotEl = calloutDotRef.current;
      const badgeEl = calloutBadgeRef.current;
      const allLayerEl = allPinsLayerRef.current;

      if (cw <= 0 || ch <= 0 || s.hideLabels || refs.meshes.size === 0) {
        if (layerEl) layerEl.style.display = 'none';
        if (allLayerEl) allLayerEl.style.display = 'none';
        return;
      }

      if (!s.showAllLabels && layerEl && lineEl && dotEl && badgeEl) {
        if (allLayerEl) allLayerEl.style.display = 'none';

        const focusStruct = s.activeStructure;
        const kCfg = s.jointDef.kinematicConfig;
        let anchorParent: THREE.Group = femurGroup;
        if (kCfg.patellaStructures?.includes(focusStruct)) {
          anchorParent = patellaGroup;
        } else if (
          kCfg.medialMeniscusStructures?.includes(focusStruct) &&
          !(s.jointDef.id === 'knee' && s.moduleId === 'bucket-handle')
        ) {
          anchorParent = medialMeniscusGroup;
        } else if (kCfg.movingStructures.includes(focusStruct)) {
          anchorParent = tibiaBodyGroup;
        }

        if (focusedTargetAnchor.parent !== anchorParent) {
          anchorParent.add(focusedTargetAnchor);
        }

        if (s.targetRasOverride && s.landmarks) {
          const tLocal = rasToThree(
            s.targetRasOverride,
            s.landmarks.jointCenterRas,
            s.landmarks.threeScale
          );
          focusedTargetAnchor.position.set(tLocal[0], tLocal[1], tLocal[2]);
        } else {
          const targetMesh =
            s.moduleId === 'bucket-handle' && focusStruct === 'MedialMeniscus'
              ? refs.meshes.get('BucketHandleFragment') ?? refs.meshes.get('MedialMeniscus')
              : refs.meshes.get(focusStruct);
          if (targetMesh) {
            if (!targetMesh.geometry.boundingBox) {
              targetMesh.geometry.computeBoundingBox();
            }
            if (targetMesh.geometry.boundingBox) {
              targetMesh.geometry.boundingBox.getCenter(tmpCenter);
              if (focusStruct === 'ACL') {
                tmpCenter.y -= 0.14;
              }
              focusedTargetAnchor.position.copy(tmpCenter);
            }
          }
        }

        focusedTargetAnchor.getWorldPosition(tmpWorldPos);
        tmpProj.copy(tmpWorldPos).project(camera);
        const px = (tmpProj.x * 0.5 + 0.5) * cw;
        const py = (-tmpProj.y * 0.5 + 0.5) * ch;
        const onScreen =
          tmpProj.z >= -1 && tmpProj.z <= 1 && px > 12 && px < cw - 12 && py > 54 && py < ch - 52;

        if (!onScreen) {
          layerEl.style.display = 'none';
        } else {
          layerEl.style.display = 'block';
          const lblText = focusedLabelRef.current;
          const estW = Math.max(96, lblText.length * 7.3 + 24);
          const placeLeft = px > cw * 0.56;
          const badgeX = placeLeft
            ? Math.max(10, Math.min(px - estW - 20, cw - estW - 12))
            : Math.max(10, Math.min(px + 24, cw - estW - 12));
          const badgeY = Math.max(py - 36, 12);
          const lineEndX = placeLeft ? badgeX + estW - 6 : badgeX + 8;

          lineEl.setAttribute('x1', px.toFixed(1));
          lineEl.setAttribute('y1', py.toFixed(1));
          lineEl.setAttribute('x2', lineEndX.toFixed(1));
          lineEl.setAttribute('y2', (badgeY + 11).toFixed(1));
          dotEl.setAttribute('cx', px.toFixed(1));
          dotEl.setAttribute('cy', py.toFixed(1));
          badgeEl.style.transform = `translate3d(${badgeX.toFixed(1)}px, ${badgeY.toFixed(1)}px, 0)`;
        }
      } else {
        if (layerEl) layerEl.style.display = 'none';
      }

      if (s.showAllLabels && allLayerEl) {
        allLayerEl.style.display = 'block';
        for (const sid of s.jointDef.allPinStructures) {
          const btn = pinButtonsRef.current.get(sid);
          if (!btn) continue;
          const m = refs.meshes.get(sid);
          if (!m || !m.visible) {
            btn.style.display = 'none';
            continue;
          }
          tmpBox.setFromObject(m);
          tmpBox.getCenter(tmpWorldPos);
          tmpProj.copy(tmpWorldPos).project(camera);
          const sx = (tmpProj.x * 0.5 + 0.5) * cw;
          const sy = (-tmpProj.y * 0.5 + 0.5) * ch;
          const vis =
            tmpProj.z >= -1 && tmpProj.z <= 1 && sx > 20 && sx < cw - 20 && sy > 58 && sy < ch - 56;
          if (!vis) {
            btn.style.display = 'none';
          } else {
            btn.style.display = 'inline-block';
            btn.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
          }
        }
      }
    };

    // ResizeObserver with synchronous re-render so frames never drop during resize
    const syncViewportSize = () => {
      if (container.clientWidth < 40 || container.clientHeight < 40) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      controls.update();
      renderer.render(scene, camera);
      projectCalloutPins();
      wake(15);
    };
    refs.syncSize = syncViewportSize;
    const ro = new ResizeObserver(syncViewportSize);
    ro.observe(container);

    // Animation Loop with smart idle sleep + zero-lag OrbitControls wake
    const clock = new THREE.Clock();
    let frameHandle = 0;
    let disposed = false;

    const animate = () => {
      if (disposed) return;
      frameHandle = window.requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.paused) return;

      const dt = Math.min(clock.getDelta(), 0.5);
      const elapsedSec = clock.elapsedTime;
      const animatingCamera = Boolean(refs.animTargetPos && refs.animTargetLook);
      if (activeFrames <= 0 && !animatingCamera) return;
      activeFrames = Math.max(0, activeFrames - 1);

      // 1. Update smooth frame-rate-independent camera fly-to animation
      if (refs.animTargetPos && refs.animTargetLook) {
        const alpha = dt >= 0.16 ? 1.0 : Math.min(1, 1 - Math.exp(-12 * dt));
        camera.position.lerp(refs.animTargetPos, alpha);
        controls.target.lerp(refs.animTargetLook, alpha);
        if (
          camera.position.distanceTo(refs.animTargetPos) < 0.035 &&
          controls.target.distanceTo(refs.animTargetLook) < 0.035
        ) {
          camera.position.copy(refs.animTargetPos);
          controls.target.copy(refs.animTargetLook);
          refs.animTargetPos = null;
          refs.animTargetLook = null;
        }
      }

      controls.update();

      // 2. Apply Knee Biomechanics + Pathology Dislocation
      const kin = s.kinematics;
      tibiaPivotGroup.quaternion.setFromAxisAngle(refs.tibiaPivotAxis, kin.flexionRad);
      tibiaTranslationGroup.position.set(0, 0, kin.anteriorTranslationThree);
      tibiaScrewGroup.rotation.set(0, THREE.MathUtils.degToRad(kin.screwHomeDeg), 0);

      medialMeniscusGroup.position.set(
        kin.medialMeniscusShiftX,
        0,
        kin.meniscusPosteriorShiftZ
      );

      // Lateral patellar subluxation tilts patella around longitudinal Y axis & shifts laterally (-X Right)
      const c = refs.patellaCenterVec;
      const tiltQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(kin.patellaTiltRad * 0.85, kin.patellaLateralTiltRad, 0, 'YXZ')
      );
      const offsetFromCenter = tmpCenter.copy(c).applyQuaternion(tiltQuat).sub(c);
      patellaGroup.quaternion.copy(tiltQuat);
      patellaGroup.position.set(
        kin.patellaLateralShiftX - offsetFromCenter.x,
        kin.patellaDropY - offsetFromCenter.y,
        kin.patellaShiftZ - offsetFromCenter.z
      );

      // 3. Update Materials & Pathology Overlays
      const effVis = getEffectiveVisibility(s.visibility, s.viewMode, s.moduleId);
      let extraDamaged: Set<string> | undefined;
      for (const spec of s.jointDef.pathology3DSpecs) {
        if (
          spec.moduleId === s.moduleId &&
          (!spec.subStepId || spec.subStepId === s.subStepId) &&
          spec.damagedStructures?.length
        ) {
          extraDamaged = extraDamaged ?? new Set<string>();
          for (const ds of spec.damagedStructures) extraDamaged.add(ds);
        }
      }

      syncSpecimenMaterialsAndVisibility({
        meshes: refs.meshes,
        materials: refs.materials,
        xrayUniform: refs.xrayUniform,
        visibility: effVis,
        enabledStructures: s.enabledStructures,
        chapterId: s.moduleId,
        activeStructure: s.activeStructure,
        hoveredStructure: hoveredStructureRef.current,
        jointDef: s.jointDef,
        extraDamagedStructures: extraDamaged,
      });

      const pState = {
        moduleId: s.moduleId,
        subStepId: s.subStepId,
        meniscalTearMorphology: s.meniscalTearMorphology,
        kinematics: kin,
        visibility: s.visibility,
        elapsedSec,
      };
      refs.kneePathologySystem?.update(pState);
      refs.declarativePathologySystem?.update(pState);

      // 4. Update MRI Slice Reference Frame in 3D
      if (s.showSlicePlane && s.landmarks) {
        slicePlaneMesh.visible = true;
        const threeSlice = rasToThree(
          s.mriSliceRas,
          s.landmarks.jointCenterRas,
          s.landmarks.threeScale
        );
        if (s.mriPlane === 'sagittal') {
          slicePlaneMesh.position.set(threeSlice[0], 0.1, 0.15);
          slicePlaneMesh.rotation.set(0, Math.PI * 0.5, 0);
        } else if (s.mriPlane === 'coronal') {
          slicePlaneMesh.position.set(0, 0.1, threeSlice[2]);
          slicePlaneMesh.rotation.set(0, 0, 0);
        } else {
          slicePlaneMesh.position.set(0, threeSlice[1], 0.15);
          slicePlaneMesh.rotation.set(Math.PI * 0.5, 0, 0);
        }
      } else {
        slicePlaneMesh.visible = false;
      }

      // 5. Render Scene (single-pass hardware MSAA)
      renderer.render(scene, camera);

      // 6. Direct DOM Projection of Active Target Callout Pin & Optional All-Pins Overlay
      projectCalloutPins();
    };

    frameHandle = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameHandle);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);

      refs.kneePathologySystem?.dispose();
      refs.declarativePathologySystem?.dispose();
      for (const mesh of meshes.values()) {
        mesh.geometry.dispose();
      }
      for (const m of materials.values()) m.dispose();
      slicePlaneGeo.dispose();
      slicePlaneMat.dispose();
      sliceOutlineGeo.dispose();
      sliceOutlineMat.dispose();
      backdropDome.geometry.dispose();
      vignetteMat.dispose();
      vignetteTex.dispose();
      textureBank.dispose();
      envTarget.dispose();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRefs.current = null;
    };
  }, []);

  // Load Joint Specimen GLB into persistent Three.js WebGL context
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;

    let cancelled = false;
    const myGen = ++refs.loadGen;

    refs.kneePathologySystem?.dispose();
    refs.kneePathologySystem = null;
    refs.declarativePathologySystem?.dispose();
    refs.declarativePathologySystem = null;

    for (const mesh of refs.meshes.values()) {
      mesh.parent?.remove(mesh);
      mesh.geometry.dispose();
    }
    for (const m of refs.materials.values()) {
      m.dispose();
    }
    refs.meshes.clear();
    refs.materials.clear();
    if (refs.focusedTargetAnchor.parent !== refs.femurGroup) {
      refs.femurGroup.add(refs.focusedTargetAnchor);
    }

    setModelReady(false);
    setLoadProgress(0);
    setLoadError(null);

    const kCfg = jointDef.kinematicConfig;
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(
      jointDef.glbUrl,
      (gltf) => {
        if (cancelled || sceneRefs.current !== refs || refs.loadGen !== myGen) {
          draco.dispose();
          return;
        }

        const lm = stateRef.current.landmarks;
        const pivotArr = lm?.transepicondylarPivot ?? kCfg.pivotFallback;
        const axisArr = lm?.transepicondylarAxis ?? kCfg.axisFallback;
        refs.tibiaPivotVec.set(pivotArr[0], pivotArr[1], pivotArr[2]);
        refs.tibiaPivotAxis.set(axisArr[0], axisArr[1], axisArr[2]).normalize();
        if (jointDef.id === 'knee' && refs.tibiaPivotAxis.x < 0) {
          refs.tibiaPivotAxis.negate();
        }
        refs.tibiaPivotGroup.position.copy(refs.tibiaPivotVec);
        refs.tibiaBodyGroup.position.copy(refs.tibiaPivotVec).negate();

        const patSet = new Set(kCfg.patellaStructures ?? []);
        const medMenSet = new Set(kCfg.medialMeniscusStructures ?? []);
        const movingSet = new Set(kCfg.movingStructures);

        const collected: Array<{ name: string; mesh: THREE.Mesh }> = [];
        gltf.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.computeVertexNormals();
            obj.geometry.computeBoundingBox();
            collected.push({ name: obj.name, mesh: obj });
          }
        });

        for (const { name, mesh } of collected) {
          if (jointDef.boneNames.includes(name)) {
            applyBoneOsteologyShading(mesh.geometry, name, jointDef.id);
          }
          const mat = createTissueMaterial(
            name,
            refs.clipPlane,
            refs.textureBank,
            refs.xrayUniform,
            jointDef
          );
          mesh.material = mat;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData.structureName = name;

          refs.meshes.set(name, mesh);
          refs.materials.set(name, mat);

          if (patSet.has(name)) {
            refs.patellaGroup.add(mesh);
          } else if (medMenSet.has(name)) {
            if (name === 'BucketHandleFragment') {
              refs.tibiaBodyGroup.add(mesh);
            } else {
              refs.medialMeniscusGroup.add(mesh);
            }
          } else if (movingSet.has(name)) {
            refs.tibiaBodyGroup.add(mesh);
          } else {
            refs.femurGroup.add(mesh);
          }
        }

        const patMesh = refs.meshes.get('Patella');
        if (patMesh) {
          patMesh.geometry.computeBoundingBox();
          const pBox = patMesh.geometry.boundingBox;
          if (pBox) pBox.getCenter(refs.patellaCenterVec);
        }

        if (jointDef.id === 'knee') {
          refs.kneePathologySystem = createPathologyOverlaySystem({
            femurGroup: refs.femurGroup,
            tibiaBodyGroup: refs.tibiaBodyGroup,
            medialMeniscusGroup: refs.medialMeniscusGroup,
            patellaGroup: refs.patellaGroup,
            meshes: refs.meshes,
            threeScale: lm?.threeScale ?? 0.04,
            laterality: lm?.laterality ?? 'Right',
          });
        }
        refs.declarativePathologySystem = createDeclarativePathologySystem(
          jointDef,
          lm,
          refs.femurGroup,
          refs.tibiaBodyGroup
        );

        draco.dispose();
        setModelReady(true);
        setLoadProgress(100);
        refs.dirtyShadow();
        refs.wake(60);
      },
      (evt) => {
        if (!cancelled && evt.total > 0) {
          setLoadProgress(Math.min(99, Math.round((evt.loaded / evt.total) * 100)));
        }
      },
      () => {
        draco.dispose();
        if (!cancelled) {
          setLoadError(`Unable to load ${jointDef.glbUrl} specimen meshes.`);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [jointDef]);

  // Theme update on vignette dome
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const oldTex = refs.vignetteMat.map;
    refs.vignetteMat.map = createStudioVignetteTexture(theme);
    refs.vignetteMat.needsUpdate = true;
    oldTex?.dispose();
    refs.wake(12);
  }, [theme]);

  // Wake rAF loop whenever clinical props, visibility, or kinematics change
  useEffect(() => {
    sceneRefs.current?.wake(18);
  }, [
    viewMode,
    visibility,
    subStepId,
    meniscalTearMorphology,
    targetRasOverride,
    targetBadge,
    showAllLabels,
    showSlicePlane,
    mriSliceRas,
    mriPlane,
    hideLabels,
  ]);

  // Mark shadow map dirty when mesh visibility or joint pose changes
  useEffect(() => {
    sceneRefs.current?.dirtyShadow();
  }, [flexionDeg, kinematics.patellaLateralShiftX, moduleId, enabledStructures]);

  // Keep pivot + declarative pathology coordinates synced if landmarks arrive after GLB load
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs || !modelReady || !landmarks) return;
    const pivotArr = landmarks.transepicondylarPivot ?? jointDef.kinematicConfig.pivotFallback;
    const axisArr = landmarks.transepicondylarAxis ?? jointDef.kinematicConfig.axisFallback;
    refs.tibiaPivotVec.set(pivotArr[0], pivotArr[1], pivotArr[2]);
    refs.tibiaPivotAxis.set(axisArr[0], axisArr[1], axisArr[2]).normalize();
    if (jointDef.id === 'knee' && refs.tibiaPivotAxis.x < 0) refs.tibiaPivotAxis.negate();
    refs.tibiaPivotGroup.position.copy(refs.tibiaPivotVec);
    refs.tibiaBodyGroup.position.copy(refs.tibiaPivotVec).negate();

    refs.declarativePathologySystem?.dispose();
    refs.declarativePathologySystem = createDeclarativePathologySystem(
      jointDef,
      landmarks,
      refs.femurGroup,
      refs.tibiaBodyGroup
    );
    refs.dirtyShadow();
  }, [landmarks, modelReady, jointDef]);

  // Fly camera when preset, focus, joint, or cameraTrigger changes
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const framed = computeFramedCamera(
      jointDef,
      cameraPreset,
      cameraDistanceScale,
      moduleId,
      activeStructure,
      stageRef.current
    );
    refs.animTargetLook = framed.target;
    refs.animTargetPos = framed.pos;
    refs.wake(50);
  }, [jointDef, cameraPreset, cameraDistanceScale, cameraTrigger, moduleId, activeStructure, modelReady]);

  const handleZoomStep = (factor: number) => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const target = refs.animTargetLook ?? refs.controls.target.clone();
    const curPos = refs.animTargetPos ?? refs.camera.position.clone();
    const offset = curPos.clone().sub(target);
    const nextDist = THREE.MathUtils.clamp(
      offset.length() * factor,
      refs.controls.minDistance,
      refs.controls.maxDistance
    );
    offset.setLength(nextDist);
    refs.animTargetLook = target;
    refs.animTargetPos = target.clone().add(offset);
    refs.wake(45);
  };

  const handleResetView = () => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const framed = computeFramedCamera(
      jointDef,
      cameraPreset,
      cameraDistanceScale,
      moduleId,
      activeStructure,
      stageRef.current
    );
    refs.animTargetLook = framed.target;
    refs.animTargetPos = framed.pos;
    refs.wake(45);
  };

  // Sync canvas dimensions cleanly when persistent WebGL pane unhides or toggles full-screen
  useEffect(() => {
    if (paused) return;
    const id = window.requestAnimationFrame(() => {
      sceneRefs.current?.syncSize();
    });
    return () => window.cancelAnimationFrame(id);
  }, [paused, isFullScreenPage]);

  return (
    <section className="stage-pane" aria-label={`Interactive 3D ${jointDef.shortName.toLowerCase()} specimen`}>
      {/* Simplified Header: Specimen View Segmented Pill + Layers Popover */}
      <header className="pane-header">
        <div className="pane-title-group">
          <span className="pane-title">3D {jointDef.shortName} Specimen</span>
          <span className="pane-badge">{landmarks?.laterality ?? 'Right'} · {jointDef.mriSpecLabel}</span>
        </div>

        <div className="pane-actions">
          <button
            type="button"
            className={`chip-btn ${viewMode === 'joint-interior' ? 'active' : ''}`}
            onClick={() =>
              onChangeViewMode(viewMode === 'joint-interior' ? 'solid' : 'joint-interior')
            }
            title="Toggle translucent X-ray bone mode"
          >
            <Scan size={13} />
            <span>X-Ray</span>
          </button>

          <div className="popover-anchor" ref={layersRef}>
            <button
              type="button"
              className={`chip-btn ${layersMenuOpen ? 'active' : ''}`}
              onClick={() => setLayersMenuOpen((v) => !v)}
              aria-expanded={layersMenuOpen}
            >
              <Compass size={13} />
              <span>View</span>
              <ChevronDown size={12} />
            </button>

            {layersMenuOpen && (
              <div className="popover-panel" role="dialog" aria-label="3D display style, camera and helpers">
                <div className="popover-section">
                  <div className="popover-heading">3D Display Style</div>
                  <div className="camera-grid two-col">
                    {viewModes.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`mini-chip ${viewMode === m.id ? 'active' : ''}`}
                        onClick={() => {
                          onChangeViewMode(m.id);
                          setLayersMenuOpen(false);
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="popover-section">
                  <div className="popover-heading">Camera Viewpoint</div>
                  <div className="camera-grid">
                    {(Object.keys(jointDef.cameraPresets) as CameraPresetKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`mini-chip ${cameraPreset === key ? 'active' : ''}`}
                        onClick={() => {
                          onSelectCameraPreset(key);
                          setLayersMenuOpen(false);
                        }}
                      >
                        {jointDef.cameraPresets[key].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="popover-section">
                  <div className="popover-heading">3D Helpers</div>
                  <div className="layer-checks">
                    <label className="check-row">
                      <input type="checkbox" checked={showAllLabels} onChange={onToggleAllLabels} />
                      <span>All Anatomy Pins (L)</span>
                    </label>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={showSlicePlane}
                        onChange={onToggleSlicePlane}
                      />
                      <span>MRI Slice Reference Plane</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {onToggleFullScreenPage && (
            <button
              type="button"
              className={`chip-btn ${isFullScreenPage ? 'active' : ''}`}
              onClick={onToggleFullScreenPage}
              title={isFullScreenPage ? 'Return to split 3D + MRI view' : 'Open full-screen 3D view'}
            >
              {isFullScreenPage ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{isFullScreenPage ? 'Exit Full 3D' : 'Full 3D'}</span>
            </button>
          )}
        </div>
      </header>

      {/* 3D Canvas Viewport */}
      <div className="viewport-body" ref={stageRef}>
        {!modelReady && !loadError && (
          <div className="viewport-status">
            <span>Loading 3T {jointDef.shortName} Mesh… {loadProgress}%</span>
          </div>
        )}
        {loadError && (
          <div className="viewport-status error">
            <span>{loadError}</span>
          </div>
        )}

        {/* Single Focused Callout Pin OR All Pins (Direct DOM Refs — zero per-frame React renders) */}
        {modelReady && !hideLabels && (
          <>
            <div
              ref={calloutLayerRef}
              className="callout-layer"
              aria-hidden="true"
              style={{ pointerEvents: 'none', display: 'none' }}
            >
              <svg className="callout-svg">
                <line
                  ref={calloutLineRef}
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={0}
                  stroke="rgba(125, 211, 252, 0.85)"
                  strokeWidth="1.5"
                />
                <circle
                  ref={calloutDotRef}
                  cx={0}
                  cy={0}
                  r="4.5"
                  fill="#38bdf8"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              </svg>
              <div ref={calloutBadgeRef} className="focused-callout-badge">
                {focusedLabel}
              </div>
            </div>

            <div
              ref={allPinsLayerRef}
              className="callout-layer"
              aria-hidden={!showAllLabels}
              style={{ display: showAllLabels ? 'block' : 'none' }}
            >
              {jointDef.allPinStructures.map((sid) => {
                const info = jointDef.structuresInfo[sid];
                if (!info) return null;
                const active = sid === activeStructure;
                return (
                  <button
                    key={sid}
                    ref={(el) => {
                      if (el) pinButtonsRef.current.set(sid, el);
                      else pinButtonsRef.current.delete(sid);
                    }}
                    type="button"
                    className={`pin-pill ${active ? 'active' : ''}`}
                    style={{ left: 0, top: 0, display: 'none' }}
                    onClick={() => onSelectStructure(sid)}
                  >
                    {info.shortLabel}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Chondral mm Colorbar only when in Cartilage Map mode */}
        {viewMode === 'cartilage-map' && (
          <div className="stage-hud-left">
            <div className="chondral-scale-card">
              <span className="scale-lbl">0.0 mm</span>
              <div className="scale-gradient" />
              <span className="scale-lbl">{jointDef.cartilageMaxMmLabel ?? '3.8 mm'}</span>
            </div>
          </div>
        )}

        {/* Minimal Bottom-Right Zoom & Reset Pill */}
        <div className="stage-hud-right">
          <div className="zoom-pill" role="group" aria-label="3D zoom controls">
            <button
              type="button"
              className="zoom-btn"
              onClick={() => handleZoomStep(1.28)}
              title="Zoom out 3D specimen"
              aria-label="Zoom out 3D"
            >
              <Minus size={13} />
            </button>
            <button
              type="button"
              className="zoom-reset-btn"
              onClick={handleResetView}
              title="Reset camera angle & zoom"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              className="zoom-btn"
              onClick={() => handleZoomStep(0.76)}
              title="Zoom in 3D specimen"
              aria-label="Zoom in 3D"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
