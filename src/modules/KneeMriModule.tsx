import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeViewport, type CameraPreset, type ThreeSceneContext } from '../components/ThreeViewport';
import {
  buildKneeReport,
  type KneePathology,
} from '../core/clinicalCalculators';
import {
  applyWindowLevel,
  drawCrosshairs,
  drawPacsOrientationMarkers,
  drawPacsScaleBar,
  fastPixelNoise,
  type WindowLevel,
} from '../core/dicomCanvas';
import {
  createAnatomyMaterial,
  createSlicePlaneMesh,
  tagAnatomyMesh,
} from '../core/threeUtils';
import type { StructuredReport } from '../types/radiology';

type MriPlane = 'Sagittal' | 'Coronal' | 'Axial';
type MriSequence = 'PD' | 'T2-FS' | 'T1';

interface KneeMriModuleProps {
  presetTrigger?: string;
  onReportChange: (report: StructuredReport) => void;
  onExposeCanvases: (get3d: () => HTMLCanvasElement | null, get2d: () => HTMLCanvasElement | null) => void;
}

const PATHOLOGY_LABELS: Array<{ id: KneePathology; label: string; tag: string }> = [
  { id: 'normal', label: 'Normal Knee', tag: 'Intact' },
  { id: 'bucket-handle-medial', label: 'Bucket-Handle Med. Meniscus', tag: 'Double PCL' },
  { id: 'acl-complete', label: 'Complete ACL Rupture', tag: 'Pivot Shift' },
  { id: 'unhappy-triad', label: "O'Donoghue Unhappy Triad", tag: 'ACL+MCL+MM' },
  { id: 'posterior-horn-medial', label: 'Post. Horn MM Tear + Cyst', tag: 'Parameniscal' },
  { id: 'pcl-tear', label: 'Complete PCL Tear', tag: 'Dashboard' },
];

const CAMERA_PRESETS: CameraPreset[] = [
  { label: 'AP', position: [0, 0.9, 5.4], target: [0, 0, 0] },
  { label: 'Lat', position: [-5.1, 0.7, 0.9], target: [0, -0.1, 0] },
  { label: 'Notch', position: [0.5, 0.3, 3.6], target: [0, 0.05, 0] },
  { label: 'Top', position: [0, 5.2, 1.4], target: [0, -0.2, 0] },
];

