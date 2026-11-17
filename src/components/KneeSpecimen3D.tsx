import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import {
  BONE_NAMES,
  createAnatomyTextureBank,
  createStudioVignetteTexture,
  createTissueMaterial,
  syncSpecimenMaterialsAndVisibility,
} from '../core/anatomyMaterials';
import { rasToThree } from '../core/coordinates';
import { STRUCTURES_INFO } from '../data/kneeClinicalAtlas';
import type {
  KneeChapter,
  KneeKinematics,
  KneeLandmarks,
  MriPlaneMode,
  StructureId,
  ThemeMode,
  TissueVisibility,
} from '../types/atlas';

interface KneeSpecimen3DProps {
  landmarks: KneeLandmarks | null;
  chapter: KneeChapter;
  kinematics: KneeKinematics;
  theme: ThemeMode;
  activeStructure: StructureId;
  onSelectStructure: (id: StructureId, centroidRas: [number, number, number]) => void;
  visibility: TissueVisibility;
  onToggleVisibility: (key: keyof TissueVisibility) => void;
  mriPlaneMode: MriPlaneMode;
  mriCrosshairRas: [number, number, number] | null;
}

type CameraPresetKey = KneeChapter['cameraPreset'];

// Right Knee Three.js camera presets (+X = Medial, -X = Lateral, +Y = Superior, +Z = Anterior)
const CAMERA_PRESETS: Array<{
  id: CameraPresetKey;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}> = [
  { id: 'anterior', label: 'Anterior', position: [2.5, 0.35, 11.8], target: [0.0, 0.15, 0.05] },
  { id: 'notch', label: 'Notch', position: [-0.35, 0.05, 6.0], target: [0.0, -0.02, 0.0] },
  { id: 'medial', label: 'Medial', position: [8.8, 0.25, 2.8], target: [0.15, 0.1, 0.05] },
  { id: 'lateral', label: 'Lateral', position: [-8.8, 0.25, 2.8], target: [-0.15, 0.1, 0.05] },
  { id: 'plateau', label: 'Plateau', position: [0.0, 7.2, 2.8], target: [0.0, -0.1, 0.0] },
  { id: 'posterior', label: 'Posterior', position: [-1.4, 0.35, -10.5], target: [0.0, 0.15, 0.0] },
];

const CALLOUT_STRUCTURES: StructureId[] = [
  'ACL',
  'PCL',
  'MedialMeniscus',
  'LateralMeniscus',
  'FemoralCartilage',
  'MCL',
  'LCL',
  'PatellarTendon',
];

