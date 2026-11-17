import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeViewport, type CameraPreset, type ThreeSceneContext } from '../components/ThreeViewport';
import {
  buildTemporalReport,
  type TemporalPathology,
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

type TemporalPlane = 'Axial HRCT' | 'Coronal HRCT' | 'Pöschl Oblique' | 'Stenvers Oblique' | 'IAC CISS MRI';

interface TemporalBoneModuleProps {
  presetTrigger?: string;
  onReportChange: (report: StructuredReport) => void;
  onExposeCanvases: (get3d: () => HTMLCanvasElement | null, get2d: () => HTMLCanvasElement | null) => void;
}

const PATHOLOGY_OPTIONS: Array<{ id: TemporalPathology; label: string; sign: string }> = [
  { id: 'normal', label: 'Normal Labyrinth & IAC', sign: 'Intact' },
  { id: 'sscd', label: 'Sup. Semicircular Canal Dehiscence', sign: 'Pöschl Roof' },
  { id: 'cholesteatoma', label: 'Pars Flaccida Cholesteatoma', sign: 'Prussak/Scutum' },
  { id: 'vestibular-schwannoma', label: 'Vestibular Schwannoma', sign: 'Ice Cream Cone' },
  { id: 'otosclerosis', label: 'Fenestral Otosclerosis', sign: 'Fissula Plaque' },
  { id: 'mondini', label: 'Mondini (IP-II + EVA)', sign: '1.5 Turns' },
];

const CAMERA_PRESETS: CameraPreset[] = [
  { label: 'Sup-Lat', position: [2.8, 2.2, 3.6], target: [0, 0, 0] },
  { label: 'Pöschl', position: [1.4, 2.9, 2.6], target: [-0.3, 0.25, -0.1] },
  { label: 'Ossicles', position: [3.2, 0.4, 2.2], target: [0.85, 0.05, 0.25] },
  { label: 'IAC', position: [-3.4, 0.6, 2.2], target: [-0.9, 0.05, -0.2] },
];

export function TemporalBoneModule({
  presetTrigger,
  onReportChange,
  onExposeCanvases,
}: TemporalBoneModuleProps) {
  const [side, setSide] = useState<'Right' | 'Left'>('Right');
  const [pathology, setPathology] = useState<TemporalPathology>('sscd');
  const [plane, setPlane] = useState<TemporalPlane>('Pöschl Oblique');
  const [sliceIndex, setSliceIndex] = useState(12);
  const [wl, setWl] = useState<WindowLevel>({ width: 4000, level: 700 });
  const [crosshair, setCrosshair] = useState({ x: 0.5, y: 0.5 });

  // Layer toggles
  const [showLabyrinth, setShowLabyrinth] = useState(true);
  const [showOssicles, setShowOssicles] = useState(true);
  const [showFacialNerve, setShowFacialNerve] = useState(true);
  const [showIacNerves, setShowIacNerves] = useState(true);
  const [showSlicePlane, setShowSlicePlane] = useState(true);

  const pacsCanvasRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragWlRef = useRef({ active: false, startX: 0, startY: 0, baseW: 4000, baseL: 700 });

  useEffect(() => {
    if (!presetTrigger) return;
    if (
      presetTrigger === 'normal' ||
      presetTrigger === 'sscd' ||
      presetTrigger === 'cholesteatoma' ||
      presetTrigger === 'vestibular-schwannoma' ||
      presetTrigger === 'otosclerosis' ||
      presetTrigger === 'mondini'
    ) {
      setPathology(presetTrigger);
      if (presetTrigger === 'sscd') {
        setPlane('Pöschl Oblique');
        setWl({ width: 4000, level: 700 });
      } else if (presetTrigger === 'vestibular-schwannoma') {
        setPlane('IAC CISS MRI');
        setWl({ width: 900, level: 450 });
      } else if (presetTrigger === 'cholesteatoma') {
        setPlane('Coronal HRCT');
        setWl({ width: 4000, level: 700 });
      }
    }
  }, [presetTrigger]);

  useEffect(() => {
    onExposeCanvases(
      () => threeCanvasRef.current,
      () => pacsCanvasRef.current
    );
  }, [onExposeCanvases]);

  const handlePlaneChange = (newPlane: TemporalPlane) => {
    setPlane(newPlane);
    if (newPlane === 'IAC CISS MRI') {
      setWl({ width: 900, level: 450 });
    } else {
      setWl({ width: 4000, level: 700 });
    }
  };

  const report = useMemo(() => buildTemporalReport(side, pathology), [side, pathology]);

  useEffect(() => {
    onReportChange(report);
  }, [report, onReportChange]);

  // 3D refs
  const refs = useRef<{
    rootGroup?: THREE.Group;
    labyrinthGroup?: THREE.Group;
    ossiclesGroup?: THREE.Group;
    facialGroup?: THREE.Group;
    iacGroup?: THREE.Group;
    sscdDefect?: THREE.Mesh;
    cholesteatomaMass?: THREE.Mesh;
    schwannomaMass?: THREE.Mesh;
    otosclerosisPlaque?: THREE.Mesh;
    mondiniApex?: THREE.Mesh;
    slicePlane?: THREE.Group;
  }>({});

  const buildTemporal3D = useCallback((ctx: ThreeSceneContext) => {
    const r = refs.current;
    const rootGroup = new THREE.Group();
    r.rootGroup = rootGroup;
    ctx.root.add(rootGroup);

    // 1. MEMBRANOUS LABYRINTH (Cochlea + Vestibule + 3 Semicircular Canals)
    const labyrinthGroup = new THREE.Group();
    r.labyrinthGroup = labyrinthGroup;
    rootGroup.add(labyrinthGroup);

    const labMat = createAnatomyMaterial({
      color: 0x38bdf8,
      roughness: 0.28,
      metalness: 0.12,
    });

    // 2.5-turn conical spiral Cochlea (anterior-medial)
    const cochleaPoints: THREE.Vector3[] = [];
    const turns = 2.5;
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * turns * Math.PI * 2;
      const radius = 0.42 * (1 - t * 0.68);
      const x = 0.25 + Math.cos(angle) * radius;
      const y = -0.15 + Math.sin(angle) * radius * 0.72;
      const z = 0.35 + t * 0.48;
      cochleaPoints.push(new THREE.Vector3(x, y, z));
    }
    const cochleaCurve = new THREE.CatmullRomCurve3(cochleaPoints);
    const cochlea = new THREE.Mesh(new THREE.TubeGeometry(cochleaCurve, 72, 0.088, 12, false), labMat);
    tagAnatomyMesh(cochlea, {
      structureId: 'cochlea',
      label: 'Cochlea (2.5 Turns)',
      description: 'Basal, middle, and apical turns spiral around the bony modiolus; evaluated best on Axial & Stenvers HRCT.',
    });

    // Vestibule
    const vestibule = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), labMat);
    vestibule.scale.set(1.15, 0.95, 1.05);
    vestibule.position.set(-0.32, 0.04, -0.12);
    tagAnatomyMesh(vestibule, {
      structureId: 'vestibule',
      label: 'Vestibule',
      description: 'Central chamber housing utricle and saccule; communicates with oval window laterally and semicircular canals posteriorly.',
    });

    // Superior (Anterior) Semicircular Canal (oriented in Pöschl plane!)
    const sscCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.22, 0.22, 0.06),
      new THREE.Vector3(-0.34, 0.88, -0.02),
      new THREE.Vector3(-0.62, 0.86, -0.34),
      new THREE.Vector3(-0.56, 0.24, -0.34),
    ]);
    const ssc = new THREE.Mesh(new THREE.TubeGeometry(sscCurve, 28, 0.058, 12, false), labMat);
    tagAnatomyMesh(ssc, {
      structureId: 'superior-ssc',
      label: 'Superior Semicircular Canal (SSC)',
      description: 'Lies beneath the arcuate eminence; Pöschl oblique reformation slices parallel to this canal to detect SSCD.',
    });

    // Lateral (Horizontal) Semicircular Canal
    const lscCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 0.06, 0.04),
      new THREE.Vector3(-0.1, 0.05, -0.45),
      new THREE.Vector3(-0.52, 0.04, -0.58),
      new THREE.Vector3(-0.52, 0.04, -0.2),
    ]);
    const lsc = new THREE.Mesh(new THREE.TubeGeometry(lscCurve, 24, 0.058, 12, false), labMat);
    tagAnatomyMesh(lsc, {
      structureId: 'lateral-ssc',
      label: 'Lateral (Horizontal) Semicircular Canal',
      description: 'Forms a bony bulge on medial wall of epitympanum directly superior to tympanic CN VII; prone to cholesteatoma fistula.',
    });

    // Posterior Semicircular Canal
    const pscCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.48, 0.22, -0.28),
      new THREE.Vector3(-0.88, 0.16, -0.58),
      new THREE.Vector3(-0.76, -0.44, -0.44),
      new THREE.Vector3(-0.42, -0.18, -0.18),
    ]);
    const psc = new THREE.Mesh(new THREE.TubeGeometry(pscCurve, 26, 0.058, 12, false), labMat);
    tagAnatomyMesh(psc, {
      structureId: 'posterior-ssc',
      label: 'Posterior Semicircular Canal',
      description: 'Oriented parallel to posterior petrous ridge (Stenvers plane); shares common crus with superior canal.',
    });

    labyrinthGroup.add(cochlea, vestibule, ssc, lsc, psc);

    // 2. OSSICULAR CHAIN (Malleus, Incus, Stapes)
    const ossiclesGroup = new THREE.Group();
    r.ossiclesGroup = ossiclesGroup;
    rootGroup.add(ossiclesGroup);

    const boneMat = createAnatomyMaterial({ color: 0xefe7d6, roughness: 0.38 });

    // Malleus (Head = "scoop" of ice cream cone + Manubrium)
    const malleusHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 14), boneMat);
    malleusHead.position.set(0.95, 0.24, 0.22);
    const malleusHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.022, 0.45, 10), boneMat);
    malleusHandle.position.set(1.02, -0.06, 0.24);
    malleusHandle.rotation.z = -0.28;
    tagAnatomyMesh(malleusHead, {
      structureId: 'malleus',
      label: 'Malleus (Head & Manubrium)',
      description: 'Forms the anterior "ice cream scoop" of the incudomalleolar joint in the epitympanum (attic).',
    });

    // Incus (Body + Short Process = "cone" + Long Process)
    const incusBody = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.36, 14), boneMat);
    incusBody.rotation.set(Math.PI / 2, 0, -0.2);
    incusBody.position.set(0.84, 0.22, -0.04);
    const incusLong = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.024, 0.34, 10), boneMat);
    incusLong.position.set(0.76, -0.02, -0.08);
    tagAnatomyMesh(incusBody, {
      structureId: 'incus',
      label: 'Incus (Body & Long Process)',
      description: 'Forms the posterior "cone" of the ice cream cone; long process is the ossicle most vulnerable to cholesteatoma necrosis.',
    });

    // Stapes (Head + Crura + Oval Window Footplate)
    const stapes = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.24, 12), boneMat);
    stapes.rotation.z = Math.PI / 2;
    stapes.position.set(0.32, -0.04, -0.1);
    tagAnatomyMesh(stapes, {
      structureId: 'stapes',
      label: 'Stapes & Oval Window Footplate',
      description: 'Footplate seats into the oval window; fissula ante fenestram lies immediately anterior (classic site of otosclerosis).',
    });

    ossiclesGroup.add(malleusHead, malleusHandle, incusBody, incusLong, stapes);

    // 3. FACIAL NERVE (CN VII)
    const facialGroup = new THREE.Group();
    r.facialGroup = facialGroup;
    rootGroup.add(facialGroup);

    const nerveMat = createAnatomyMaterial({ color: 0xfacc15, roughness: 0.45 });
    const cn7Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.25, 0.14, 0.14), // IAC anterior-superior ("7-Up")
      new THREE.Vector3(-0.1, 0.24, 0.35), // Labyrinthine segment
      new THREE.Vector3(0.28, 0.3, 0.62), // Geniculate ganglion (anterior genu)
      new THREE.Vector3(0.42, 0.12, -0.1), // Tympanic segment below LSC
      new THREE.Vector3(0.45, -0.05, -0.56), // Posterior genu
      new THREE.Vector3(0.48, -0.85, -0.58), // Mastoid vertical descending
    ]);
    const cn7Mesh = new THREE.Mesh(new THREE.TubeGeometry(cn7Curve, 36, 0.048, 10, false), nerveMat);
    tagAnatomyMesh(cn7Mesh, {
      structureId: 'facial-nerve',
      label: 'Facial Nerve (CN VII)',
      description: 'Courses anterior-superior in IAC ("7-Up") -> labyrinthine -> geniculate ganglion -> tympanic -> vertical mastoid segment.',
    });
    facialGroup.add(cn7Mesh);

    // 4. INTERNAL AUDITORY CANAL (IAC) + CN VIII BUNDLES
    const iacGroup = new THREE.Group();
    r.iacGroup = iacGroup;
    rootGroup.add(iacGroup);

    const iacShell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.3, 1.05, 20, 1, true),
      createAnatomyMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    iacShell.rotation.z = Math.PI / 2;
    iacShell.position.set(-0.98, 0.06, -0.04);
    tagAnatomyMesh(iacShell, {
      structureId: 'iac-canal',
      label: 'Internal Auditory Canal (IAC)',
      description: 'Contains 4 nerves on sagittal CISS: CN VII (ant-sup), Cochlear (ant-inf), Sup/Inf Vestibular (posterior).',
    });

    const cochlearN = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 1.12, 10),
      createAnatomyMaterial({ color: 0xfde047 })
    );
    cochlearN.rotation.z = Math.PI / 2;
    cochlearN.position.set(-0.92, -0.08, 0.12);
    tagAnatomyMesh(cochlearN, {
      structureId: 'cochlear-nerve',
      label: 'Cochlear Nerve ("Coke-Down")',
      description: 'Occupies the anterior-inferior quadrant of the IAC below the transverse crest.',
    });

    const vestN = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.08, 10),
      createAnatomyMaterial({ color: 0xf59e0b })
    );
    vestN.rotation.z = Math.PI / 2;
    vestN.position.set(-0.95, 0.05, -0.18);
    tagAnatomyMesh(vestN, {
      structureId: 'vestibular-nerves',
      label: 'Superior & Inferior Vestibular Nerves',
      description: 'Occupy the posterior half of the IAC; classic site of origin for vestibular schwannoma.',
    });

    iacGroup.add(iacShell, cochlearN, vestN);

    // 5. PATHOLOGY OVERLAYS
    const sscdDefect = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.032, 10, 22),
      createAnatomyMaterial({ color: 0xf87171, emissive: 0xdc2626, emissiveIntensity: 0.75 })
    );
    sscdDefect.position.set(-0.46, 0.92, -0.18);
    sscdDefect.rotation.x = Math.PI / 2;
    tagAnatomyMesh(sscdDefect, {
      structureId: 'sscd-defect',
      label: 'Superior Canal Roof Dehiscence (SSCD)',
      description: 'Missing arcuate eminence bone overlying the apex of the superior semicircular canal ("third mobile window").',
    });
    r.sscdDefect = sscdDefect;

    const cholesteatomaMass = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 20, 16),
      createAnatomyMaterial({
        color: 0xfbbf24,
        emissive: 0xb45309,
        emissiveIntensity: 0.38,
        transparent: true,
        opacity: 0.85,
      })
    );
    cholesteatomaMass.scale.set(0.95, 1.15, 1.1);
    cholesteatomaMass.position.set(1.18, 0.25, 0.16);
    tagAnatomyMesh(cholesteatomaMass, {
      structureId: 'cholesteatoma',
      label: 'Prussak Space Cholesteatoma',
      description: 'Soft-tissue mass lateral to the malleus head causing scutum blunting and medial ossicular displacement.',
    });
    r.cholesteatomaMass = cholesteatomaMass;

    const schwannomaMass = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 22, 18),
      createAnatomyMaterial({
        color: 0xf87171,
        emissive: 0x991b1b,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.88,
      })
    );
    schwannomaMass.scale.set(1.45, 0.95, 0.95);
    schwannomaMass.position.set(-1.35, 0.04, -0.06);
    tagAnatomyMesh(schwannomaMass, {
      structureId: 'vestibular-schwannoma',
      label: 'Vestibular Schwannoma ("Ice Cream Cone")',
      description: 'Expands the IAC porus acusticus with lobulated cisternal extension into the cerebellopontine angle.',
    });
    r.schwannomaMass = schwannomaMass;

    const otosclerosisPlaque = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 14),
      createAnatomyMaterial({ color: 0xfb923c, emissive: 0xc2410c, emissiveIntensity: 0.6 })
    );
    otosclerosisPlaque.position.set(0.18, 0.02, 0.16);
    tagAnatomyMesh(otosclerosisPlaque, {
      structureId: 'otosclerosis-plaque',
      label: 'Fissula Ante Fenestram Otospongiosis',
      description: 'Radiolucent focus just anterior to the oval window ankylosing the stapes footplate.',
    });
    r.otosclerosisPlaque = otosclerosisPlaque;

    const mondiniApex = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 18, 16),
      createAnatomyMaterial({ color: 0x60a5fa, emissive: 0x1d4ed8, emissiveIntensity: 0.55 })
    );
    mondiniApex.position.set(0.28, -0.05, 0.65);
    tagAnatomyMesh(mondiniApex, {
      structureId: 'mondini-apex',
      label: 'Cystic Coalescent Cochlear Apex (IP-II)',
      description: 'Middle and apical turns coalesce into a single cystic cavity (1.5 turns) + enlarged vestibular aqueduct.',
    });
    r.mondiniApex = mondiniApex;

    const slicePlane = createSlicePlaneMesh(3.0, 2.2, 0xd4a853);
    r.slicePlane = slicePlane;

    rootGroup.add(
      sscdDefect,
      cholesteatomaMass,
      schwannomaMass,
      otosclerosisPlaque,
      mondiniApex,
      slicePlane
    );
  }, []);

  const updateTemporal3D = useCallback(() => {
    const r = refs.current;
    if (!r.rootGroup) return;
    r.rootGroup.scale.x = side === 'Left' ? -1 : 1;

    if (r.labyrinthGroup) r.labyrinthGroup.visible = showLabyrinth;
    if (r.ossiclesGroup) r.ossiclesGroup.visible = showOssicles;
    if (r.facialGroup) r.facialGroup.visible = showFacialNerve;
    if (r.iacGroup) r.iacGroup.visible = showIacNerves;

    if (r.sscdDefect) r.sscdDefect.visible = pathology === 'sscd';
    if (r.cholesteatomaMass) r.cholesteatomaMass.visible = pathology === 'cholesteatoma';
    if (r.schwannomaMass) r.schwannomaMass.visible = pathology === 'vestibular-schwannoma';
    if (r.otosclerosisPlaque) r.otosclerosisPlaque.visible = pathology === 'otosclerosis';
    if (r.mondiniApex) r.mondiniApex.visible = pathology === 'mondini';

    if (r.slicePlane) {
      r.slicePlane.visible = showSlicePlane;
      const norm = (sliceIndex - 12.5) / 11.5;
      if (plane === 'Axial HRCT') {
        r.slicePlane.rotation.set(Math.PI / 2, 0, 0);
        r.slicePlane.position.set(0, norm * 0.85, 0);
      } else if (plane === 'Coronal HRCT') {
        r.slicePlane.rotation.set(0, 0, 0);
        r.slicePlane.position.set(0, 0.1, norm * 0.85);
      } else if (plane === 'Pöschl Oblique') {
        r.slicePlane.rotation.set(0, Math.PI / 4, 0);
        r.slicePlane.position.set(-0.2 + norm * 0.45, 0.22, -0.1 + norm * 0.45);
      } else if (plane === 'Stenvers Oblique') {
        r.slicePlane.rotation.set(0, -Math.PI / 4, 0);
        r.slicePlane.position.set(norm * 0.45, 0.1, norm * 0.45);
      } else {
        r.slicePlane.rotation.set(0, Math.PI / 2, 0);
        r.slicePlane.position.set(-0.95 + norm * 0.35, 0.06, 0);
      }
    }
  }, [side, pathology, plane, sliceIndex, showLabyrinth, showOssicles, showFacialNerve, showIacNerves, showSlicePlane]);

  // 2D Synthetic Temporal Bone HRCT / CISS MRI Engine
  useEffect(() => {
    const canvas = pacsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const img = ctx.createImageData(W, H);
    const data = img.data;

    const isMri = plane === 'IAC CISS MRI';

    for (let py = 0; py < H; py++) {
      const ny = (py / H) * 2 - 1;
      for (let px = 0; px < W; px++) {
        const nx = (px / W) * 2 - 1;
        let hu = isMri ? 120 : -920; // Air vs low MRI background

        if (plane === 'Pöschl Oblique') {
          // Petrous temporal bone block with arcuate eminence at top
          const inPetrous = ny > -0.42 + nx * 0.18 && ny < 0.58 && Math.abs(nx) < 0.88;
          if (inPetrous) {
            hu = 1650; // Dense otic capsule cortical bone
            // Organic trabeculated mastoid air cells posteriorly (nx < -0.32)
            if (nx < -0.3) {
              const cell =
                Math.sin(nx * 29 + Math.cos(ny * 23) * 1.4) *
                Math.cos(ny * 27 + Math.sin(nx * 19) * 1.2);
              if (cell > 0.06) hu = -780;
            }
            // Superior Semicircular Canal FULL RING in Pöschl view!
            const ringR = Math.hypot(nx - 0.05, ny + 0.12);
            if (ringR > 0.19 && ringR < 0.28 && ny < 0.08) {
              hu = 45; // Membranous fluid lumen
            }
            // SSCD: roof bone missing right over apex of SSC!
            if (pathology === 'sscd' && Math.abs(nx - 0.05) < 0.1 && ny < -0.34) {
              hu = 40; // CSF directly touches SSC lumen!
            }
            // Vestibule below ring
            if (Math.hypot(nx - 0.05, ny - 0.14) < 0.11) {
              hu = 45;
            }
          } else if (ny <= -0.42 + nx * 0.18) {
            hu = 35; // Middle cranial fossa CSF/temporal lobe
          }
        } else if (plane === 'Axial HRCT') {
          const inPetrous = ny > -0.52 && ny < 0.52 && Math.abs(nx) < 0.86;
          if (inPetrous) {
            hu = 1580;
            // External auditory canal + tympanic cavity (lateral +X)
            if (nx > 0.22 && nx < 0.68 && Math.abs(ny) < 0.34) {
              hu = -920;
              if (pathology === 'cholesteatoma' && nx > 0.32 && nx < 0.56 && Math.abs(ny) < 0.22) {
                hu = 48;
              }
              // "Ice cream cone" Malleus head + Incus body
              if (Math.hypot(nx - 0.38, ny + 0.1) < 0.075) hu = 1850;
              if (Math.hypot(nx - 0.42, ny - 0.06) < 0.068 && ny > -0.04) hu = 1850;
            }
            // Cochlea 2.5 turns anteriorly
            if (Math.hypot(nx + 0.08, ny + 0.14) < 0.16) {
              hu = Math.hypot(nx + 0.08, ny + 0.14) < 0.05 ? 1650 : 45;
            }
            // Otosclerosis fissula plaque anterior to oval window
            if (pathology === 'otosclerosis' && Math.hypot(nx - 0.12, ny + 0.05) < 0.06) {
              hu = 220;
            }
            // IAC canal (medial -X)
            if (nx < -0.15 && nx > -0.68 && Math.abs(ny - 0.08) < 0.11) {
              hu = 30;
            }
          } else {
            hu = 35;
          }
        } else if (plane === 'Coronal HRCT') {
          if (ny > -0.35 && ny < 0.55 && Math.abs(nx) < 0.85) {
            hu = 1580;
            // EAC + Epitympanum + Scutum spur
            if (nx > 0.14 && nx < 0.78 && Math.abs(ny - 0.05) < 0.28) {
              hu = -900;
              // Scutum sharp bony spur (blunted in cholesteatoma!)
              if (nx > 0.2 && nx < 0.38 && ny > -0.25 && ny < -0.05) {
                hu = pathology === 'cholesteatoma' ? 50 : 1750;
              }
              if (pathology === 'cholesteatoma' && Math.hypot(nx - 0.34, ny + 0.06) < 0.16) {
                hu = 52;
              }
              // Ossicles in attic
              if (Math.hypot(nx - 0.28, ny + 0.02) < 0.07) hu = 1850;
            }
            // Cochlea basal/middle turns
            if (Math.hypot(nx + 0.15, ny - 0.05) < 0.16) hu = 45;
          } else {
            hu = 35;
          }
        } else if (plane === 'Stenvers Oblique') {
          if (Math.abs(ny) < 0.5 && Math.abs(nx) < 0.82) {
            hu = 1580;
            // Cochlea turns in long axis
            const cR = Math.hypot(nx - 0.1, ny);
            if (cR < 0.24) {
              hu = cR > 0.12 && pathology === 'mondini' ? 45 : cR % 0.09 < 0.045 ? 45 : 1580;
            }
            // Vestibule + Posterior SSC
            if (Math.hypot(nx + 0.26, ny) < 0.15) hu = 45;
          } else {
            hu = 35;
          }
        } else {
          // IAC Sagittal Oblique CISS MRI ("7-Up, Coke-Down")
          hu = 140;
          const iacR = Math.hypot(nx, ny);
          if (iacR < 0.42) {
            hu = 860; // Bright CSF inside IAC!
            if (pathology === 'vestibular-schwannoma') {
              // Mass filling posterior/central IAC
              if (Math.hypot(nx - 0.08, ny + 0.02) < 0.3) {
                hu = 230;
              }
            } else {
              // 4 distinct dark nerve dots:
              // CN VII (Ant-Sup "7-Up"): nx < 0, ny < 0
              if (Math.hypot(nx + 0.15, ny + 0.14) < 0.065) hu = 110;
              // Cochlear (Ant-Inf "Coke-Down"): nx < 0, ny > 0
              if (Math.hypot(nx + 0.15, ny - 0.14) < 0.065) hu = 110;
              // Sup Vestibular (Post-Sup): nx > 0, ny < 0
              if (Math.hypot(nx - 0.15, ny + 0.13) < 0.06) hu = 110;
              // Inf Vestibular (Post-Inf): nx > 0, ny > 0
              if (Math.hypot(nx - 0.15, ny - 0.13) < 0.06) hu = 110;
            }
          }
        }

        const noisy = hu + fastPixelNoise(px, py, sliceIndex + 3) * (isMri ? 18 : 65);
        const gray = applyWindowLevel(noisy, wl);
        const idx = (py * W + px) * 4;
        data[idx] = gray;
        data[idx + 1] = gray;
        data[idx + 2] = gray;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);

    const markers =
      plane === 'IAC CISS MRI'
        ? { top: 'S (7-Up)', bottom: 'I (Coke-Down)', left: 'A', right: 'P' }
        : { top: 'S', bottom: 'I', left: 'Med', right: 'Lat' };

    drawPacsOrientationMarkers(ctx, W, H, markers);
    drawPacsScaleBar(ctx, W - 16, H / 2 - 40, 80, '10 mm');
    drawCrosshairs(ctx, W, H, crosshair.x, crosshair.y);
  }, [plane, pathology, sliceIndex, wl, crosshair]);

  return (
    <div className="workstation-body">
      <aside className="control-rail" aria-label="Temporal Bone Controls">
        <div className="rail-header">
          <h1 className="rail-title">Temporal Bone &amp; IAC</h1>
          <div className="rail-subtitle">Zero-Stall 3D Labyrinth + Pöschl / Stenvers / CISS</div>
        </div>

        <div className="panel-section">
          <div className="section-label">
            <span>Pathology &amp; Laterality</span>
            <span>{side} Ear</span>
          </div>
          <div className="chip-grid">
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
            {PATHOLOGY_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip-btn ${p.id !== 'normal' ? 'danger' : ''} ${pathology === p.id ? 'active' : ''}`}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setPathology(p.id)}
              >
                <span>{p.label}</span>
                <span className="module-tab-mod">{p.sign}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="section-label">Oblique Reformation Plane</div>
          <div className="chip-grid">
            {(['Axial HRCT', 'Coronal HRCT', 'Pöschl Oblique', 'Stenvers Oblique', 'IAC CISS MRI'] as const).map((pl) => (
              <button
                key={pl}
                type="button"
                className={`chip-btn ${plane === pl ? 'active' : ''}`}
                style={{ width: '100%' }}
                onClick={() => handlePlaneChange(pl)}
              >
                {pl}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="section-label">3D Anatomy Toggles</div>
          <div className="toggle-list">
            <label className="toggle-row">
              <span>Membranous Labyrinth</span>
              <input type="checkbox" checked={showLabyrinth} onChange={(e) => setShowLabyrinth(e.target.checked)} />
            </label>
            <label className="toggle-row">
              <span>Ossicular Chain (M/I/S)</span>
              <input type="checkbox" checked={showOssicles} onChange={(e) => setShowOssicles(e.target.checked)} />
            </label>
            <label className="toggle-row">
              <span>Facial Nerve (CN VII)</span>
              <input type="checkbox" checked={showFacialNerve} onChange={(e) => setShowFacialNerve(e.target.checked)} />
            </label>
            <label className="toggle-row">
              <span>IAC &amp; CN VIII Bundles</span>
              <input type="checkbox" checked={showIacNerves} onChange={(e) => setShowIacNerves(e.target.checked)} />
            </label>
            <label className="toggle-row">
              <span>Show Reformatted Plane</span>
              <input type="checkbox" checked={showSlicePlane} onChange={(e) => setShowSlicePlane(e.target.checked)} />
            </label>
          </div>
        </div>
      </aside>

      <main className="stage-area">
        <ThreeViewport
          title={`${side} Inner Ear & Ossicles 3D`}
          badge="INSTANT 3D"
          cameraPresets={CAMERA_PRESETS}
          initialCamera={[2.4, 1.8, 3.4]}
          onBuildScene={(ctx) => {
            buildTemporal3D(ctx);
            updateTemporal3D();
          }}
          onUpdateScene={updateTemporal3D}
          deps={[updateTemporal3D]}
          onCanvasExpose={(canvas) => {
            threeCanvasRef.current = canvas;
          }}
        />

        <section className="viewport-card" aria-label="Temporal Bone HRCT and IAC CISS Viewer">
          <div className="viewport-header">
            <div className="vp-title-group">
              <span className="vp-badge">{plane === 'IAC CISS MRI' ? '3D CISS' : '0.5mm HRCT'}</span>
              <span className="vp-title">{plane}</span>
            </div>
            <div className="vp-toolbar">
              <button
                type="button"
                className="vp-mini-btn"
                onClick={() => setWl({ width: 4000, level: 700 })}
              >
                Bone W/L
              </button>
              <button
                type="button"
                className="vp-mini-btn"
                onClick={() => setWl({ width: 900, level: 450 })}
              >
                CISS W/L
              </button>
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
                  width: Math.max(200, Math.min(5500, dragWlRef.current.baseW + dx * 8)),
                  level: Math.max(-500, Math.min(2000, dragWlRef.current.baseL + dy * 4)),
                });
              }}
              onPointerUp={() => {
                dragWlRef.current.active = false;
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <canvas ref={pacsCanvasRef} width={380} height={380} className="pacs-canvas" />
              <div className="pacs-overlay-tl">
                <div>{plane === 'IAC CISS MRI' ? '3T CISS FIESTA' : 'UHR TEMPORAL CT'}</div>
                <div>{plane.toUpperCase()}</div>
              </div>
              <div className="pacs-overlay-tr">
                <div>{side.toUpperCase()} EAR</div>
                <div>SL: {sliceIndex}/24</div>
              </div>
              <div className="pacs-overlay-bl">
                <div>W: {Math.round(wl.width)} / L: {Math.round(wl.level)}</div>
              </div>
              <div className="pacs-overlay-br">
                <div>0.5 mm ISO</div>
              </div>
            </div>

            <div className="pacs-substrip">
              <div className="slider-field">
                <div className="slider-meta">
                  <span>Plane Offset</span>
                  <span className="slider-val">Slice {sliceIndex}/24</span>
                </div>
                <input
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