export function KneeMriModule({
  presetTrigger,
  onReportChange,
  onExposeCanvases,
}: KneeMriModuleProps) {
  const [side, setSide] = useState<'Right' | 'Left'>('Right');
  const [pathology, setPathology] = useState<KneePathology>('bucket-handle-medial');
  const [effusion, setEffusion] = useState<'None' | 'Small' | 'Moderate-Large'>('Small');
  const [boneContusion, setBoneContusion] = useState(true);
  const [flexionDeg, setFlexionDeg] = useState(12);

  // Layer visibility
  const [showBones, setShowBones] = useState(true);
  const [ghostBones, setGhostBones] = useState(true);
  const [showMenisci, setShowMenisci] = useState(true);
  const [showCruciates, setShowCruciates] = useState(true);
  const [showCollaterals, setShowCollaterals] = useState(true);
  const [showSlicePlane, setShowSlicePlane] = useState(true);

  // 2D PACS MRI controls
  const [plane, setPlane] = useState<MriPlane>('Sagittal');
  const [sequence, setSequence] = useState<MriSequence>('PD');
  const [sliceIndex, setSliceIndex] = useState(12); // 1..24
  const [wl, setWl] = useState<WindowLevel>({ width: 720, level: 420 });
  const [crosshair, setCrosshair] = useState({ x: 0.5, y: 0.5 });

  const pacsCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragWlRef = useRef<{ active: boolean; startX: number; startY: number; baseW: number; baseL: number }>({
    active: false,
    startX: 0,
    startY: 0,
    baseW: 720,
    baseL: 420,
  });

  // Apply Command Palette preset if triggered
  useEffect(() => {
    if (!presetTrigger) return;
    if (
      presetTrigger === 'normal' ||
      presetTrigger === 'bucket-handle-medial' ||
      presetTrigger === 'acl-complete' ||
      presetTrigger === 'unhappy-triad' ||
      presetTrigger === 'posterior-horn-medial' ||
      presetTrigger === 'pcl-tear'
    ) {
      setPathology(presetTrigger);
      if (presetTrigger === 'bucket-handle-medial') {
        setPlane('Sagittal');
        setSliceIndex(12);
      } else if (presetTrigger === 'acl-complete') {
        setSequence('T2-FS');
        setBoneContusion(true);
        setPlane('Sagittal');
        setSliceIndex(14);
      }
    }
  }, [presetTrigger]);

  // Expose canvases for 9:16 Instagram Reel studio
  useEffect(() => {
    onExposeCanvases(
      () => threeCanvasRef.current,
      () => pacsCanvasRef.current
    );
  }, [onExposeCanvases]);

  // Report sync
  const report = useMemo(
    () =>
      buildKneeReport({
        side,
        pathology,
        effusion,
        boneContusion,
        flexionDeg,
      }),
    [side, pathology, effusion, boneContusion, flexionDeg]
  );

  useEffect(() => {
    onReportChange(report);
  }, [report, onReportChange]);

  // References to dynamic 3D sub-groups
  const refs = useRef<{
    rootGroup?: THREE.Group;
    bonesGroup?: THREE.Group;
    femurMeshList: THREE.Mesh[];
    tibiaPivotGroup?: THREE.Group;
    menisciGroup?: THREE.Group;
    cruciatesGroup?: THREE.Group;
    collateralsGroup?: THREE.Group;
    aclIntact?: THREE.Group;
    aclTorn?: THREE.Group;
    pclIntact?: THREE.Group;
    pclTorn?: THREE.Group;
    mclGroup?: THREE.Group;
    mclMat?: THREE.MeshStandardMaterial;
    bucketFragment?: THREE.Mesh;
    postHornTearMarker?: THREE.Mesh;
    bruiseGroup?: THREE.Group;
    effusionMesh?: THREE.Mesh;
    slicePlane?: THREE.Group;
  }>({ femurMeshList: [] });

  const buildKnee3D = useCallback((ctx: ThreeSceneContext) => {
    const r = refs.current;
    r.femurMeshList = [];

    const rootGroup = new THREE.Group();
    r.rootGroup = rootGroup;
    ctx.root.add(rootGroup);

    const boneMat = createAnatomyMaterial({
      color: 0xe6dcc8,
      roughness: 0.48,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    const cartilageMat = createAnatomyMaterial({
      color: 0x99d6ea,
      roughness: 0.25,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });

    const bonesGroup = new THREE.Group();
    r.bonesGroup = bonesGroup;
    rootGroup.add(bonesGroup);

    // Distal Femur (Shaft + Medial/Lateral Condyles)
    const femurGroup = new THREE.Group();
    const femurShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 1.85, 24), boneMat);
    femurShaft.position.set(0, 1.55, 0);
    const medCondyle = new THREE.Mesh(new THREE.SphereGeometry(0.56, 24, 20), boneMat);
    medCondyle.scale.set(0.88, 0.92, 1.15);
    medCondyle.position.set(0.46, 0.58, -0.05);
    const latCondyle = new THREE.Mesh(new THREE.SphereGeometry(0.54, 24, 20), boneMat);
    latCondyle.scale.set(0.86, 0.9, 1.12);
    latCondyle.position.set(-0.46, 0.58, -0.05);

    const medCart = new THREE.Mesh(new THREE.SphereGeometry(0.57, 20, 16, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), cartilageMat);
    medCart.scale.set(0.88, 0.92, 1.15);
    medCart.position.copy(medCondyle.position);
    const latCart = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 16, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), cartilageMat);
    latCart.scale.set(0.86, 0.9, 1.12);
    latCart.position.copy(latCondyle.position);

    // Patella
    const patella = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 16), boneMat);
    patella.scale.set(1.05, 1.12, 0.45);
    patella.position.set(0, 0.85, 0.82);

    tagAnatomyMesh(femurShaft, {
      structureId: 'femur-shaft',
      label: 'Distal Femur & Condyles',
      description: 'Medial and lateral femoral condyles separated by the intercondylar notch (ACL/PCL attachments).',
    });
    tagAnatomyMesh(medCondyle, {
      structureId: 'medial-femoral-condyle',
      label: 'Medial Femoral Condyle',
      description: 'Larger weight-bearing condyle; anterolateral wall gives origin to the PCL.',
    });
    tagAnatomyMesh(latCondyle, {
      structureId: 'lateral-femoral-condyle',
      label: 'Lateral Femoral Condyle',
      description: 'Posteromedial wall gives origin to the ACL; sulcus terminalis bruises in pivot-shift ACL tears.',
    });
    tagAnatomyMesh(patella, {
      structureId: 'patella',
      label: 'Patella & Trochlear Groove',
      description: 'Largest sesamoid bone; articular cartilage is thickest in the body (up to 5–6 mm).',
    });

    femurGroup.add(femurShaft, medCondyle, latCondyle, medCart, latCart, patella);
    r.femurMeshList.push(femurShaft, medCondyle, latCondyle, patella);
    bonesGroup.add(femurGroup);

    // Tibia + Fibula Pivot Group (rotates with Flexion slider)
    const tibiaPivot = new THREE.Group();
    tibiaPivot.position.set(0, 0.35, 0);
    r.tibiaPivotGroup = tibiaPivot;
    rootGroup.add(tibiaPivot);

    const tibiaPlateau = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.62, 0.36, 28), boneMat);
    tibiaPlateau.scale.set(1.05, 1, 0.78);
    tibiaPlateau.position.set(0, -0.58, -0.02);
    const tibiaShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.42, 1.5, 24), boneMat);
    tibiaShaft.position.set(0, -1.42, -0.02);

    const tibialSpine = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 12), boneMat);
    tibialSpine.position.set(0, -0.35, -0.04);

    // Fibula (lateral!)
    const fibulaHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), boneMat);
    fibulaHead.position.set(-0.92, -0.78, -0.25);
    const fibulaShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1.25, 14), boneMat);
    fibulaShaft.position.set(-0.92, -1.5, -0.25);

    tagAnatomyMesh(tibiaPlateau, {
      structureId: 'tibial-plateau',
      label: 'Proximal Tibial Plateau',
      description: 'Posterolateral tibial plateau sustains impaction contusion during ACL pivot-shift injury.',
    });
    tagAnatomyMesh(tibiaShaft, {
      structureId: 'tibia-shaft',
      label: 'Proximal Tibia',
      description: 'Medial tibial plateau is concave; lateral tibial plateau is slightly convex.',
    });
    tagAnatomyMesh(fibulaHead, {
      structureId: 'fibular-head',
      label: 'Fibular Head (Lateral)',
      description: 'Insertion site for the LCL and biceps femoris tendon (conjoint tendon); Segond avulsion sits anterosuperiorly.',
    });

    tibiaPivot.add(tibiaPlateau, tibiaShaft, tibialSpine, fibulaHead, fibulaShaft);
    r.femurMeshList.push(tibiaPlateau, tibiaShaft, tibialSpine, fibulaHead, fibulaShaft);

    // MENISCI (Attached on tibial plateau)
    const menisciGroup = new THREE.Group();
    r.menisciGroup = menisciGroup;
    tibiaPivot.add(menisciGroup);

    const medMenMat = createAnatomyMaterial({ color: 0x38bdf8, roughness: 0.35 });
    const latMenMat = createAnatomyMaterial({ color: 0x2dd4bf, roughness: 0.35 });

    // Medial Meniscus: wider C-shape (+X side)
    const medMenGeo = new THREE.TorusGeometry(0.38, 0.085, 14, 32, Math.PI * 1.48);
    const medMen = new THREE.Mesh(medMenGeo, medMenMat);
    medMen.rotation.x = Math.PI / 2;
    medMen.rotation.z = -Math.PI * 0.74;
    medMen.scale.set(1.05, 1.28, 0.9);
    medMen.position.set(0.42, -0.34, -0.02);
    tagAnatomyMesh(medMen, {
      structureId: 'medial-meniscus',
      label: 'Medial Meniscus (C-Shaped)',
      description: 'Larger C-shaped fibrocartilage firmly tethered to the deep MCL; posterior horn is larger than anterior horn.',
    });

    // Lateral Meniscus: tighter O-shape (-X side)
    const latMenGeo = new THREE.TorusGeometry(0.34, 0.085, 14, 32, Math.PI * 1.72);
    const latMen = new THREE.Mesh(latMenGeo, latMenMat);
    latMen.rotation.x = Math.PI / 2;
    latMen.rotation.z = Math.PI * 0.14;
    latMen.scale.set(1.0, 1.08, 0.9);
    latMen.position.set(-0.44, -0.34, -0.02);
    tagAnatomyMesh(latMen, {
      structureId: 'lateral-meniscus',
      label: 'Lateral Meniscus (O-Shaped)',
      description: 'More circular and mobile than medial meniscus; symmetric anterior and posterior horns ("bow-tie" on 2–3 sagittal slices).',
    });

    // Displaced Bucket-Handle Fragment (in intercondylar notch!)
    const bucketMat = createAnatomyMaterial({
      color: 0xf87171,
      roughness: 0.3,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.35,
    });
    const bucketFragment = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.068, 12, 24, Math.PI * 0.95),
      bucketMat
    );
    bucketFragment.rotation.set(Math.PI / 2.2, 0.2, -0.4);
    bucketFragment.position.set(0.12, -0.18, 0.06);
    tagAnatomyMesh(bucketFragment, {
      structureId: 'bucket-handle-fragment',
      label: 'Displaced Bucket-Handle Fragment',
      description: 'Flipped medial meniscal fragment displaced into the intercondylar notch beneath the PCL ("Double PCL Sign").',
    });
    r.bucketFragment = bucketFragment;

    // Posterior Horn Tear Marker
    const tearMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 12),
      createAnatomyMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 0.5 })
    );
    tearMarker.position.set(0.55, -0.33, -0.42);
    tagAnatomyMesh(tearMarker, {
      structureId: 'parameniscal-cyst',
      label: 'Posterior Horn Tear & Parameniscal Cyst',
      description: 'Horizontal cleavage tear communicating with a fluid-filled parameniscal cyst along the posteromedial capsule.',
    });
    r.postHornTearMarker = tearMarker;

    menisciGroup.add(medMen, latMen, bucketFragment, tearMarker);

    // CRUCIATES (ACL & PCL)
    const cruciatesGroup = new THREE.Group();
    r.cruciatesGroup = cruciatesGroup;
    rootGroup.add(cruciatesGroup);

    const aclMat = createAnatomyMaterial({ color: 0xfbbf24, roughness: 0.35 });
    const tornMat = createAnatomyMaterial({ color: 0xf87171, roughness: 0.4, emissive: 0x7f1d1d, emissiveIntensity: 0.4 });
    const pclMat = createAnatomyMaterial({ color: 0xa78bfa, roughness: 0.38 });

    // Intact ACL: posteromedial lateral femoral condyle -> anteromedial tibial plateau
    const aclIntact = new THREE.Group();
    const aclCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 0.54, -0.32),
      new THREE.Vector3(-0.04, 0.16, -0.04),
      new THREE.Vector3(0.08, -0.22, 0.24),
    ]);
    const aclTube = new THREE.Mesh(new THREE.TubeGeometry(aclCurve, 20, 0.072, 12, false), aclMat);
    tagAnatomyMesh(aclTube, {
      structureId: 'acl-intact',
      label: 'Anterior Cruciate Ligament (ACL)',
      description: 'Originates on posteromedial lateral femoral condyle, inserts anteromedial tibial spine; resists anterior translation & internal rotation.',
    });
    aclIntact.add(aclTube);
    r.aclIntact = aclIntact;

    // Torn ACL stumps
    const aclTorn = new THREE.Group();
    const aclProx = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.34, 12), tornMat);
    aclProx.position.set(-0.14, 0.42, -0.24);
    aclProx.rotation.set(0.5, 0, -0.3);
    const aclDist = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.32, 12), tornMat);
    aclDist.position.set(0.09, -0.16, 0.18);
    aclDist.rotation.set(1.15, 0, -0.1); // horizontal Blumensaat-abnormal stump
    tagAnatomyMesh(aclDist, {
      structureId: 'acl-torn',
      label: 'Ruptured ACL (Wavy Horizontal Stump)',
      description: 'Complete midsubstance discontinuity with empty intercondylar notch and lax horizontal distal stump.',
    });
    aclTorn.add(aclProx, aclDist);
    r.aclTorn = aclTorn;

    // Intact PCL: anterolateral medial femoral condyle -> posterior tibial plateau
    const pclIntact = new THREE.Group();
    const pclCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, 0.48, 0.14),
      new THREE.Vector3(0.08, 0.18, -0.14),
      new THREE.Vector3(-0.02, -0.24, -0.36),
    ]);
    const pclTube = new THREE.Mesh(new THREE.TubeGeometry(pclCurve, 20, 0.088, 12, false), pclMat);
    tagAnatomyMesh(pclTube, {
      structureId: 'pcl-intact',
      label: 'Posterior Cruciate Ligament (PCL)',
      description: 'Thickest intra-articular ligament; curves smoothly from medial femoral condyle to posterior tibial facet. Resists posterior translation.',
    });
    pclIntact.add(pclTube);
    r.pclIntact = pclIntact;

    // Torn PCL
    const pclTorn = new THREE.Group();
    const pclProx = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 0.34, 12), tornMat);
    pclProx.position.set(0.14, 0.36, 0.04);
    pclProx.rotation.set(-0.6, 0, 0.25);
    const pclDist = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.3, 12), tornMat);
    pclDist.position.set(-0.01, -0.16, -0.32);
    pclDist.rotation.set(-0.4, 0, 0);
    tagAnatomyMesh(pclDist, {
      structureId: 'pcl-torn',
      label: 'Ruptured PCL',
      description: 'Disruption of posterior cruciate ligament fibers with posterior tibial sag.',
    });
    pclTorn.add(pclProx, pclDist);
    r.pclTorn = pclTorn;

    cruciatesGroup.add(aclIntact, aclTorn, pclIntact, pclTorn);

    // COLLATERALS (MCL + LCL)
    const collateralsGroup = new THREE.Group();
    r.collateralsGroup = collateralsGroup;
    rootGroup.add(collateralsGroup);

    const mclMat = createAnatomyMaterial({ color: 0x34d399, roughness: 0.45 });
    r.mclMat = mclMat;
    const mclCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.84, 0.65, -0.02),
      new THREE.Vector3(0.92, 0.0, -0.02),
      new THREE.Vector3(0.76, -0.85, 0.02),
    ]);
    const mclMesh = new THREE.Mesh(new THREE.TubeGeometry(mclCurve, 18, 0.07, 10, false), mclMat);
    mclMesh.scale.set(0.65, 1, 1.5);
    tagAnatomyMesh(mclMesh, {
      structureId: 'mcl',
      label: 'Medial Collateral Ligament (MCL)',
      description: 'Broad ribbon-like stabilizer against valgus stress; deep fibers attach directly to the medial meniscus.',
    });
    const mclGroup = new THREE.Group();
    mclGroup.add(mclMesh);
    r.mclGroup = mclGroup;

    const lclMat = createAnatomyMaterial({ color: 0x6ee7b7, roughness: 0.45 });
    const lclCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.84, 0.58, -0.06),
      new THREE.Vector3(-0.92, -0.08, -0.16),
      new THREE.Vector3(-0.92, -0.74, -0.25),
    ]);
    const lclMesh = new THREE.Mesh(new THREE.TubeGeometry(lclCurve, 16, 0.055, 10, false), lclMat);
    tagAnatomyMesh(lclMesh, {
      structureId: 'lcl',
      label: 'Lateral (Fibular) Collateral Ligament',
      description: 'Cord-like primary varus stabilizer extending from lateral femoral epicondyle to fibular head.',
    });

    collateralsGroup.add(mclGroup, lclMesh);

    // Pivot-Shift Bone Contusions & Joint Effusion
    const bruiseGroup = new THREE.Group();
    const bruiseMat = createAnatomyMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    });
    const femBruise = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), bruiseMat);
    femBruise.position.set(-0.48, 0.36, 0.22);
    const tibBruise = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), bruiseMat);
    tibBruise.position.set(-0.46, -0.44, -0.34);
    tagAnatomyMesh(femBruise, {
      structureId: 'pivot-bruise',
      label: 'Pivot-Shift Bone Contusion',
      description: 'Impaction marrow edema at sulcus terminalis (lateral femoral condyle) and posterolateral tibial plateau.',
    });
    bruiseGroup.add(femBruise, tibBruise);
    r.bruiseGroup = bruiseGroup;
    rootGroup.add(bruiseGroup);

    const effusionMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 18, 14),
      createAnatomyMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      })
    );
    effusionMesh.scale.set(1.1, 1.35, 0.65);
    effusionMesh.position.set(0, 1.25, 0.58);
    tagAnatomyMesh(effusionMesh, {
      structureId: 'suprapatellar-effusion',
      label: 'Suprapatellar Joint Effusion',
      description: 'Fluid distension of the suprapatellar pouch deep to the quadriceps tendon.',
    });
    r.effusionMesh = effusionMesh;
    rootGroup.add(effusionMesh);

    // Synchronized 2D MRI Slice Plane Indicator
    const slicePlane = createSlicePlaneMesh(2.7, 3.4, 0xd4a853);
    r.slicePlane = slicePlane;
    rootGroup.add(slicePlane);
  }, []);

  const updateKnee3D = useCallback(() => {
    const r = refs.current;
    if (!r.rootGroup) return;

    // Mirror Left vs Right
    r.rootGroup.scale.x = side === 'Left' ? -1 : 1;

    // Flexion rotation around X-axis
    if (r.tibiaPivotGroup) {
      r.tibiaPivotGroup.rotation.x = -(flexionDeg * Math.PI) / 180;
    }

    // Bone visibility & ghost mode
    if (r.bonesGroup) {
      r.bonesGroup.visible = showBones;
      for (const m of r.femurMeshList) {
        if (m.material instanceof THREE.MeshStandardMaterial) {
          m.material.opacity = ghostBones ? 0.32 : 0.94;
          m.material.transparent = ghostBones;
          m.material.depthWrite = !ghostBones;
        }
      }
    }

    if (r.menisciGroup) r.menisciGroup.visible = showMenisci;
    if (r.cruciatesGroup) r.cruciatesGroup.visible = showCruciates;
    if (r.collateralsGroup) r.collateralsGroup.visible = showCollaterals;

    const aclRuined = pathology === 'acl-complete' || pathology === 'unhappy-triad';
    const pclRuined = pathology === 'pcl-tear';

    if (r.aclIntact) r.aclIntact.visible = !aclRuined;
    if (r.aclTorn) r.aclTorn.visible = aclRuined;
    if (r.pclIntact) r.pclIntact.visible = !pclRuined;
    if (r.pclTorn) r.pclTorn.visible = pclRuined;

    if (r.bucketFragment) r.bucketFragment.visible = pathology === 'bucket-handle-medial';
    if (r.postHornTearMarker) r.postHornTearMarker.visible = pathology === 'posterior-horn-medial';

    if (r.mclMat) {
      if (pathology === 'unhappy-triad') {
        r.mclMat.color.setHex(0xf87171);
        r.mclMat.emissive.setHex(0x7f1d1d);
        r.mclMat.emissiveIntensity = 0.45;
      } else {
        r.mclMat.color.setHex(0x34d399);
        r.mclMat.emissive.setHex(0x000000);
        r.mclMat.emissiveIntensity = 0;
      }
    }

    if (r.bruiseGroup) {
      r.bruiseGroup.visible = boneContusion && (pathology === 'acl-complete' || pathology === 'unhappy-triad');
    }

    if (r.effusionMesh) {
      r.effusionMesh.visible = effusion !== 'None';
      const s = effusion === 'Moderate-Large' ? 1.2 : 0.82;
      r.effusionMesh.scale.set(1.1 * s, 1.35 * s, 0.65 * s);
    }

    // Slice plane position & orientation
    if (r.slicePlane) {
      r.slicePlane.visible = showSlicePlane;
      const norm = (sliceIndex - 12.5) / 11.5; // -1..+1
      if (plane === 'Sagittal') {
        r.slicePlane.rotation.set(0, Math.PI / 2, 0);
        r.slicePlane.position.set(norm * 0.95, 0.05, 0);
      } else if (plane === 'Coronal') {
        r.slicePlane.rotation.set(0, 0, 0);
        r.slicePlane.position.set(0, 0.05, norm * 0.85);
      } else {
        r.slicePlane.rotation.set(Math.PI / 2, 0, 0);
        r.slicePlane.position.set(0, norm * 0.95, 0);
      }
    }
  }, [
    side,
    pathology,
    effusion,
    boneContusion,
    flexionDeg,
    showBones,
    ghostBones,
    showMenisci,
    showCruciates,
    showCollaterals,
    showSlicePlane,
    plane,
    sliceIndex,
  ]);

  // 2D Synthetic MRI Slice Renderer (Physically based tissue contrast for PD / T2-FS / T1)
  useEffect(() => {
    const canvas = pacsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const img = ctx.createImageData(W, H);
    const data = img.data;

    // Tissue intensities per sequence (0..1000 scale)
    const sig = {
      bg: 15,
      muscle: sequence === 'T2-FS' ? 175 : sequence === 'PD' ? 275 : 320,
      fat: sequence === 'T2-FS' ? 140 : sequence === 'PD' ? 760 : 890,
      marrow: sequence === 'T2-FS' ? 160 : sequence === 'PD' ? 720 : 860,
      cortex: 35,
      cartilage: sequence === 'T2-FS' ? 420 : sequence === 'PD' ? 520 : 380,
      meniscus: 38,
      ligament: 55,
      fluid: sequence === 'T2-FS' ? 960 : sequence === 'PD' ? 780 : 140,
      edema: sequence === 'T2-FS' ? 880 : sequence === 'PD' ? 560 : 210,
      tearLine: sequence === 'T2-FS' ? 890 : sequence === 'PD' ? 760 : 260,
    };

    const sliceNorm = (sliceIndex - 12.5) / 11.5; // -1 (medial/post/inf) .. +1 (lat/ant/sup)
    const isNotch = Math.abs(sliceNorm) < 0.28;
    const isMedialSide = sliceNorm < -0.22;
    const isLateralSide = sliceNorm > 0.22;

    for (let py = 0; py < H; py++) {
      const ny = (py / H) * 2 - 1; // -1 top .. +1 bottom
      for (let px = 0; px < W; px++) {
        const nx = (px / W) * 2 - 1; // -1 left .. +1 right
        let val = sig.bg;

        const r2 = nx * nx + ny * ny;
        if (r2 < 0.92) {
          // Soft tissue envelope + subcutaneous fat rim
          val = r2 > 0.72 ? sig.fat : sig.muscle;

          if (plane === 'Sagittal') {
            // Distal femur condyle silhouette (top)
            const femDx = nx + 0.05;
            const femDy = ny + 0.36;
            const femDist = Math.hypot(femDx * 0.95, femDy * 1.12);
            const condyleWidth = isNotch ? 0.32 : 0.44;
            if (femDist < condyleWidth && ny < 0.12) {
              val = femDist > condyleWidth - 0.032 ? sig.cortex : sig.marrow;
              if (femDist > condyleWidth - 0.055 && ny > -0.15) val = sig.cartilage;

              // Pivot-shift lateral femoral condyle sulcus terminalis bruise
              if (
                boneContusion &&
                (pathology === 'acl-complete' || pathology === 'unhappy-triad') &&
                isLateralSide &&
                Math.hypot(nx + 0.15, ny + 0.12) < 0.14
              ) {
                val = sig.edema;
              }
            }

            // Femoral shaft extension upward with smooth metaphyseal flare
            const femFlare = ny < -0.3 ? Math.max(0.2, 0.22 + (ny + 0.3) * -0.18) : 0.22;
            if (Math.abs(nx + 0.02) < femFlare && ny < -0.3) {
              val = Math.abs(nx + 0.02) > femFlare - 0.032 ? sig.cortex : sig.marrow;
            }

            // Tibial plateau & shaft (bottom) with rounded anterior/posterior condylar lips
            const tibWidth = ny < 0.34 ? 0.36 - Math.max(0, 0.22 - ny) * 0.45 : 0.24;
            if (ny > 0.14 && Math.abs(nx - 0.03) < tibWidth) {
              const isRim = ny < 0.175 || Math.abs(nx - 0.03) > tibWidth - 0.032;
              val = isRim ? sig.cortex : sig.marrow;
              if (ny >= 0.12 && ny < 0.16 && Math.abs(nx - 0.03) < 0.29) val = sig.cartilage;

              // Posterolateral tibial plateau bruise
              if (
                boneContusion &&
                (pathology === 'acl-complete' || pathology === 'unhappy-triad') &&
                isLateralSide &&
                Math.hypot(nx - 0.21, ny - 0.24) < 0.12
              ) {
                val = sig.edema;
              }
            }

            // Patella (anterior = left nx < -0.45)
            const patDist = Math.hypot((nx + 0.54) * 1.65, (ny + 0.14) * 0.95);
            if (patDist < 0.21 && Math.abs(sliceNorm) < 0.55) {
              val = patDist > 0.18 ? sig.cortex : sig.marrow;
            }

            // Suprapatellar effusion
            if (effusion !== 'None') {
              const effR = effusion === 'Moderate-Large' ? 0.16 : 0.1;
              if (Math.hypot((nx + 0.37) * 1.25, (ny + 0.43) * 0.65) < effR) {
                val = sig.fluid;
              }
            }

            // Hoffa infrapatellar fat pad (organic triangular wedge behind patellar tendon)
            if (Math.hypot((nx + 0.33) * 1.35, (ny - 0.13) * 1.1) < 0.19 && nx < -0.18) {
              val = sig.fat;
            }

            // Meniscal horns (on non-notch slices)
            if (!isNotch) {
              const truncatedByBucket =
                pathology === 'bucket-handle-medial' && isMedialSide && Math.abs(sliceNorm) < 0.55;
              if (!truncatedByBucket) {
                // Anterior horn triangle
                if (nx > -0.26 && nx < -0.09 && ny > 0.03 && ny < 0.14 && ny > 0.03 + (nx + 0.26) * 0.45) {
                  val = sig.meniscus;
                }
                // Posterior horn triangle
                if (nx > 0.14 && nx < 0.34 && ny > 0.03 && ny < 0.14 && ny > 0.14 - (nx - 0.14) * 0.45) {
                  val = sig.meniscus;
                  // Horizontal tear line in posterior horn medial meniscus
                  if (pathology === 'posterior-horn-medial' && isMedialSide && Math.abs(ny - 0.095) < 0.012) {
                    val = sig.tearLine;
                  }
                }
              }
              // Parameniscal cyst
              if (
                pathology === 'posterior-horn-medial' &&
                isMedialSide &&
                Math.hypot(nx - 0.41, ny - 0.09) < 0.085
              ) {
                val = sig.fluid;
              }
            }

            // Intercondylar notch structures (ACL, PCL, Double PCL sign!)
            if (isNotch) {
              // PCL curved dark band
              const pclY = -0.14 + (nx + 0.04) * 0.85 + Math.pow(nx - 0.04, 2) * 1.3;
              if (nx > -0.12 && nx < 0.24 && Math.abs(ny - pclY) < 0.038) {
                if (pathology === 'pcl-tear' && Math.abs(nx - 0.06) < 0.055) {
                  val = sig.fluid;
                } else {
                  val = sig.ligament;
                }
              }

              // DOUBLE PCL SIGN (Bucket-handle medial meniscus flipped right beneath/anterior to PCL!)
              if (pathology === 'bucket-handle-medial') {
                const dpclY = pclY + 0.11;
                if (nx > -0.11 && nx < 0.18 && Math.abs(ny - dpclY) < 0.032) {
                  val = sig.meniscus;
                }
              }

              // ACL oblique band
              const aclY = 0.04 - (nx - 0.02) * 1.05;
              if (nx > -0.16 && nx < 0.18 && Math.abs(ny - aclY) < 0.028) {
                if (pathology === 'acl-complete' || pathology === 'unhappy-triad') {
                  val = Math.abs(nx) < 0.08 ? sig.fluid : sig.edema;
                } else {
                  val = sig.ligament;
                }
              }
            }
          } else if (plane === 'Coronal') {
            // Medial (+X right) and Lateral (-X left) Femoral Condyles
            const medC = Math.hypot((nx - 0.32) * 1.05, (ny + 0.32) * 1.1);
            const latC = Math.hypot((nx + 0.32) * 1.05, (ny + 0.32) * 1.1);
            if ((medC < 0.34 || latC < 0.34) && ny < 0.08) {
              const d = Math.min(medC, latC);
              val = d > 0.31 ? sig.cortex : sig.marrow;
              if (
                boneContusion &&
                (pathology === 'acl-complete' || pathology === 'unhappy-triad') &&
                nx < -0.15 &&
                ny > -0.2
              ) {
                val = sig.edema;
              }
            }
            // Tibial plateau (bottom)
            if (ny > 0.14 && Math.abs(nx) < 0.62) {
              val = ny < 0.17 || Math.abs(nx) > 0.59 ? sig.cortex : sig.marrow;
            }
            // Medial & Lateral Meniscus wedges
            if (nx > 0.32 && nx < 0.58 && ny > 0.04 && ny < 0.14) val = sig.meniscus;
            if (nx < -0.32 && nx > -0.58 && ny > 0.04 && ny < 0.14) val = sig.meniscus;

            // Bucket handle fragment sitting in notch!
            if (pathology === 'bucket-handle-medial' && Math.hypot(nx - 0.06, ny - 0.03) < 0.07) {
              val = sig.meniscus;
            }

            // MCL ribbon on medial side
            if (nx > 0.63 && nx < 0.69 && ny > -0.35 && ny < 0.45) {
              val = pathology === 'unhappy-triad' ? sig.fluid : sig.ligament;
            }
            // LCL on lateral side
            if (nx < -0.63 && nx > -0.68 && ny > -0.28 && ny < 0.38) {
              val = sig.ligament;
            }
          } else {
            // Axial slice
            const boneR = Math.hypot(nx * 0.92, ny * 1.15);
            if (boneR < 0.52) {
              val = boneR > 0.48 ? sig.cortex : sig.marrow;
            }
            // Patella anteriorly (top)
            if (Math.hypot((nx) * 1.4, (ny + 0.66) * 2.2) < 0.32) {
              val = sig.marrow;
            }
            if (effusion !== 'None' && Math.abs(ny + 0.52) < 0.08 && Math.abs(nx) < 0.38) {
              val = sig.fluid;
            }
          }
        }

        // Subtle deterministic Rician noise
        const noisy = val + fastPixelNoise(px, py, sliceIndex + (sequence === 'PD' ? 1 : 9)) * 14;
        const gray = applyWindowLevel(noisy, wl);
        const idx = (py * W + px) * 4;
        data[idx] = gray;
        data[idx + 1] = gray;
        data[idx + 2] = gray;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);

    const orient =
      plane === 'Sagittal'
        ? { top: 'S', bottom: 'I', left: 'A', right: 'P' }
        : plane === 'Coronal'
          ? { top: 'S', bottom: 'I', left: side === 'Right' ? 'L' : 'R', right: side === 'Right' ? 'R' : 'L' }
          : { top: 'A', bottom: 'P', left: side === 'Right' ? 'L' : 'R', right: side === 'Right' ? 'R' : 'L' };

    drawPacsOrientationMarkers(ctx, W, H, orient);
    drawPacsScaleBar(ctx, W - 16, H / 2 - 50, 100, '5 cm');
    drawCrosshairs(ctx, W, H, crosshair.x, crosshair.y);
  }, [plane, sequence, sliceIndex, wl, pathology, effusion, boneContusion, side, crosshair]);

  return (
    <div className="workstation-body">
      {/* Left Clinical Control Rail */}
      <aside className="control-rail" aria-label="Knee MRI Controls">
        <div className="rail-header">
          <h1 className="rail-title">Knee MRI &amp; Biomechanics</h1>
          <div className="rail-subtitle">3D Ligament Kinematics + Synchronized Multi-Planar PD / T2-FS</div>
        </div>

        <div className="panel-section">
          <div className="section-label">
            <span>Pathology Preset</span>
            <span>{side} Knee</span>
          </div>
          <div className="chip-grid" style={{ marginBottom: 4 }}>
            {(['Right', 'Left'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`chip-btn ${side === s ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => setSide(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="chip-grid">
            {PATHOLOGY_LABELS.map((item) => (
              <button
                key={item.id}
                id={`knee-preset-${item.id}`}
                type="button"
                className={`chip-btn ${item.id !== 'normal' ? 'danger' : ''} ${pathology === item.id ? 'active' : ''}`}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setPathology(item.id)}
              >
                <span>{item.label}</span>
                <span className="module-tab-mod">{item.tag}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="section-label">Biomechanics &amp; Secondary Signs</div>
          <div className="slider-field">
            <div className="slider-meta">
              <span>Knee Flexion Angle</span>
              <span className="slider-val">{flexionDeg}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={85}
              value={flexionDeg}
              onChange={(e) => setFlexionDeg(Number(e.target.value))}
            />
          </div>

          <div className="slider-field">
            <div className="slider-meta">
              <span>Joint Effusion</span>
              <span className="slider-val">{effusion}</span>
            </div>
            <div className="chip-grid">
              {(['None', 'Small', 'Moderate-Large'] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`chip-btn ${effusion === e ? 'active' : ''}`}
                  onClick={() => setEffusion(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <label className="toggle-row">
            <span>Pivot-Shift Bone Contusions</span>
            <input
              type="checkbox"
              checked={boneContusion}
              onChange={(e) => setBoneContusion(e.target.checked)}
            />
          </label>
        </div>

        <div className="panel-section">
          <div className="section-label">3D Anatomical Layers</div>
          <div className="toggle-list">
            <label className="toggle-row">
              <span>Bones (Femur / Tibia / Fibula)</span>
              <input type="checkbox" checked={showBones} onChange={(e) => setShowBones(e.target.checked)} />
            </label>
            <label className="toggle-row">
              <span>X-Ray Translucent Bones</span>
              <input type="checkbox" checked={ghostBones} onChange={(e) => setGhostBones(e.target.checked)} />
            </label>
            <label className="toggle-row">
              <span>Menisci (Medial &amp; Lateral)</span>
              <input type="checkbox" checked={showMenisci} onChange={(e) => setShowMenisci(e.target.checked)} />
            </label>
            <label className="toggle-row">
              <span>Cruciates (ACL &amp; PCL)</span>
              <input type="checkbox" checked={showCruciates} onChange={(e) => setShowCruciates(e.target.checked)} />
            </label>
            <label className="toggle-row">
              <span>Collaterals (MCL &amp; LCL)</span>
              <input type="checkbox" checked={showCollaterals} onChange={(e) => setShowCollaterals(e.target.checked)} />
            </label>
            <label className="toggle-row">
              <span>Show 2D MRI Slice Plane</span>
              <input type="checkbox" checked={showSlicePlane} onChange={(e) => setShowSlicePlane(e.target.checked)} />
            </label>
          </div>
        </div>
      </aside>

      {/* Center Split: 3D Anatomy + 2D PACS MRI Stack */}
      <main className="stage-area">
        <ThreeViewport
          title={`${side} Knee 3D Anatomy`}
          badge="3D WEBGL"
          cameraPresets={CAMERA_PRESETS}
          initialCamera={[0.3, 0.85, 5.2]}
          onBuildScene={(ctx) => {
            buildKnee3D(ctx);
            updateKnee3D();
          }}
          onUpdateScene={updateKnee3D}
          deps={[updateKnee3D]}
          onCanvasExpose={(canvas) => {
            threeCanvasRef.current = canvas;
          }}
        />

        <section className="viewport-card" aria-label="2D Knee MRI PACS Viewer">
          <div className="viewport-header">
            <div className="vp-title-group">
              <span className="vp-badge">2D PACS</span>
              <span className="vp-title">
                {plane} {sequence} • Slice {sliceIndex}/24
              </span>
            </div>
            <div className="vp-toolbar">
              {(['Sagittal', 'Coronal', 'Axial'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`vp-mini-btn ${plane === p ? 'active' : ''}`}
                  onClick={() => setPlane(p)}
                >
                  {p.slice(0, 3)}
                </button>
              ))}
              {(['PD', 'T2-FS', 'T1'] as const).map((seq) => (
                <button
                  key={seq}
                  type="button"
                  className={`vp-mini-btn ${sequence === seq ? 'active' : ''}`}
                  onClick={() => setSequence(seq)}
                >
                  {seq}
                </button>
              ))}
            </div>
          </div>

          <div className="pacs-stage">
            <div
              className="pacs-canvas-wrap"
              onWheel={(e) => {
                e.preventDefault();
                setSliceIndex((idx) => Math.max(1, Math.min(24, idx + (e.deltaY > 0 ? 1 : -1))));
              }}
              onPointerDown={(e) => {
                if (e.button === 2 || e.shiftKey) {
                  dragWlRef.current = {
                    active: true,
                    startX: e.clientX,
                    startY: e.clientY,
                    baseW: wl.width,
                    baseL: wl.level,
                  };
                } else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setCrosshair({
                    x: Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width)),
                    y: Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height)),
                  });
                }
              }}
              onPointerMove={(e) => {
                if (!dragWlRef.current.active) return;
                const dx = e.clientX - dragWlRef.current.startX;
                const dy = e.clientY - dragWlRef.current.startY;
                setWl({
                  width: Math.max(120, Math.min(1600, dragWlRef.current.baseW + dx * 3)),
                  level: Math.max(80, Math.min(950, dragWlRef.current.baseL + dy * 2)),
                });
              }}
              onPointerUp={() => {
                dragWlRef.current.active = false;
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <canvas ref={pacsCanvasRef} width={380} height={380} className="pacs-canvas" />
              <div className="pacs-overlay-tl">
                <div>SYNTHETIC 3T MR • ZERO PHI</div>
                <div>SE: {sequence} • {plane.toUpperCase()}</div>
              </div>
              <div className="pacs-overlay-tr">
                <div>{side.toUpperCase()} KNEE</div>
                <div>IM: {sliceIndex}/24</div>
              </div>
              <div className="pacs-overlay-bl">
                <div>W: {Math.round(wl.width)} / L: {Math.round(wl.level)}</div>
                <div>Shift+Drag or Right-Drag: W/L</div>
              </div>
              <div className="pacs-overlay-br">
                <div>SL: 3.0 mm</div>
                <div>FOV: 16 cm</div>
              </div>
            </div>

            <div className="pacs-substrip">
              <div className="slider-field">
                <div className="slider-meta">
                  <span>Stack Scroll (Wheel or Slider)</span>
                  <span className="slider-val">
                    {sliceIndex <= 8 ? 'Medial' : sliceIndex >= 17 ? 'Lateral' : 'Intercondylar Notch'} ({sliceIndex}/24)
                  </span>
                </div>
                <input
                  id="knee-slice-slider"
                  type="range"
                  min={1}
                  max={24}
                  value={sliceIndex}
                  onChange={(e) => setSliceIndex(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