export function KneeSpecimen3D({
  landmarks,
  chapter,
  kinematics,
  theme,
  activeStructure,
  onSelectStructure,
  visibility,
  onToggleVisibility,
  mriPlaneMode,
  mriCrosshairRas,
}: KneeSpecimen3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [manualPreset, setManualPreset] = useState<{
    chapterId: string;
    preset: CameraPresetKey;
  } | null>(null);
  const [hoveredStructure, setHoveredStructure] = useState<StructureId | null>(null);

  const activePreset =
    manualPreset?.chapterId === chapter.id ? manualPreset.preset : chapter.cameraPreset;

  const sceneRefs = useRef<{
    scene?: THREE.Scene;
    bgTexture?: THREE.CanvasTexture;
    xrayUniform: { uXrayMode: { value: number } };
    meshes: Map<string, THREE.Mesh>;
    materials: Map<string, THREE.MeshPhysicalMaterial>;
    tibiaPivot?: THREE.Group;
    tibiaTranslational?: THREE.Group;
    patellaGroup?: THREE.Group;
    medMenGroup?: THREE.Group;
    kissingContusions?: THREE.Group;
    femBruise?: THREE.Mesh;
    tibBruise?: THREE.Mesh;
    rootTearMarker?: THREE.Mesh;
    clipPlane: THREE.Plane;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    tween?: { active: boolean; destPos: THREE.Vector3; destTarget: THREE.Vector3 };
  }>({
    xrayUniform: { uXrayMode: { value: 0.0 } },
    meshes: new Map(),
    materials: new Map(),
    clipPlane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10),
  });

  const activeStructureRef = useRef(activeStructure);
  const landmarksRef = useRef(landmarks);
  const visibilityRef = useRef(visibility);
  const themeRef = useRef(theme);
  const onSelectRef = useRef(onSelectStructure);

  useEffect(() => {
    activeStructureRef.current = activeStructure;
    landmarksRef.current = landmarks;
    visibilityRef.current = visibility;
    themeRef.current = theme;
    onSelectRef.current = onSelectStructure;
  }, [activeStructure, landmarks, visibility, theme, onSelectStructure]);

  // Build WebGLRenderer(alpha: false) + Radial Vignette + Studio Lights + GTAO Composer + Load OpenMSK GLB
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;

    const w = Math.max(320, host.clientWidth);
    const h = Math.max(240, host.clientHeight);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'WebGL initialization failed';
      queueMicrotask(() => {
        if (!disposed) {
          setLoadError(msg);
          setLoading(false);
        }
      });
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.localClippingEnabled = true;

    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgTex = createStudioVignetteTexture(themeRef.current);
    scene.background = bgTex;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.36;
    roomEnv.dispose();
    pmrem.dispose();

    const textureBank = createAnatomyTextureBank();

    // Sculptural surgical three-point + subchondral bounce rig
    const hemi = new THREE.HemisphereLight(0xdce8ff, 0x0c111b, 0.34);
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.65);
    keyLight.position.set(4.8, 6.8, 5.5);
    const rimLight = new THREE.DirectionalLight(0x88b6ff, 1.05);
    rimLight.position.set(-5.2, 3.0, -4.5);
    const bounceFill = new THREE.DirectionalLight(0xe2e8f0, 0.32);
    bounceFill.position.set(0.0, -3.6, 4.4);
    scene.add(hemi, keyLight, rimLight, bounceFill);

    const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 80);
    camera.position.set(2.5, 0.35, 11.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 2.0;
    controls.maxDistance = 18;
    controls.target.set(0.0, 0.15, 0.05);
    controls.update();

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    composer.setSize(w, h);
    const renderPass = new RenderPass(scene, camera);
    const gtaoPass = new GTAOPass(scene, camera, w, h);
    gtaoPass.output = GTAOPass.OUTPUT.Default;
    gtaoPass.blendIntensity = 0.65;
    gtaoPass.updateGtaoMaterial({
      radius: 0.24,
      thickness: 1.0,
      scale: 1.05,
      samples: 16,
    });
    const outputPass = new OutputPass();
    const smaaPass = new SMAAPass();
    composer.addPass(renderPass);
    composer.addPass(gtaoPass);
    composer.addPass(outputPass);
    composer.addPass(smaaPass);

    const tween = {
      active: false,
      destPos: new THREE.Vector3(),
      destTarget: new THREE.Vector3(),
    };
    const refsObj = sceneRefs.current;
    refsObj.scene = scene;
    refsObj.bgTexture = bgTex;
    refsObj.camera = camera;
    refsObj.controls = controls;
    refsObj.tween = tween;

    // Anatomical Right-Knee Kinematic Hierarchy
    const root = new THREE.Group();
    const femurAssembly = new THREE.Group();
    const tibiaPivot = new THREE.Group();
    const tibiaTranslational = new THREE.Group();
    const patellaGroup = new THREE.Group();
    const medMenGroup = new THREE.Group();

    tibiaPivot.add(tibiaTranslational);
    tibiaTranslational.add(medMenGroup);
    root.add(femurAssembly, tibiaPivot, patellaGroup);
    scene.add(root);

    refsObj.tibiaPivot = tibiaPivot;
    refsObj.tibiaTranslational = tibiaTranslational;
    refsObj.patellaGroup = patellaGroup;
    refsObj.medMenGroup = medMenGroup;

    // Lateral compartment pivot-shift kissing bone contusions (Right knee: lateral is -X)
    const kissingContusions = new THREE.Group();
    const contusionMat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const femBruise = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), contusionMat);
    femBruise.position.set(-0.85, 0.22, 0.32);
    const tibBruise = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), contusionMat);
    tibBruise.position.set(-0.88, -0.32, -0.58);
    kissingContusions.add(femBruise, tibBruise);
    kissingContusions.visible = false;
    root.add(kissingContusions);
    refsObj.kissingContusions = kissingContusions;
    refsObj.femBruise = femBruise;
    refsObj.tibBruise = tibBruise;

    // Medial posterior root tear ring marker
    const rootTearMarker = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.028, 12, 28),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    rootTearMarker.rotation.x = Math.PI / 2;
    rootTearMarker.position.set(0.35, -0.22, -0.45);
    rootTearMarker.visible = false;
    tibiaTranslational.add(rootTearMarker);
    refsObj.rootTearMarker = rootTearMarker;

    const loader = new GLTFLoader();
    const tmpColor = new THREE.Color();

    loader.load(
      '/models/knee-invivo-3t.glb',
      (gltf) => {
        if (disposed) return;

        const lm = landmarksRef.current;
        if (lm) {
          tibiaPivot.position.set(...lm.transepicondylarPivot);
          tibiaTranslational.position.set(
            -lm.transepicondylarPivot[0],
            -lm.transepicondylarPivot[1],
            -lm.transepicondylarPivot[2]
          );
        }

        const loadedMeshes: Array<{ name: string; mesh: THREE.Mesh }> = [];
        gltf.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            const name = obj.name || obj.parent?.name || '';
            if (name) loadedMeshes.push({ name, mesh: obj });
          }
        });

        for (const { name, mesh } of loadedMeshes) {
          // Convert OpenMSK per-vertex quantitative cartilage thickness (_thickness_rgb uint8 0..255) into linear BufferAttribute 'color'
          const thickAttr = mesh.geometry.getAttribute('_thickness_rgb');
          if (thickAttr && thickAttr.array) {
            const count = thickAttr.count;
            const colors = new Float32Array(count * 3);
            const src = thickAttr.array;
            for (let i = 0; i < count; i++) {
              tmpColor.setRGB(
                src[i * 4] / 255.0,
                src[i * 4 + 1] / 255.0,
                src[i * 4 + 2] / 255.0,
                THREE.SRGBColorSpace
              );
              colors[i * 3] = tmpColor.r;
              colors[i * 3 + 1] = tmpColor.g;
              colors[i * 3 + 2] = tmpColor.b;
            }
            mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          }

          mesh.geometry.computeVertexNormals();
          mesh.userData = { structureId: name };

          const mat = createTissueMaterial(name, refsObj.clipPlane, textureBank, refsObj.xrayUniform);
          mesh.material = mat;

          refsObj.meshes.set(name, mesh);
          refsObj.materials.set(name, mat);

          if (
            name === 'Femur' ||
            name === 'FemoralCartilage' ||
            name === 'QuadricepsTendon' ||
            name === 'ACL' ||
            name === 'PCL' ||
            name === 'BucketHandleFragment'
          ) {
            femurAssembly.add(mesh);
          } else if (name === 'Patella' || name === 'PatellarCartilage') {
            patellaGroup.add(mesh);
          } else if (name === 'MedialMeniscus' || name === 'MedialMeniscusTruncated') {
            medMenGroup.add(mesh);
          } else {
            tibiaTranslational.add(mesh);
          }
        }

        setLoading(false);
      },
      undefined,
      (err) => {
        if (!disposed) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load 3D In-Vivo Knee GLB');
          setLoading(false);
        }
      }
    );

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPt = { x: 0, y: 0 };

    const pickStructure = (clientX: number, clientY: number): StructureId | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const candidateMeshes: THREE.Mesh[] = [];
      for (const [name, m] of refsObj.meshes) {
        if (m.visible && name in STRUCTURES_INFO) {
          candidateMeshes.push(m);
        }
      }
      const hits = raycaster.intersectObjects(candidateMeshes, false);
      for (const hit of hits) {
        const sid = hit.object.userData?.structureId as StructureId | undefined;
        if (sid && sid in STRUCTURES_INFO) {
          if (visibilityRef.current.xrayBones && BONE_NAMES.has(sid)) {
            const softHit = hits.find(
              (h) =>
                h.object.userData?.structureId &&
                !BONE_NAMES.has(h.object.userData.structureId as string)
            );
            if (softHit) {
              return softHit.object.userData.structureId as StructureId;
            }
          }
          return sid;
        }
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      downPt = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      const hit = pickStructure(e.clientX, e.clientY);
      setHoveredStructure(hit);
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y) > 6) return;
      const hit = pickStructure(e.clientX, e.clientY);
      if (hit) {
        const lm = landmarksRef.current?.structures[hit];
        onSelectRef.current(hit, lm ? lm.centroidRas : [112, 21, -12]);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    let curW = w;
    let curH = h;
    const syncViewportSize = (nw: number, nh: number) => {
      if (nw <= 0 || nh <= 0 || (nw === curW && nh === curH)) return;
      curW = nw;
      curH = nh;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      composer.setSize(nw, nh);
      controls.update();
      composer.render();
    };

    const ro = new ResizeObserver(() => {
      if (!host) return;
      syncViewportSize(host.clientWidth, host.clientHeight);
    });
    ro.observe(host);

    const tmpVec = new THREE.Vector3();
    const tmpBox = new THREE.Box3();
    let rafId = 0;

    const projectCallouts = () => {
      const svg = svgRef.current;
      const stageW = host.clientWidth;
      const stageH = host.clientHeight;
      if (!svg || stageW < 100 || stageH < 100) return;

      const showCallouts = visibilityRef.current.callouts;
      svg.style.display = showCallouts ? 'block' : 'none';
      if (!showCallouts) {
        for (const sid of CALLOUT_STRUCTURES) {
          const pill = pillRefs.current[sid];
          if (pill) pill.style.opacity = '0';
        }
        return;
      }

      const items: Array<{
        id: StructureId;
        x: number;
        y: number;
        side: 'left' | 'right';
        pillY: number;
      }> = [];

      const topSafe = 54;
      const botSafe = Math.max(topSafe + 40, stageH - 148);

      for (const sid of CALLOUT_STRUCTURES) {
        const mesh = refsObj.meshes.get(sid);
        const pill = pillRefs.current[sid];
        if (!mesh || !mesh.visible || !pill) {
          if (pill) pill.style.opacity = '0';
          continue;
        }
        tmpBox.setFromObject(mesh).getCenter(tmpVec);
        tmpVec.project(camera);
        if (tmpVec.z > 1) {
          pill.style.opacity = '0';
          continue;
        }
        const sx = (tmpVec.x * 0.5 + 0.5) * stageW;
        const sy = (-tmpVec.y * 0.5 + 0.5) * stageH;
        items.push({
          id: sid,
          x: sx,
          y: sy,
          side: sx < stageW * 0.5 ? 'left' : 'right',
          pillY: Math.max(topSafe, Math.min(botSafe, sy)),
        });
      }

      for (const side of ['left', 'right'] as const) {
        const group = items.filter((it) => it.side === side).sort((a, b) => a.pillY - b.pillY);
        const minGap = 28;
        for (let i = 1; i < group.length; i++) {
          if (group[i].pillY - group[i - 1].pillY < minGap) {
            group[i].pillY = group[i - 1].pillY + minGap;
          }
        }
        for (let i = group.length - 2; i >= 0; i--) {
          if (group[i].pillY > botSafe) {
            group[i].pillY = botSafe;
          }
          if (group[i + 1].pillY - group[i].pillY < minGap) {
            group[i].pillY = Math.max(topSafe, group[i + 1].pillY - minGap);
          }
        }
      }

      while (svg.firstChild) svg.removeChild(svg.firstChild);

      for (const item of items) {
        const pill = pillRefs.current[item.id];
        if (!pill) continue;
        pill.style.opacity = '1';
        const pillW = pill.offsetWidth || 88;
        const marginX = item.side === 'left' ? 14 : stageW - pillW - 14;
        pill.style.transform = `translate(${marginX.toFixed(1)}px, ${(item.pillY - 12).toFixed(1)}px)`;

        const anchorX = item.side === 'left' ? marginX + pillW + 4 : marginX - 4;
        const anchorY = item.pillY;
        const isSelected = activeStructureRef.current === item.id;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', anchorX.toFixed(1));
        line.setAttribute('y1', anchorY.toFixed(1));
        line.setAttribute('x2', item.x.toFixed(1));
        line.setAttribute('y2', item.y.toFixed(1));
        line.setAttribute('class', `callout-line ${isSelected ? 'active' : ''}`);
        svg.appendChild(line);

        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', item.x.toFixed(1));
        dot.setAttribute('cy', item.y.toFixed(1));
        dot.setAttribute('r', isSelected ? '3.5' : '2.4');
        dot.setAttribute('class', `callout-dot ${isSelected ? 'active' : ''}`);
        svg.appendChild(dot);
      }
    };

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (tween.active) {
        camera.position.lerp(tween.destPos, 0.14);
        controls.target.lerp(tween.destTarget, 0.14);
        if (
          camera.position.distanceTo(tween.destPos) < 0.03 &&
          controls.target.distanceTo(tween.destTarget) < 0.02
        ) {
          camera.position.copy(tween.destPos);
          controls.target.copy(tween.destTarget);
          tween.active = false;
        }
      }
      controls.update();
      composer.render();
      projectCallouts();
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      composer.dispose();
      textureBank.dispose();
      refsObj.bgTexture?.dispose();
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  // Update studio backdrop texture when switching Darkroom <-> Monograph
  useEffect(() => {
    const r = sceneRefs.current;
    if (!r.scene) return;
    const nextBg = createStudioVignetteTexture(theme);
    r.scene.background = nextBg;
    r.bgTexture?.dispose();
    r.bgTexture = nextBg;
  }, [theme]);

  // Align tibia pivot & dynamic pathology markers when landmarks finish loading
  useEffect(() => {
    const r = sceneRefs.current;
    if (!landmarks || !r.tibiaPivot || !r.tibiaTranslational) return;
    r.tibiaPivot.position.set(...landmarks.transepicondylarPivot);
    r.tibiaTranslational.position.set(
      -landmarks.transepicondylarPivot[0],
      -landmarks.transepicondylarPivot[1],
      -landmarks.transepicondylarPivot[2]
    );

    const latTib = landmarks.structures.LateralTibialCartilage?.centroidThree;
    if (latTib && r.femBruise && r.tibBruise) {
      r.femBruise.position.set(latTib[0] * 0.92, latTib[1] + 0.34, latTib[2] + 0.36);
      r.tibBruise.position.set(latTib[0] * 0.96, latTib[1] - 0.14, latTib[2] - 0.44);
    }
    const medMen = landmarks.structures.MedialMeniscus?.centroidThree;
    const pcl = landmarks.structures.PCL?.centroidThree;
    if (medMen && pcl && r.rootTearMarker) {
      r.rootTearMarker.position.set(medMen[0] * 0.45, medMen[1] + 0.05, pcl[2] - 0.06);
    }
  }, [landmarks]);

  // Apply chapter preset camera when chapter changes
  useEffect(() => {
    const preset = CAMERA_PRESETS.find((p) => p.id === chapter.cameraPreset);
    const tween = sceneRefs.current.tween;
    if (preset && tween) {
      tween.destPos.set(...preset.position);
      tween.destTarget.set(...preset.target);
      tween.active = true;
    }
  }, [chapter]);

  // Sync Right-knee kinematics, pathology states, Fresnel X-ray, thickness map, highlight & clip plane
  useEffect(() => {
    const r = sceneRefs.current;

    if (r.tibiaPivot && landmarks) {
      const axis = new THREE.Vector3(...landmarks.transepicondylarAxis).normalize();
      // +flexionRad around +X transepicondylarAxis rotates inferior tibia (-Y) toward posterior (-Z)
      const flexQ = new THREE.Quaternion().setFromAxisAngle(axis, kinematics.flexionRad);
      const screwQ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        (kinematics.screwHomeDeg * Math.PI) / 180
      );
      r.tibiaPivot.quaternion.copy(flexQ).multiply(screwQ);
    }

    if (r.tibiaTranslational && landmarks) {
      r.tibiaTranslational.position.set(
        -landmarks.transepicondylarPivot[0],
        -landmarks.transepicondylarPivot[1],
        -landmarks.transepicondylarPivot[2] + kinematics.anteriorTranslationThree
      );
    }

    if (r.patellaGroup) {
      r.patellaGroup.position.set(0, kinematics.patellaDropY, kinematics.patellaShiftZ);
      r.patellaGroup.rotation.x = kinematics.patellaTiltRad;
    }

    if (r.medMenGroup) {
      r.medMenGroup.position.set(
        kinematics.medialMeniscusShiftX,
        0,
        kinematics.meniscusPosteriorShiftZ
      );
    }

    const isAclBad = chapter.id === 'acl-rupture' || chapter.id === 'unhappy-triad';

    if (r.kissingContusions) {
      r.kissingContusions.visible = isAclBad;
    }
    if (r.rootTearMarker) {
      r.rootTearMarker.visible = chapter.id === 'posterior-root' && visibility.menisci;
    }

    // Live cross-section clipping synchronized with active MRI plane & RAS coordinate
    if (visibility.crossSection && landmarks && mriCrosshairRas) {
      const pt = rasToThree(mriCrosshairRas, landmarks.jointCenterRas, landmarks.threeScale);
      if (mriPlaneMode === 'coronal') {
        r.clipPlane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 0, -1),
          new THREE.Vector3(pt[0], pt[1], pt[2])
        );
      } else if (mriPlaneMode === 'axial') {
        r.clipPlane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, -1, 0),
          new THREE.Vector3(pt[0], pt[1], pt[2])
        );
      } else {
        r.clipPlane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(-1, 0, 0),
          new THREE.Vector3(pt[0], pt[1], pt[2])
        );
      }
    } else {
      r.clipPlane.set(new THREE.Vector3(0, 0, -1), 100);
    }

    syncSpecimenMaterialsAndVisibility({
      meshes: r.meshes,
      materials: r.materials,
      xrayUniform: r.xrayUniform,
      visibility,
      chapterId: chapter.id,
      activeStructure,
      hoveredStructure,
    });
  }, [
    landmarks,
    chapter,
    kinematics,
    visibility,
    activeStructure,
    hoveredStructure,
    mriPlaneMode,
    mriCrosshairRas,
    loading,
  ]);

  const applyCameraPreset = (presetId: CameraPresetKey) => {
    setManualPreset({ chapterId: chapter.id, preset: presetId });
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId);
    const tween = sceneRefs.current.tween;
    if (preset && tween) {
      tween.destPos.set(...preset.position);
      tween.destTarget.set(...preset.target);
      tween.active = true;
    }
  };

  const selectedInfo = STRUCTURES_INFO[activeStructure];
  const selectedLandmark = landmarks?.structures[activeStructure];

  const tissueToggles: Array<{ key: keyof TissueVisibility; label: string; title?: string }> = [
    { key: 'xrayBones', label: 'X-Ray Bone', title: 'Fresnel cortical X-ray view (Shortcut X)' },
    { key: 'thicknessMap', label: 'Thickness (mm)', title: 'OpenMSK chondral thickness map (Shortcut T)' },
    { key: 'bones', label: 'Bones' },
    { key: 'extensor', label: 'Extensor' },
    { key: 'cartilage', label: 'Cartilage' },
    { key: 'menisci', label: 'Menisci' },
    { key: 'cruciates', label: 'Cruciates' },
    { key: 'collaterals', label: 'Collaterals' },
    { key: 'callouts', label: 'Labels', title: 'Anatomical pins (Shortcut L)' },
    { key: 'crossSection', label: 'MRI Cut', title: 'Clip 3D along MRI slice (Shortcut S)' },
  ];

  const calloutButtons = useMemo(
    () =>
      CALLOUT_STRUCTURES.map((sid) => ({
        id: sid,
        label: STRUCTURES_INFO[sid].shortLabel,
      })),
    []
  );

  return (
    <section className="stage-pane" aria-label="3D OpenMSK Right Knee Segmented Specimen">
      <div className="pane-header">
        <div className="pane-heading">
          <h2 className="pane-title">3D Anatomical Atlas</h2>
          <span className="pane-note">Right Knee · 16 parts · PBR + AO</span>
        </div>

        <div className="seg-group" role="tablist" aria-label="Camera presets">
          {CAMERA_PRESETS.map((preset) => {
            const active = preset.id === activePreset;
            return (
              <button
                key={preset.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`seg-btn ${active ? 'active' : ''}`}
                onClick={() => applyCameraPreset(preset.id)}
              >
                {active && (
                  <motion.span
                    layoutId="camera-preset-pill"
                    className="seg-indicator"
                    transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                  />
                )}
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="specimen-stage">
        <div ref={hostRef} className="three-host" />
        <svg ref={svgRef} className="callout-svg" aria-hidden="true" />

        <div className="callout-pills-layer">
          {calloutButtons.map((cb) => (
            <button
              key={cb.id}
              ref={(el) => {
                pillRefs.current[cb.id] = el;
              }}
              type="button"
              className={`callout-pill ${activeStructure === cb.id ? 'active' : ''}`}
              style={{ opacity: 0, left: 0, top: 0 }}
              onClick={() => {
                const lm = landmarks?.structures[cb.id];
                onSelectStructure(cb.id, lm ? lm.centroidRas : [112, 21, -12]);
              }}
            >
              {cb.label}
            </button>
          ))}
        </div>

        <div className="tissue-strip">
          {tissueToggles.map((t) => (
            <button
              key={t.key}
              type="button"
              title={t.title}
              className={`chip-toggle ${visibility[t.key] ? 'active' : ''}`}
              onClick={() => onToggleVisibility(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {visibility.thicknessMap && (
          <div className="thickness-legend" aria-label="Cartilage thickness colormap">
            <div className="thickness-legend-head">
              <span>Chondral Thickness</span>
              <span>BScore {landmarks?.bScore ?? -0.203}</span>
            </div>
            <div className="thickness-bar" />
            <div className="thickness-scale">
              <span>0.0 mm</span>
              <span>1.9 mm</span>
              <span>3.8 mm</span>
            </div>
          </div>
        )}

        <div className="structure-inspector">
          <div>
            <div className="inspector-title">{selectedInfo.name}</div>
            <div className="inspector-body">{selectedInfo.mriSignal}</div>
            <div className="inspector-body" style={{ color: 'var(--text-primary)', marginTop: 3 }}>
              {selectedInfo.clinicalPearl}
            </div>
          </div>
          <div className="inspector-coords">
            <div>{selectedInfo.group}</div>
            {selectedLandmark && (
              <div style={{ marginTop: 3 }}>
                ({selectedLandmark.centroidRas[0]}, {selectedLandmark.centroidRas[1]},{' '}
                {selectedLandmark.centroidRas[2]}) mm
              </div>
            )}
          </div>
        </div>

        {loading && <div className="loading-overlay">Loading 16-part In-Vivo 3T Knee GLB…</div>}
        {loadError && (
          <div className="loading-overlay" style={{ color: 'var(--accent-crimson)' }}>
            3D load error: {loadError}
          </div>
        )}
      </div>
    </section>
  );
}
