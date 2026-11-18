import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import {
  createAnatomyTextureBank,
  createStudioVignetteTexture,
  createTissueMaterial,
  syncSpecimenMaterialsAndVisibility,
} from '../core/anatomyMaterials';
import { rasToThree } from '../core/coordinates';
import {
  createPathologyOverlaySystem,
  type PathologyOverlaySystem,
} from '../core/pathologyMeshes';
import { STRUCTURES_INFO } from '../data/kneeClinicalAtlas';
import type {
  CameraPresetKey,
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
  landmarks: KneeLandmarks | null;
  moduleId: KneeModuleId;
  subStepId: string;
  meniscalTearMorphology?: MeniscalTearMorphology;
  targetRasOverride?: [number, number, number];
  targetBadge?: string;
  viewMode: SpecimenViewMode;
  onChangeViewMode: (mode: SpecimenViewMode) => void;
  visibility: TissueVisibility;
  onChangeVisibility: (next: TissueVisibility) => void;
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

const CAMERA_PRESETS: Record<
  CameraPresetKey,
  { label: string; pos: [number, number, number]; target: [number, number, number] }
> = {
  anterior: { label: 'Anterior', pos: [0.22, 0.55, 8.5], target: [0.0, 0.18, 0.15] },
  medial: { label: 'Medial', pos: [8.1, 0.45, 1.85], target: [0.15, 0.15, 0.12] },
  lateral: { label: 'Lateral', pos: [-8.1, 0.45, 1.65], target: [-0.15, 0.15, 0.08] },
  posterior: { label: 'Posterior', pos: [-0.2, 0.65, -8.3], target: [0.0, 0.12, -0.05] },
  notch: { label: 'Notch', pos: [0.16, -0.42, 6.75], target: [0.0, 0.16, 0.08] },
  plateau: { label: 'Plateau Top', pos: [0.12, 7.65, 2.85], target: [0.1, -0.16, 0.06] },
};

function computeFramedCamera(
  presetKey: CameraPresetKey,
  distanceScale: number,
  moduleId: KneeModuleId,
  activeStructure: StructureId,
  container: HTMLDivElement | null
): { pos: THREE.Vector3; target: THREE.Vector3 } {
  const preset = CAMERA_PRESETS[presetKey] ?? CAMERA_PRESETS.anterior;
  const target = new THREE.Vector3(...preset.target);
  const basePos = new THREE.Vector3(...preset.pos);

  // When focusing patellar dislocation or extensor structures, elevate framing to patellofemoral zone
  if (
    moduleId === 'patellar-dislocation' ||
    activeStructure === 'Patella' ||
    activeStructure === 'PatellarCartilage' ||
    activeStructure === 'QuadricepsTendon'
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

const ALL_PIN_STRUCTURES: StructureId[] = [
  'Femur',
  'Tibia',
  'Patella',
  'MedialMeniscus',
  'LateralMeniscus',
  'ACL',
  'PCL',
  'MCL',
];

const VIEW_MODES: Array<{ id: SpecimenViewMode; label: string }> = [
  { id: 'solid', label: 'Solid' },
  { id: 'joint-interior', label: 'Inside (X-Ray)' },
  { id: 'plateau-topdown', label: 'Plateau' },
  { id: 'cartilage-map', label: 'Cartilage' },
];

function isStructureId(val: string): val is StructureId {
  return val in STRUCTURES_INFO;
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
  landmarks,
  moduleId,
  subStepId,
  meniscalTearMorphology,
  targetRasOverride,
  targetBadge,
  viewMode,
  onChangeViewMode,
  visibility,
  onChangeVisibility,
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
  const [hoveredStructure, setHoveredStructure] = useState<StructureId | null>(null);
  const [stageSize, setStageSize] = useState({ w: 480, h: 480 });

  const [focusedPin, setFocusedPin] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [allPins, setAllPins] = useState<
    Record<string, { x: number; y: number; visible: boolean }>
  >({});

  // Latest props ref for rAF loop
  const stateRef = useRef({
    moduleId,
    subStepId,
    meniscalTearMorphology,
    targetRasOverride,
    viewMode,
    visibility,
    activeStructure,
    hoveredStructure,
    kinematics,
    showAllLabels,
    showSlicePlane,
    mriSliceRas,
    mriPlane,
    hideLabels,
    landmarks,
  });
  stateRef.current = {
    moduleId,
    subStepId,
    meniscalTearMorphology,
    targetRasOverride,
    viewMode,
    visibility,
    activeStructure,
    hoveredStructure,
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
    composer: EffectComposer;
    meshes: Map<string, THREE.Mesh>;
    materials: Map<string, THREE.MeshPhysicalMaterial>;
    xrayUniform: { uXrayMode: { value: number } };
    femurGroup: THREE.Group;
    tibiaPivotGroup: THREE.Group;
    tibiaTranslationGroup: THREE.Group;
    tibiaScrewGroup: THREE.Group;
    tibiaBodyGroup: THREE.Group;
    medialMeniscusGroup: THREE.Group;
    patellaGroup: THREE.Group;
    focusedTargetAnchor: THREE.Object3D;
    pathologySystem: PathologyOverlaySystem | null;
    slicePlaneMesh: THREE.Mesh;
    sliceOutline: THREE.LineLoop;
    vignetteMat: THREE.MeshBasicMaterial;
    animTargetPos: THREE.Vector3 | null;
    animTargetLook: THREE.Vector3 | null;
    tibiaPivotVec: THREE.Vector3;
    tibiaPivotAxis: THREE.Vector3;
    patellaCenterVec: THREE.Vector3;
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
    setStageSize({ w: width, h: height });

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 80);
    camera.position.set(0.22, 0.55, 8.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'specimen-canvas';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.085;
    controls.zoomToCursor = true;
    controls.zoomSpeed = 1.3;
    controls.panSpeed = 0.9;
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

    const hemiLight = new THREE.HemisphereLight(0xf1f5f9, 0x1e293b, 0.55);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.35);
    keyLight.position.set(4.5, 6.2, 5.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbbe6ff, 0.95);
    fillLight.position.set(-5.2, 2.0, 3.6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xe0f2fe, 1.35);
    rimLight.position.set(0.4, 3.8, -5.6);
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

    // Effect Composer: Render -> GTAO -> Output -> SMAA
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const gtaoPass = new GTAOPass(scene, camera, width, height);
    gtaoPass.output = GTAOPass.OUTPUT.Default;
    gtaoPass.updateGtaoMaterial({ radius: 0.24, distanceExponent: 1.8, thickness: 1.0, scale: 1.0, samples: 12 });
    composer.addPass(gtaoPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    const smaaPass = new SMAAPass();
    composer.addPass(smaaPass);

    // Load 3T In-Vivo Specimen GLB
    const textureBank = createAnatomyTextureBank();
    const xrayUniform = { uXrayMode: { value: 0.0 } };
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
    const meshes = new Map<string, THREE.Mesh>();
    const materials = new Map<string, THREE.MeshPhysicalMaterial>();

    const refs = {
      camera,
      controls,
      renderer,
      composer,
      meshes,
      materials,
      xrayUniform,
      femurGroup,
      tibiaPivotGroup,
      tibiaTranslationGroup,
      tibiaScrewGroup,
      tibiaBodyGroup,
      medialMeniscusGroup,
      patellaGroup,
      focusedTargetAnchor,
      pathologySystem: null as PathologyOverlaySystem | null,
      slicePlaneMesh,
      sliceOutline,
      vignetteMat,
      animTargetPos: null as THREE.Vector3 | null,
      animTargetLook: null as THREE.Vector3 | null,
      tibiaPivotVec: new THREE.Vector3(0, 0.2, 0.1),
      tibiaPivotAxis: new THREE.Vector3(1, 0, 0),
      patellaCenterVec: new THREE.Vector3(-0.44, 1.47, 1.97),
    };
    sceneRefs.current = refs;

    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    let disposed = false;
    loader.load(
      '/models/knee-invivo-3t.glb',
      (gltf) => {
        if (disposed) return;

        const lm = stateRef.current.landmarks;
        const pivotArr = lm?.transepicondylarPivot ?? [0.06, 0.28, 0.1];
        const axisArr = lm?.transepicondylarAxis ?? [1, 0, 0];
        refs.tibiaPivotVec.set(pivotArr[0], pivotArr[1], pivotArr[2]);
        refs.tibiaPivotAxis.set(axisArr[0], axisArr[1], axisArr[2]).normalize();
        // Ensure positive flexion always rotates distal tibia (-Y) posteriorly (-Z)
        if (refs.tibiaPivotAxis.x < 0) refs.tibiaPivotAxis.negate();

        tibiaPivotGroup.position.copy(refs.tibiaPivotVec);
        tibiaBodyGroup.position.copy(refs.tibiaPivotVec).negate();

        const collected: Array<{ name: string; mesh: THREE.Mesh }> = [];
        gltf.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.computeVertexNormals();
            collected.push({ name: obj.name, mesh: obj });
          }
        });

        for (const { name, mesh } of collected) {
          const mat = createTissueMaterial(name, clipPlane, textureBank, xrayUniform);
          mesh.material = mat;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData.structureName = name;

          meshes.set(name, mesh);
          materials.set(name, mat);

          if (name === 'Femur' || name === 'FemoralCartilage') {
            femurGroup.add(mesh);
          } else if (
            name === 'Patella' ||
            name === 'PatellarCartilage' ||
            name === 'PatellarTendon' ||
            name === 'QuadricepsTendon'
          ) {
            patellaGroup.add(mesh);
          } else if (
            name === 'MedialMeniscus' ||
            name === 'MedialMeniscusTruncated' ||
            name === 'BucketHandleFragment'
          ) {
            if (name === 'BucketHandleFragment') {
              // Anchor displaced bucket-handle inside notch alongside PCL
              tibiaBodyGroup.add(mesh);
            } else {
              medialMeniscusGroup.add(mesh);
            }
          } else {
            tibiaBodyGroup.add(mesh);
          }
        }

        const patMesh = meshes.get('Patella');
        if (patMesh) {
          patMesh.geometry.computeBoundingBox();
          const pBox = patMesh.geometry.boundingBox;
          if (pBox) pBox.getCenter(refs.patellaCenterVec);
        }

        refs.pathologySystem = createPathologyOverlaySystem({
          femurGroup,
          tibiaBodyGroup,
          medialMeniscusGroup,
          patellaGroup,
          meshes,
          threeScale: lm?.threeScale ?? 0.04,
          laterality: lm?.laterality ?? 'Right',
        });

        setModelReady(true);
        setLoadProgress(100);
      },
      (evt) => {
        if (evt.total > 0) {
          setLoadProgress(Math.min(99, Math.round((evt.loaded / evt.total) * 100)));
        }
      },
      () => {
        if (!disposed) {
          setLoadError('Unable to load /models/knee-invivo-3t.glb specimen meshes.');
        }
      }
    );

    // Hover & Click / Double-click raycasting
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let pointerDownPos: { x: number; y: number } | null = null;

    const pickStructureAt = (clientX: number, clientY: number): { id: StructureId; point: THREE.Vector3 } | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const visibleTargets = Array.from(meshes.values()).filter((m) => m.visible);
      const hits = raycaster.intersectObjects(visibleTargets, false);
      for (const hit of hits) {
        const raw = hit.object.userData.structureName as string;
        const mapped =
          raw === 'BucketHandleFragment' || raw === 'MedialMeniscusTruncated'
            ? 'MedialMeniscus'
            : raw;
        if (isStructureId(mapped)) {
          return { id: mapped, point: hit.point };
        }
      }
      return null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const hit = pickStructureAt(e.clientX, e.clientY);
      setHoveredStructure(hit ? hit.id : null);
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    };

    const onPointerDown = (e: PointerEvent) => {
      // Cancel scripted fly-to animation as soon as the user grabs the canvas
      refs.animTargetPos = null;
      refs.animTargetLook = null;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
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
        const preset = CAMERA_PRESETS.anterior;
        refs.animTargetPos = new THREE.Vector3(...preset.pos);
        refs.animTargetLook = new THREE.Vector3(...preset.target);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);

    const tmpWorldPos = new THREE.Vector3();
    const tmpProj = new THREE.Vector3();
    const tmpBox = new THREE.Box3();
    const tmpCenter = new THREE.Vector3();

    const projectCalloutPins = () => {
      const s = stateRef.current;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw > 0 && ch > 0 && !s.hideLabels && refs.meshes.size > 0) {
        const focusStruct = s.activeStructure;
        let anchorParent: THREE.Group = femurGroup;
        if (focusStruct === 'Patella' || focusStruct === 'PatellarCartilage' || focusStruct === 'PatellarTendon' || focusStruct === 'QuadricepsTendon') {
          anchorParent = patellaGroup;
        } else if (focusStruct === 'MedialMeniscus') {
          anchorParent = medialMeniscusGroup;
        } else if (
          focusStruct === 'Tibia' ||
          focusStruct === 'Fibula' ||
          focusStruct === 'LateralMeniscus' ||
          focusStruct === 'MedialTibialCartilage' ||
          focusStruct === 'LateralTibialCartilage' ||
          focusStruct === 'ACL' ||
          focusStruct === 'PCL' ||
          focusStruct === 'MCL' ||
          focusStruct === 'LCL'
        ) {
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
            targetMesh.geometry.computeBoundingBox();
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
        const onScreen = tmpProj.z >= -1 && tmpProj.z <= 1 && px > 12 && px < cw - 12 && py > 54 && py < ch - 52;
        setFocusedPin((prev) => {
          if (
            prev.visible === onScreen &&
            Math.abs(prev.x - px) < 0.7 &&
            Math.abs(prev.y - py) < 0.7
          ) {
            return prev;
          }
          return { x: px, y: py, visible: onScreen };
        });

        if (s.showAllLabels) {
          const nextAll: Record<string, { x: number; y: number; visible: boolean }> = {};
          for (const sid of ALL_PIN_STRUCTURES) {
            const m = refs.meshes.get(sid);
            if (!m || !m.visible) {
              nextAll[sid] = { x: 0, y: 0, visible: false };
              continue;
            }
            tmpBox.setFromObject(m);
            tmpBox.getCenter(tmpWorldPos);
            tmpProj.copy(tmpWorldPos).project(camera);
            const sx = (tmpProj.x * 0.5 + 0.5) * cw;
            const sy = (-tmpProj.y * 0.5 + 0.5) * ch;
            const vis = tmpProj.z >= -1 && tmpProj.z <= 1 && sx > 20 && sx < cw - 20 && sy > 58 && sy < ch - 56;
            nextAll[sid] = { x: sx, y: sy, visible: vis };
          }
          setAllPins(nextAll);
        }
      } else {
        setFocusedPin((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    // ResizeObserver with synchronous re-render so frames never drop during resize
    const syncViewportSize = () => {
      const w = Math.max(container.clientWidth, 100);
      const h = Math.max(container.clientHeight, 100);
      setStageSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      gtaoPass.setSize(w, h);
      controls.update();
      composer.render();
      projectCalloutPins();
    };
    const ro = new ResizeObserver(syncViewportSize);
    ro.observe(container);

    // Animation Loop
    const clock = new THREE.Clock();
    let frameHandle = 0;

    const animate = () => {
      if (disposed) return;
      frameHandle = window.requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.5);
      const elapsedSec = clock.elapsedTime;
      const s = stateRef.current;

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
      syncSpecimenMaterialsAndVisibility({
        meshes: refs.meshes,
        materials: refs.materials,
        xrayUniform: refs.xrayUniform,
        visibility: effVis,
        chapterId: s.moduleId,
        activeStructure: s.activeStructure,
        hoveredStructure: s.hoveredStructure,
      });

      if (refs.pathologySystem) {
        refs.pathologySystem.update({
          moduleId: s.moduleId,
          subStepId: s.subStepId,
          meniscalTearMorphology: s.meniscalTearMorphology,
          kinematics: kin,
          visibility: s.visibility,
          elapsedSec,
        });
      }

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

      // 5. Render Scene
      composer.render();

      // 6. Project Active Target Callout Pin & Optional All-Pins Overlay
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
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);

      refs.pathologySystem?.dispose();
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
      composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRefs.current = null;
    };
  }, []);

  // Theme update on vignette dome
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const oldTex = refs.vignetteMat.map;
    refs.vignetteMat.map = createStudioVignetteTexture(theme);
    refs.vignetteMat.needsUpdate = true;
    oldTex?.dispose();
  }, [theme]);

  // Keep tibial flexion pivot synced even if landmarks finish fetching after GLB load
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs || !modelReady || !landmarks) return;
    const pivotArr = landmarks.transepicondylarPivot ?? [0.06, 0.28, 0.1];
    const axisArr = landmarks.transepicondylarAxis ?? [1, 0, 0];
    refs.tibiaPivotVec.set(pivotArr[0], pivotArr[1], pivotArr[2]);
    refs.tibiaPivotAxis.set(axisArr[0], axisArr[1], axisArr[2]).normalize();
    if (refs.tibiaPivotAxis.x < 0) refs.tibiaPivotAxis.negate();
    refs.tibiaPivotGroup.position.copy(refs.tibiaPivotVec);
    refs.tibiaBodyGroup.position.copy(refs.tibiaPivotVec).negate();
  }, [landmarks, modelReady]);

  // Fly camera when preset, focus, or cameraTrigger changes
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const framed = computeFramedCamera(
      cameraPreset,
      cameraDistanceScale,
      moduleId,
      activeStructure,
      stageRef.current
    );
    refs.animTargetLook = framed.target;
    refs.animTargetPos = framed.pos;
  }, [cameraPreset, cameraDistanceScale, cameraTrigger, moduleId, activeStructure, modelReady]);

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
  };

  const handleResetView = () => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const framed = computeFramedCamera(
      cameraPreset,
      cameraDistanceScale,
      moduleId,
      activeStructure,
      stageRef.current
    );
    refs.animTargetLook = framed.target;
    refs.animTargetPos = framed.pos;
  };

  const focusedLabel = useMemo(() => {
    if (targetBadge) return targetBadge;
    return STRUCTURES_INFO[activeStructure]?.shortLabel ?? activeStructure;
  }, [targetBadge, activeStructure]);

  const toggleLayer = (key: keyof TissueVisibility) => {
    onChangeVisibility({ ...visibility, [key]: !visibility[key] });
  };

  return (
    <section className="stage-pane" aria-label="Interactive 3D knee specimen">
      {/* Simplified Header: Specimen View Segmented Pill + Layers Popover */}
      <header className="pane-header">
        <div className="pane-title-group">
          <span className="pane-title">3D Knee Specimen</span>
          <span className="pane-badge">{landmarks?.laterality ?? 'Right'} · 3T OpenMSK</span>
        </div>

        <div className="pane-actions">
          <div className="segmented-pill" role="tablist" aria-label="3D view mode">
            {VIEW_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={viewMode === m.id}
                className={`pill-btn ${viewMode === m.id ? 'active' : ''}`}
                onClick={() => onChangeViewMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="popover-anchor" ref={layersRef}>
            <button
              type="button"
              className={`chip-btn ${layersMenuOpen ? 'active' : ''}`}
              onClick={() => setLayersMenuOpen((v) => !v)}
              aria-expanded={layersMenuOpen}
            >
              <Layers size={13} />
              <span>Layers</span>
              <ChevronDown size={12} />
            </button>

            {layersMenuOpen && (
              <div className="popover-panel" role="dialog" aria-label="3D layers and camera angles">
                <div className="popover-section">
                  <div className="popover-heading">Camera Viewpoint</div>
                  <div className="camera-grid">
                    {(Object.keys(CAMERA_PRESETS) as CameraPresetKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`mini-chip ${cameraPreset === key ? 'active' : ''}`}
                        onClick={() => {
                          onSelectCameraPreset(key);
                          setLayersMenuOpen(false);
                        }}
                      >
                        {CAMERA_PRESETS[key].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="popover-section">
                  <div className="popover-heading">Tissue Visibility</div>
                  <div className="layer-checks">
                    {(
                      [
                        ['bones', 'Femur, Tibia & Fibula'],
                        ['extensor', 'Patella & Extensor Tendons'],
                        ['cartilage', 'Hyaline Cartilage'],
                        ['menisci', 'Medial & Lateral Menisci'],
                        ['cruciates', 'Cruciates (ACL / PCL)'],
                        ['collaterals', 'Collaterals (MCL / LCL)'],
                      ] as Array<[keyof TissueVisibility, string]>
                    ).map(([k, lbl]) => (
                      <label key={k} className="check-row">
                        <input
                          type="checkbox"
                          checked={visibility[k]}
                          onChange={() => toggleLayer(k)}
                        />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="popover-section">
                  <div className="popover-heading">Overlay Helpers</div>
                  <div className="layer-checks">
                    <label className="check-row">
                      <input type="checkbox" checked={showAllLabels} onChange={onToggleAllLabels} />
                      <span>All 8 Anatomy Labels (L)</span>
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
            <span>Loading 3T Knee Mesh… {loadProgress}%</span>
          </div>
        )}
        {loadError && (
          <div className="viewport-status error">
            <span>{loadError}</span>
          </div>
        )}

        {/* Single Focused Callout Pin OR All 8 Pins */}
        {modelReady && !hideLabels && !showAllLabels && focusedPin.visible && (() => {
          const cw = stageSize.w || stageRef.current?.clientWidth || 480;
          const estW = Math.max(96, focusedLabel.length * 7.3 + 24);
          const placeLeft = focusedPin.x > cw * 0.56;
          const badgeX = placeLeft
            ? Math.max(10, Math.min(focusedPin.x - estW - 20, cw - estW - 12))
            : Math.max(10, Math.min(focusedPin.x + 24, cw - estW - 12));
          const badgeY = Math.max(focusedPin.y - 36, 12);
          const lineEndX = placeLeft ? badgeX + estW - 6 : badgeX + 8;
          return (
            <div
              className="callout-layer"
              aria-hidden="true"
              style={{ pointerEvents: 'none' }}
            >
              <svg className="callout-svg">
                <line
                  x1={focusedPin.x}
                  y1={focusedPin.y}
                  x2={lineEndX}
                  y2={badgeY + 11}
                  stroke="rgba(125, 211, 252, 0.85)"
                  strokeWidth="1.5"
                />
                <circle
                  cx={focusedPin.x}
                  cy={focusedPin.y}
                  r="4.5"
                  fill="#38bdf8"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              </svg>
              <div
                className="focused-callout-badge"
                style={{
                  left: `${badgeX}px`,
                  top: `${badgeY}px`,
                }}
              >
                {focusedLabel}
              </div>
            </div>
          );
        })()}

        {modelReady && !hideLabels && showAllLabels && (
          <div className="callout-layer" aria-hidden="false">
            {ALL_PIN_STRUCTURES.map((sid) => {
              const p = allPins[sid];
              if (!p || !p.visible) return null;
              const info = STRUCTURES_INFO[sid];
              const active = sid === activeStructure;
              return (
                <button
                  key={sid}
                  type="button"
                  className={`pin-pill ${active ? 'active' : ''}`}
                  style={{ left: `${p.x}px`, top: `${p.y}px` }}
                  onClick={() => onSelectStructure(sid)}
                >
                  {info.shortLabel}
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom-Left Subtle Kinematics Readout + Cartilage Colorbar when in Cartilage Map */}
        <div className="stage-hud-left">
          {viewMode === 'cartilage-map' && (
            <div className="chondral-scale-card">
              <span className="scale-lbl">0.0 mm</span>
              <div className="scale-gradient" />
              <span className="scale-lbl">3.8 mm</span>
            </div>
          )}
          <div className="telemetry-chip">
            <span>{Math.round(flexionDeg)}° Flex</span>
            <span>·</span>
            <span>Drawer {kinematics.anteriorDrawerMm >= 0 ? `+${kinematics.anteriorDrawerMm}` : kinematics.anteriorDrawerMm} mm</span>
            {moduleId === 'posterior-root' && (
              <>
                <span>·</span>
                <span className="text-alert">Extrusion +{kinematics.meniscalExtrusionMm} mm</span>
              </>
            )}
          </div>
        </div>

        {/* Bottom-Right Zoom & Reset Pill + Quick Eye Mode Hint */}
        <div className="stage-hud-right">
          {viewMode !== 'solid' && (
            <button
              type="button"
              className="quick-ghost-pill"
              onClick={() => onChangeViewMode('solid')}
              title="Restore solid bones"
            >
              <Eye size={12} />
              <span>Solid Bone</span>
            </button>
          )}
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
