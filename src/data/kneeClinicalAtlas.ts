import type {
  FellowshipReport,
  KneeModule,
  KneeModuleId,
  MriContrastPreset,
  ResidentQuizQuestion,
  StructureClinicalInfo,
  StructureId,
} from '../types/atlas';

export const MRI_CONTRAST_PRESETS: Array<{
  id: MriContrastPreset;
  label: string;
  shortLabel: string;
  spec: string;
  defaultMin: number;
  defaultMax: number;
}> = [
  {
    id: 'qdess-clinical',
    label: 'Standard 3T qDESS',
    shortLabel: 'Standard',
    spec: '3D qDESS · 0.31 × 0.31 × 1.0 mm',
    defaultMin: 22,
    defaultMax: 230,
  },
  {
    id: 'meniscus-cruciate',
    label: 'Meniscus & Cruciate Window',
    shortLabel: 'Meniscus / ACL',
    spec: 'High-Contrast Fibrocartilage',
    defaultMin: 20,
    defaultMax: 188,
  },
  {
    id: 'chondral',
    label: 'Articular Chondral Window',
    shortLabel: 'Cartilage',
    spec: 'Extended Hyaline Gradient',
    defaultMin: 28,
    defaultMax: 242,
  },
  {
    id: 'trabecular',
    label: 'Marrow & Cortex Window',
    shortLabel: 'Bone Marrow',
    spec: 'Subchondral & Bone Detail',
    defaultMin: 14,
    defaultMax: 168,
  },
];

export const STRUCTURES_INFO: Record<StructureId, StructureClinicalInfo> = {
  Femur: {
    id: 'Femur',
    labelIndex: 1,
    name: 'Distal Femur & Condyles (Right)',
    shortLabel: 'Femur',
    group: 'bone',
    mriSignal: 'Dark cortical rim bounding water-suppressed marrow trabeculae on 3T qDESS.',
    clinicalPearl:
      'Lateral condylopatellar sulcus depression > 1.5–2.0 mm ("deep sulcus sign") strongly favors ACL tear.',
    attachmentSummary: 'Posteromedial lateral condyle (ACL); anterolateral medial condyle (PCL).',
  },
  Tibia: {
    id: 'Tibia',
    labelIndex: 2,
    name: 'Proximal Tibia & Plateau (Right)',
    shortLabel: 'Tibia',
    group: 'bone',
    mriSignal: 'Concave medial plateau vs convex lateral plateau with steeper posterior slope.',
    clinicalPearl:
      'Posterolateral tibial plateau marrow bruise paired with lateral condylar bruising = ACL pivot-shift injury.',
    attachmentSummary: 'Intercondylar eminence anchors ACL anteriorly and PCL posteriorly.',
  },
  Fibula: {
    id: 'Fibula',
    labelIndex: 3,
    name: 'Proximal Fibula & Styloid',
    shortLabel: 'Fibula',
    group: 'bone',
    mriSignal: 'Posterolateral osseous pillar for LCL, biceps femoris, and arcuate ligament.',
    clinicalPearl:
      'Fibular styloid avulsion ("arcuate sign") signals Posterolateral Corner (PLC) disruption.',
    attachmentSummary: 'Conjoint insertion of LCL and biceps femoris on lateral fibular head.',
  },
  Patella: {
    id: 'Patella',
    labelIndex: 4,
    name: 'Patella',
    shortLabel: 'Patella',
    group: 'bone',
    mriSignal: 'Wider flatter lateral facet vs steeper medial facet (Wiberg type II).',
    clinicalPearl:
      'Medial patellar + anterolateral femoral condyle kissing bruises confirm transient lateral patellar dislocation.',
    attachmentSummary: 'Quad tendon superiorly; patellar tendon inferiorly; MPFL medially.',
  },
  FemoralCartilage: {
    id: 'FemoralCartilage',
    labelIndex: 5,
    name: 'Femoral Articular Cartilage',
    shortLabel: 'Fem. Cartilage',
    group: 'cartilage',
    mriSignal: 'Smooth bright hyaline ribbon along trochlea and weight-bearing condyles (1.7–2.3 mm).',
    clinicalPearl: 'Confirm chondral fissures in at least two orthogonal planes (Outerbridge / ICRS).',
    attachmentSummary: 'Lines femoral trochlear groove and distal/posterior condyles.',
  },
  MedialTibialCartilage: {
    id: 'MedialTibialCartilage',
    labelIndex: 6,
    name: 'Medial Tibial Cartilage',
    shortLabel: 'Med. Tib. Cart.',
    group: 'cartilage',
    mriSignal: 'Bright smooth articular layer (OpenMSK mean 1.95 mm) over concave medial plateau.',
    clinicalPearl: 'Posterior root tears rapidly overload medial tibial cartilage via > 3 mm extrusion.',
    attachmentSummary: 'Covers weight-bearing medial plateau under medial meniscus.',
  },
  LateralTibialCartilage: {
    id: 'LateralTibialCartilage',
    labelIndex: 7,
    name: 'Lateral Tibial Cartilage',
    shortLabel: 'Lat. Tib. Cart.',
    group: 'cartilage',
    mriSignal: 'Slightly thicker central dome (OpenMSK mean 2.20 mm) over convex lateral plateau.',
    clinicalPearl: 'Check exposed cartilage margins for acute impaction after pivot-shift injury.',
    attachmentSummary: 'Covers lateral plateau beneath O-shaped lateral meniscus.',
  },
  PatellarCartilage: {
    id: 'PatellarCartilage',
    labelIndex: 8,
    name: 'Retropatellar Cartilage',
    shortLabel: 'Pat. Cartilage',
    group: 'cartilage',
    mriSignal: 'Thickest cartilage in the human body (OpenMSK mean 2.40 mm, peak 3.7 mm at ridge).',
    clinicalPearl: 'Chondromalacia patellae starts most often at the median ridge and odd facet.',
    attachmentSummary: 'Articulates with femoral trochlea across 0°–90° knee flexion.',
  },
  MedialMeniscus: {
    id: 'MedialMeniscus',
    labelIndex: 9,
    name: 'Medial Meniscus (C-Shaped)',
    shortLabel: 'Med. Meniscus',
    group: 'meniscus',
    mriSignal: 'Dark fibrocartilage; posterior horn is ALWAYS roughly 2× larger than anterior horn.',
    clinicalPearl:
      'Diagnose a tear only when high signal clearly reaches the superior or inferior articular surface on >= 2 slices.',
    attachmentSummary: 'Tethered tightly to deep MCL; posterior root inserts just anterior to PCL.',
  },
  LateralMeniscus: {
    id: 'LateralMeniscus',
    labelIndex: 10,
    name: 'Lateral Meniscus (O-Shaped)',
    shortLabel: 'Lat. Meniscus',
    group: 'meniscus',
    mriSignal: 'Symmetric anterior and posterior horns ("bow-tie" on 2–3 consecutive sagittal slices).',
    clinicalPearl:
      'Normal popliteal hiatus and meniscofemoral ligaments mimic tears on posterior horn — check two slices!',
    attachmentSummary: 'Circular C/O-ring separated from LCL posteriorly by popliteus tendon.',
  },
  ACL: {
    id: 'ACL',
    labelIndex: 11,
    name: 'Anterior Cruciate Ligament (ACL)',
    shortLabel: 'ACL',
    group: 'cruciate',
    mriSignal: 'Taut striated band parallel to Blumensaat intercondylar roof (evaluate best on T2/qDESS).',
    clinicalPearl:
      'Pitfall: normal ACL is slightly gray/striated distally on PD due to interleaved fat & synovium — verify discontinuity on fluid-sensitive slices!',
    attachmentSummary: 'Posteromedial lateral femoral condyle -> anteromedial tibial spine.',
  },
  PCL: {
    id: 'PCL',
    labelIndex: 12,
    name: 'Posterior Cruciate Ligament (PCL)',
    shortLabel: 'PCL',
    group: 'cruciate',
    mriSignal: 'Thick (3–4 mm), uniformly black curved arc across virtually all pulse sequences.',
    clinicalPearl:
      'An extra dark ribbon running anteroinferior and parallel to the PCL = classic Double PCL bucket-handle tear!',
    attachmentSummary: 'Anterolateral medial femoral condyle -> posterior intercondylar tibial fossa.',
  },
  MCL: {
    id: 'MCL',
    labelIndex: 13,
    name: 'Medial Collateral Ligament (MCL)',
    shortLabel: 'MCL',
    group: 'collateral',
    mriSignal: 'Thin taut dark band on coronal slices from medial epicondyle to proximal medial tibia.',
    clinicalPearl:
      'Use the coronal slice at the MCL body as your landmark to measure medial meniscal extrusion (> 3 mm = root tear risk).',
    attachmentSummary: 'Medial femoral epicondyle -> proximal medial tibia (~5 cm below joint line).',
  },
  LCL: {
    id: 'LCL',
    labelIndex: 14,
    name: 'Lateral (Fibular) Collateral Ligament',
    shortLabel: 'LCL',
    group: 'collateral',
    mriSignal: 'Cord-like taut dark structure running posteriorly to join biceps femoris on fibular head.',
    clinicalPearl: 'Never report an isolated PCL or ACL tear without checking LCL + popliteus (PLC).',
    attachmentSummary: 'Lateral femoral epicondyle -> lateral aspect of fibular head.',
  },
  PatellarTendon: {
    id: 'PatellarTendon',
    labelIndex: 15,
    name: 'Patellar Tendon (Ligament)',
    shortLabel: 'Pat. Tendon',
    group: 'extensor',
    mriSignal: 'Uniformly low-signal flat anterior band (3–5 mm thick; Insall-Salvati 0.8–1.2).',
    clinicalPearl: 'Jumper knee causes focal thickening + bright fluid signal right at the proximal inferior patellar pole.',
    attachmentSummary: 'Inferior pole of patella -> anterior tibial tubercle.',
  },
  QuadricepsTendon: {
    id: 'QuadricepsTendon',
    labelIndex: 16,
    name: 'Quadriceps Tendon',
    shortLabel: 'Quad Tendon',
    group: 'extensor',
    mriSignal: 'Trilaminar layered tendon (rectus femoris + vastus intermedius/medialis/lateralis).',
    clinicalPearl: 'Don’t mistake normal bright fat stripes between layers for tendinopathy.',
    attachmentSummary: 'Quadriceps musculature -> superior pole of patella.',
  },
};

export const KNEE_MODULES: KneeModule[] = [
  // ============================================================================
  // TRACK 0: NORMAL 3D & 3T MRI KNEE ANATOMY FOUNDATIONS
  // ============================================================================
  {
    id: 'normal-overview',
    order: 1,
    category: 'normal',
    title: '1. Normal Whole Joint & Compartments',
    shortTitle: '1. Whole Joint & Bones',
    tag: 'Normal Anatomy',
    diagnosticSign: 'Medial · Lateral · Patellofemoral Compartments',
    summary:
      'Start by orienting the three functional compartments of the intact right knee in full 3D context paired with fat-suppressed 3.0T qDESS MRI.',
    subSteps: [
      {
        id: 'norm-compartments',
        label: 'Three Compartments',
        focusStructure: 'Femur',
        targetBadge: 'Intact Right Knee',
        viewMode3D: 'solid',
        cameraPreset: 'anterior',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.15,
        flexionDeg: 6,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [112.6, 56.0, 24.0],
            toRas: [112.6, 46.0, 22.0],
            tone: 'cyan',
            label: 'Patellofemoral',
          },
          {
            kind: 'arrow',
            fromRas: [112.6, 20.0, 2.0],
            toRas: [112.6, 20.0, -14.0],
            tone: 'emerald',
            label: 'Tibiofemoral Joint',
          },
        ],
        whatToLookFor:
          'Rotate around the complete right knee: distal femur, tibial plateau, posterolateral fibular head, and anterior patella cushioned by white hyaline cartilage.',
        diagnosticRules: [
          'Medial compartment bears ~60% of axial load over a flatter concave tibial plateau.',
          'Lateral tibial plateau is convex posterolaterally, granting greater rotational rollback.',
        ],
        pitfallAndHook:
          'Baseline Rule: Normal qDESS MRI suppresses fatty bone marrow cleanly dark so smooth hyaline cartilage and synovial fluid gleam white.',
      },
      {
        id: 'norm-cartilage',
        label: 'Normal Hyaline Envelope',
        focusStructure: 'FemoralCartilage',
        targetBadge: 'Smooth Hyaline Cartilage (1.7–2.5 mm)',
        viewMode3D: 'cartilage-map',
        cameraPreset: 'anterior',
        cameraDistanceScale: 1.04,
        mriPlane: 'sagittal',
        mriContrast: 'chondral',
        mriZoom: 1.25,
        flexionDeg: 28,
        whatToLookFor:
          'Switch to Cartilage Map to inspect normal per-vertex cartilage thickness across the femoral trochlea and weight-bearing condyles (cool teal/blue = thick healthy tissue).',
        diagnosticRules: [
          'Healthy OpenMSK reference means: Patellar 2.40 mm, Anterior Femoral 2.25 mm, Med Tibial 1.95 mm.',
          'Normal cartilage maintains crisp smooth articular margins and uniform intermediate-to-bright trilaminar gradient.',
        ],
        pitfallAndHook:
          'Normal Variant: Mild subchondral cortical concavity at the distal lateral femoral sulcus terminalis should not be mistaken for a fracture if < 1.5 mm.',
      },
      {
        id: 'norm-kinematics',
        label: 'Screw-Home Flexion',
        focusStructure: 'Tibia',
        targetBadge: 'Physiological Rollback & Screw-Home',
        viewMode3D: 'solid',
        cameraPreset: 'lateral',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.15,
        flexionDeg: 38,
        whatToLookFor:
          'Scrub the Flexion slider in the right guide: notice the tibia rotates smoothly out of terminal extension lock while the patella tracks down into the trochlear groove.',
        diagnosticRules: [
          'Terminal extension locks the tibia externally relative to femur via ACL/condylar geometry ("screw-home").',
          'Deep flexion glides both menisci ~3–4 mm posteriorly to stay centered under the femoral condyles.',
        ],
        pitfallAndHook:
          'Clinical Hook: Healthy flexion never produces > 1.5 mm anterior or posterior drawer step-off.',
      },
    ],
    mriChecklist: [
      'Symmetric dark bone marrow without focal subchondral edema.',
      'Smooth uninterrupted white hyaline cartilage envelope.',
      'No large joint effusion or loose bodies.',
    ],
    boardPearls: [
      {
        exam: 'Normal OpenMSK Metrics',
        pearl: 'Patellar median ridge hosts the thickest hyaline cartilage in the body (up to 3.7 mm peak, 2.40 mm mean).',
      },
    ],
  },
  {
    id: 'normal-menisci',
    order: 2,
    category: 'normal',
    title: '2. Normal Menisci & Plateau',
    shortTitle: '2. Normal Menisci',
    tag: 'Normal Anatomy',
    diagnosticSign: 'Medial C-Ring (PH > AH) · Lateral O-Ring',
    summary:
      'Top-down plateau anatomy comparing the wide C-shaped medial meniscus against the tighter circular O-shaped lateral meniscus.',
    subSteps: [
      {
        id: 'norm-plateau-top',
        label: 'Medial C vs Lateral O',
        focusStructure: 'MedialMeniscus',
        targetBadge: 'Medial C-Shape & Lateral O-Shape',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.05,
        mriPlane: 'coronal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.3,
        flexionDeg: 4,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [74.0, 21.0, -9.0],
            toRas: [82.0, 21.0, -16.5],
            tone: 'cyan',
            label: 'Medial Body (Sharp Inner Edge)',
          },
          {
            kind: 'arrow',
            fromRas: [145.0, 16.0, -6.0],
            toRas: [137.0, 16.0, -12.5],
            tone: 'emerald',
            label: 'Lateral Meniscus',
          },
        ],
        whatToLookFor:
          'Compare both fibrocartilage rings on top of the tibial plateau: Medial is a wider open C covering ~50% of the medial plateau; Lateral forms a compact O-ring covering ~70%.',
        diagnosticRules: [
          'Medial meniscus capsular attachment is tightly anchored to the deep MCL — making it less mobile and more prone to injury.',
          'Sharp black triangles on Coronal MRI align neatly flush with the tibial margin without > 3 mm protrusion.',
        ],
        pitfallAndHook:
          'Quick Rule: Think "C = Medial (Open), O = Lateral (Almost closed ring)".',
      },
      {
        id: 'norm-roots',
        label: 'Anterior & Posterior Roots',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [100.5, 9.0, -18.0],
        targetBadge: 'Medial Posterior Root Anchor',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.4,
        flexionDeg: 4,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [100.5, 16.0, -9.0],
            toRas: [100.5, 9.2, -17.5],
            tone: 'emerald',
            label: 'Intact Dark Root Anchor',
          },
        ],
        whatToLookFor:
          'Follow the posterior horn medially until it inserts firmly onto bone just anteromedial to the PCL footprint — the root converts axial weight into hoop stress.',
        diagnosticRules: [
          'Meniscal root ligaments anchor collagen hoop fibers directly onto the central tibial eminence.',
          'Trace dark fibrous continuity right up to bone on sequential sagittal and coronal slices.',
        ],
        pitfallAndHook:
          'Key Pearl: Never mistake normal transverse intermeniscal ligament crossing anteriorly for an anterior horn tear.',
      },
      {
        id: 'norm-horns',
        label: 'Normal Horns & Bow-Ties',
        focusStructure: 'LateralMeniscus',
        targetRasOverride: [137.2, 14.2, -11.6],
        targetBadge: 'Symmetric Lateral Bow-Tie',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.4,
        flexionDeg: 4,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [137.2, 24.0, -4.0],
            toRas: [137.2, 24.0, -10.5],
            tone: 'cyan',
            label: 'Lateral Anterior ≈ Posterior Horn',
          },
        ],
        whatToLookFor:
          'Observe symmetric Anterior and Posterior horns on Sagittal Lateral cuts, whereas on the Medial side the Posterior Horn is roughly twice the height/size of the Anterior Horn.',
        diagnosticRules: [
          'Peripheral slices through either meniscal body form 2 consecutive dark "bow-ties".',
          'Both horns remain uniformly jet-black on low-TE/PD windows.',
        ],
        pitfallAndHook:
          'Memory Hook: "Big Back (Medial PH > AH); Equal Twins (Lateral PH = AH)."',
      },
    ],
    mriChecklist: [
      'Medial C-shape PH > AH and >= 2 body bow-ties.',
      'Intact tibial root footprints without extrusion > 3 mm.',
      'Uniform black fibrocartilage triangles without surface clefts.',
    ],
    boardPearls: [
      {
        exam: 'Vascularity Zones',
        pearl: 'Only the outer 10–30% ("red-red zone") receives capillary blood supply; inner free margins ("white-white zone") are avascular.',
      },
    ],
  },
  {
    id: 'normal-cruciates',
    order: 3,
    category: 'normal',
    title: '3. Normal ACL, PCL & Notch',
    shortTitle: '3. Normal Cruciates',
    tag: 'Normal Anatomy',
    diagnosticSign: 'Blumensaat Parallel ACL · Uniform Black PCL',
    summary:
      'Inspect the central intercondylar stabilizers in translucent X-ray Joint view paired with sagittal notch MRI.',
    subSteps: [
      {
        id: 'norm-acl',
        label: 'Anterior Cruciate (ACL)',
        focusStructure: 'ACL',
        targetBadge: 'Intact ACL Bundles',
        viewMode3D: 'joint-interior',
        cameraPreset: 'notch',
        cameraDistanceScale: 1.04,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.35,
        flexionDeg: 6,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [112.5, 21.0, 9.5],
              [112.5, 32.0, -12.0],
            ],
            tone: 'cyan',
            dashed: true,
            widthPx: 1.6,
            label: 'Blumensaat Roof Slope',
          },
          {
            kind: 'arrow',
            fromRas: [112.5, 38.0, 4.0],
            toRas: [112.5, 27.5, -1.5],
            tone: 'emerald',
            label: 'Intact Striated ACL',
          },
        ],
        whatToLookFor:
          'Inside the translucent notch, see the oblique ACL sweeping anteriorly from the inner wall of the lateral femoral condyle to the anterior tibial plateau.',
        diagnosticRules: [
          'Comprises Anteromedial (tight in flexion) and Posterolateral (tight in extension) bundles.',
          'Distal tibial insertion naturally shows fine parallel bright fat striations — completely normal!',
        ],
        pitfallAndHook:
          'Alignment Law: Normal ACL runs parallel to or steeper than the dashed Blumensaat intercondylar roof line.',
      },
      {
        id: 'norm-pcl',
        label: 'Posterior Cruciate (PCL)',
        focusStructure: 'PCL',
        targetBadge: 'Intact Uniform Black PCL',
        viewMode3D: 'joint-interior',
        cameraPreset: 'posterior',
        cameraDistanceScale: 1.04,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.35,
        flexionDeg: 10,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [113.8, 26.5, -1.5],
              [113.8, 17.0, -9.5],
              [113.8, 11.0, -20.5],
            ],
            tone: 'emerald',
            dashed: true,
            widthPx: 2.0,
            label: 'Smooth Dark PCL Arc',
          },
        ],
        whatToLookFor:
          'Behind the ACL sits the thicker (3–4 mm) crescentic PCL coursing from the lateral aspect of the medial femoral condyle down to the posterior tibial facet.',
        diagnosticRules: [
          'Twice as strong as ACL and uniformly low signal across virtually all pulse sequences.',
          'Gentle superior convexity is normal in near-full extension; sharp focal kinking raises ACL concern.',
        ],
        pitfallAndHook:
          'Notch Rule: Only ACL + PCL traverse the central notch.',
      },
      {
        id: 'norm-notch-roof',
        label: 'Intercondylar Footprint Pair',
        focusStructure: 'ACL',
        targetRasOverride: [112.6, 23.0, -4.0],
        targetBadge: 'ACL Lateral · PCL Medial Wall',
        viewMode3D: 'joint-interior',
        cameraPreset: 'anterior',
        cameraDistanceScale: 1.05,
        mriPlane: 'axial',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.35,
        flexionDeg: 6,
        whatToLookFor:
          'Verify origin walls on Axial notch cuts: ACL hugs the high posteromedial wall of the LATERAL condyle while PCL anchors forward on the MEDIAL condyle.',
        diagnosticRules: [
          'Both cruciates are intra-articular yet extrasynovial (wrapped in synovium).',
          'Check femoral insertions on axial planes whenever oblique sagittal views are equivocal.',
        ],
        pitfallAndHook:
          'Mnemonic: "ACL = LaterAL wall; PCL = MediAL wall (closest to posterior-medial PCL)."',
      },
    ],
    mriChecklist: [
      'ACL continuous and parallel to Blumensaat roof line.',
      'PCL <= 5 mm AP thickness and uniformly black.',
      'Clean intercondylar synovial fat without third notch ribbon.',
    ],
    boardPearls: [
      {
        exam: 'AM vs PL ACL Bundles',
        pearl: 'Anteromedial bundle controls anterior translation in flexion; Posterolateral bundle stabilizes rotatory pivot near full extension.',
      },
    ],
  },
  {
    id: 'normal-collaterals-extensor',
    order: 4,
    category: 'normal',
    title: '4. Normal Collaterals & Extensor',
    shortTitle: '4. Collaterals & Extensor',
    tag: 'Normal Anatomy',
    diagnosticSign: 'MCL · LCL/PLC · Quadriceps & Patellar Tendon',
    summary:
      'Complete normal knee anatomy by tracing medial/lateral stabilizing straps alongside the anterior extensor mechanism.',
    subSteps: [
      {
        id: 'norm-mcl',
        label: 'Medial Collateral (MCL)',
        focusStructure: 'MCL',
        targetRasOverride: [68.3, 15.2, -16.4],
        targetBadge: 'Intact Superficial & Deep MCL',
        viewMode3D: 'solid',
        cameraPreset: 'medial',
        cameraDistanceScale: 1.06,
        mriPlane: 'coronal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.3,
        flexionDeg: 4,
        whatToLookFor:
          'Trace the sleek dark ribbon sweeping cleanly from medial femoral epicondyle down ~5 cm below the medial joint line without surrounding bright fluid.',
        diagnosticRules: [
          'Deep MCL meniscofemoral/meniscotibial fibers fuse directly into the medial meniscus periphery.',
          'Uniform thin low-signal ribbon taut against the cortex.',
        ],
        pitfallAndHook:
          'Anatomical Note: Deep MCL attachment explains why medial meniscus moves far less than lateral meniscus.',
      },
      {
        id: 'norm-lcl',
        label: 'Lateral Collateral & Fibula',
        focusStructure: 'LCL',
        targetRasOverride: [156.0, 7.0, -24.0],
        targetBadge: 'Intact LCL onto Fibular Head',
        viewMode3D: 'solid',
        cameraPreset: 'lateral',
        cameraDistanceScale: 1.06,
        mriPlane: 'coronal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.3,
        flexionDeg: 4,
        whatToLookFor:
          'Rotate laterally: the cord-like LCL runs posteroinferiorly from lateral femoral epicondyle to unite with biceps femoris on the lateral fibular head.',
        diagnosticRules: [
          'LCL sits extracapsular and completely separate from the lateral meniscus.',
          'Posterolateral Corner (PLC) combines LCL, popliteus tendon, and popliteofibular ligament.',
        ],
        pitfallAndHook:
          'Coronal Check: Unlike the flat broad MCL, the normal LCL is a crisp round taut cord.',
      },
      {
        id: 'norm-extensor',
        label: 'Patella & Extensor Mechanism',
        focusStructure: 'PatellarTendon',
        targetBadge: 'Trilaminar Quad · Patella · Tendon',
        viewMode3D: 'solid',
        cameraPreset: 'anterior',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.18,
        flexionDeg: 6,
        mriAnnotations: [
          {
            kind: 'caliper',
            aRas: [123.0, 71.0, 2.0],
            bRas: [123.0, 73.0, -34.0],
            tone: 'emerald',
            label: 'Patellar Tendon Length (Insall-Salvati ~1.0)',
          },
        ],
        whatToLookFor:
          'Inspect anteriorly: trilaminar quadriceps tendon superiorly, centered patella riding smoothly inside the femoral trochlea, and dark patellar tendon attaching onto the tibial tubercle.',
        diagnosticRules: [
          'Normal Insall-Salvati ratio (patellar tendon length / patellar diagonal height) sits between 0.8 and 1.2.',
          'Both tendons stay thin (< 6–7 mm AP) and dark over fat-suppressed Hoffa pad.',
        ],
        pitfallAndHook:
          'Normal Variant: Fine bright fat planes separating the three layers of quadriceps tendon are normal trilaminar anatomy.',
      },
    ],
    mriChecklist: [
      'MCL taut without periligamentous edema; LCL continuous onto fibular head.',
      'Patella centered in trochlear groove (Insall-Salvati 0.8–1.2).',
      'Clean Hoffa infrapatellar fat pad and prepatellar soft tissues.',
    ],
    boardPearls: [
      {
        exam: 'Patella Alta',
        pearl: 'Insall-Salvati ratio > 1.3 defines patella alta — a major predisposing risk factor for lateral patellar dislocation.',
      },
    ],
  },

  // ============================================================================
  // TRACK 1: HOW TO APPROACH KNEE MRI (SYSTEMATIC PROTOCOL)
  // ============================================================================
  {
    id: 'approach-sequences',
    order: 5,
    category: 'approach',
    title: '1. Sequences & Golden Rules',
    shortTitle: '1. Sequences & Rules',
    tag: 'How to Read MRI',
    diagnosticSign: 'Two-Slice Articular Rule · T2 vs PD Pitfall',
    summary:
      'Start every knee MRI by orienting planes and applying two foundational reading-room rules that prevent 80% of resident false-positives.',
    subSteps: [
      {
        id: 'seq-fluid',
        label: 'Fat-Sat qDESS Orientation',
        focusStructure: 'ACL',
        targetBadge: 'Intercondylar Fluid & Cartilage',
        viewMode3D: 'joint-interior',
        cameraPreset: 'anterior',
        cameraDistanceScale: 1.04,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.25,
        flexionDeg: 4,
        whatToLookFor:
          'This 3D qDESS scan suppresses marrow fat (dark trabeculae) so hyaline cartilage and joint fluid glow crisp white while tendons and menisci remain dark.',
        diagnosticRules: [
          'Always verify anatomy across Sagittal -> Coronal -> Axial rather than stopping after seeing one finding.',
          'Water-suppressed sequences maximize contrast between bright cartilage/tears and black fibrocartilage/bone cortex.',
        ],
        pitfallAndHook:
          'Golden Rule: Use T2 / fluid-sensitive contrast for ligament tears & marrow bruises; use PD / intermediate window for meniscal surface tears.',
      },
      {
        id: 'seq-twoslice',
        label: 'Two-Slice Rule (Meniscus)',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [87.5, 9.5, -17.0],
        targetBadge: 'Posterior Horn Triangle',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.45,
        flexionDeg: 4,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [87.5, 16.0, -7.0],
            toRas: [87.5, 10.2, -16.8],
            tone: 'cyan',
            label: 'Check Superior & Inferior Surfaces',
          },
        ],
        whatToLookFor:
          'Examine the posterior horn of the medial meniscus: a sharp, dark triangle on sagittal MRI. Switch W/L to Meniscus/ACL to judge internal grey signal.',
        diagnosticRules: [
          'Diagnose a true tear ONLY if abnormal high signal clearly touches the superior or inferior articular surface on >= 2 consecutive slices.',
          'High signal confined inside the meniscus core (Grade 1/2 mucoid degeneration) is NOT a tear.',
        ],
        pitfallAndHook:
          'Retention Hook: "Doesn’t touch the surface = keep walking. Touches surface on 2 slices = call the tear!"',
      },
      {
        id: 'seq-pd-pitfall',
        label: 'PD Striation Pitfall (ACL)',
        focusStructure: 'ACL',
        targetBadge: 'Distal ACL Striations',
        viewMode3D: 'joint-interior',
        cameraPreset: 'notch',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.4,
        flexionDeg: 8,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [112.5, 21.0, 9.5],
              [112.5, 32.0, -12.0],
            ],
            tone: 'cyan',
            dashed: true,
            widthPx: 1.5,
            label: 'Normal Blumensaat Course',
          },
        ],
        whatToLookFor:
          'Notice the fine parallel striations along the ACL course in the notch. Normal ACL is intra-articular yet extrasynovial with 3–5 fiber bundles separated by fat/synovium.',
        diagnosticRules: [
          'Because of normal interleaved fat, the intact ACL looks slightly gray/striated distally on PD — never overcall a tear from intermediate signal alone.',
          'Confirm ACL integrity by uninterrupted fiber continuity parallel to Blumensaat’s intercondylar roof.',
        ],
        pitfallAndHook:
          'Board Trap: Calling distal ACL striations on PD a "partial tear" is the #1 resident false-positive in knee MRI.',
      },
    ],
    mriChecklist: [
      'Confirm fat suppression: marrow dark, articular cartilage bright.',
      'Apply the Two-Slice Articular Surface Rule before calling any meniscal tear.',
      'Check ACL continuity on fluid-sensitive slices rather than PD striations alone.',
    ],
    boardPearls: [
      {
        exam: 'Articular Surface Law',
        pearl: 'Intrasubstance high signal that stops short of the tibial or femoral meniscal surface on 2 consecutive slices is mucoid degeneration, not a surgical tear.',
      },
    ],
  },
  {
    id: 'approach-sag-menisci',
    order: 6,
    category: 'approach',
    title: '2. Sagittal: Menisci & Roots',
    shortTitle: '2. Sagittal Menisci',
    tag: 'How to Read MRI',
    diagnosticSign: 'Medial PH > AH · >= 2 Bow-Ties · Root Check',
    summary:
      'Scroll systematically from Medial to Lateral across sagittal slices: inspect medial C-ring, cross the notch at the root, then inspect lateral O-ring.',
    subSteps: [
      {
        id: 'sag-med',
        label: 'Medial Horn Rule (PH > AH)',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [87.5, 11.0, -17.0],
        targetBadge: 'Medial Post. Horn (2x Larger)',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.4,
        flexionDeg: 4,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [87.5, 11.0, -8.0],
            toRas: [87.5, 11.0, -16.0],
            tone: 'emerald',
            label: 'Larger PH',
          },
          {
            kind: 'arrow',
            fromRas: [87.5, 38.0, -8.0],
            toRas: [87.5, 38.0, -15.5],
            tone: 'cyan',
            label: 'Smaller AH',
          },
        ],
        whatToLookFor:
          'Check the medial meniscus first: compare the larger Posterior Horn on the right of the sagittal slice against the smaller Anterior Horn on the left.',
        diagnosticRules: [
          'Medial Posterior Horn MUST be roughly 2× larger than Anterior Horn. If PH looks smaller or equal to AH, suspect a tear or displaced fragment!',
          'On the far medial slices, verify >= 2 consecutive "bow-tie" body slices before transitioning into the horns.',
        ],
        pitfallAndHook:
          'Retention Hook: "Big Back (Medial PH > AH); Equal Twins (Lateral PH = AH)."',
      },
      {
        id: 'sag-root',
        label: 'Medial Posterior Root Check',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [100.5, 8.5, -18.0],
        targetBadge: 'Posterior Root Insertion',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'notch',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.45,
        flexionDeg: 4,
        whatToLookFor:
          'Walk inward toward the notch: right before the PCL comes into full view, the posterior medial root must anchor darkly onto the tibial cortex.',
        diagnosticRules: [
          'Trace the medial posterior horn on the sagittal slice just medial to the PCL insertion.',
          'A missing black root triangle replaced by fluid/fat intensity ("Ghost Sign") indicates a root avulsion.',
        ],
        pitfallAndHook:
          'Why It Matters: Missed posterior root tears behave biomechanically like a total meniscectomy and destroy medial cartilage fast.',
      },
      {
        id: 'sag-lat',
        label: 'Lateral Bow-Tie & Hiatus',
        focusStructure: 'LateralMeniscus',
        targetRasOverride: [137.2, 14.2, -11.6],
        targetBadge: 'Symmetric Lateral Horns',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.4,
        flexionDeg: 4,
        whatToLookFor:
          'Scroll out laterally: the O-shaped lateral meniscus shows roughly symmetric Anterior and Posterior horns sitting slightly higher on the convex lateral plateau.',
        diagnosticRules: [
          'Anterior and posterior horns of the lateral meniscus are symmetric in size on sagittal views.',
          'Look posterolaterally for the oblique popliteus tendon passing through the popliteal hiatus — do NOT mistake the hiatus for a tear!',
        ],
        pitfallAndHook:
          'Resident Trap: Normal meniscofemoral ligaments (Humphry anterior / Wrisberg posterior to PCL) and the popliteal hiatus mimic lateral PH tears.',
      },
    ],
    mriChecklist: [
      'Medial Posterior Horn ~2× larger than Anterior Horn.',
      'Intact medial posterior root anchor just medial to PCL.',
      'Symmetric Lateral horns; distinguish popliteus tendon hiatus from tear.',
    ],
    boardPearls: [
      {
        exam: 'Bow-Tie Rule',
        pearl: 'A normal meniscus produces >= 2 consecutive sagittal "bow-tie" body slices (~4–5 mm slice spacing); < 2 bow-ties signals bucket-handle displacement or radial truncation.',
      },
    ],
  },
  {
    id: 'approach-sag-cruciates',
    order: 7,
    category: 'approach',
    title: '3. Sagittal: Cruciates & Notch',
    shortTitle: '3. Cruciates & Notch',
    tag: 'How to Read MRI',
    diagnosticSign: 'Blumensaat Parallel ACL · 2-Structure Notch',
    summary:
      'Next inspect the central intercondylar notch and anterior extensor mechanism in mid-sagittal planes.',
    subSteps: [
      {
        id: 'sag-acl',
        label: 'ACL & Blumensaat Roof',
        focusStructure: 'ACL',
        targetBadge: 'ACL Parallel to Roof',
        viewMode3D: 'joint-interior',
        cameraPreset: 'notch',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.4,
        flexionDeg: 4,
        whatToLookFor:
          'Trace the ACL obliquely from posteromedial lateral femoral condyle down toward the anterior tibial eminence parallel to Blumensaat’s roof.',
        diagnosticRules: [
          'ACL axis should run straight and steep (>= or parallel to Blumensaat’s intercondylar roof line).',
          'Check continuous fibers from femur to tibia — focal interruption, horizontal bowing, or fluid replacement = tear.',
        ],
        pitfallAndHook:
          'Memory Hook: Think "Anterior-to-Lateral" femur attachment — on axial/notch views ACL originates on the inner wall of the Lateral condyle.',
      },
      {
        id: 'sag-pcl',
        label: 'PCL Black Arc & Notch Law',
        focusStructure: 'PCL',
        targetBadge: 'Thick Uniform Black PCL',
        viewMode3D: 'joint-interior',
        cameraPreset: 'posterior',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.4,
        flexionDeg: 10,
        whatToLookFor:
          'Switch focus slightly medial to the ACL: the PCL forms a smooth, thick (3–4 mm), jet-black comma arc curving posteriorly into the tibial fossa.',
        diagnosticRules: [
          'Normal PCL stays uniformly black across all MRI sequences due to dense collagen packing.',
          '"Two-Structure Notch Rule": Only ACL and PCL belong in the intercondylar notch — a 3rd dark band underneath PCL = Double PCL bucket-handle fragment!',
        ],
        pitfallAndHook:
          'Retention Hook: PCL = thick, black, lazy arc (~4 mm). If > 7 mm thick or gray inside, look closely for tear.',
      },
      {
        id: 'sag-extensor',
        label: 'Quadriceps, Patellar Tendon & Hoffa',
        focusStructure: 'PatellarTendon',
        targetBadge: 'Patellar Tendon & Hoffa Pad',
        viewMode3D: 'solid',
        cameraPreset: 'anterior',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.25,
        flexionDeg: 4,
        whatToLookFor:
          'Sweep anteriorly over the patella: check trilaminar quadriceps tendon superiorly, flat dark patellar tendon inferiorly, and dark fat-suppressed Hoffa pad.',
        diagnosticRules: [
          'Patellar tendon should remain uniformly thin (< 6 mm AP) and dark from inferior patellar pole to tibial tubercle.',
          'Check patellar height (Insall-Salvati tendon/patella length ~0.8–1.2) — high-riding = patella alta.',
        ],
        pitfallAndHook:
          'Jumper Knee Check: Always inspect the posterior proximal attachment right at the inferior patellar pole for focal thickening/edema.',
      },
    ],
    mriChecklist: [
      'ACL straight and parallel to Blumensaat’s roof.',
      'PCL uniform black arc (< 6 mm thick); no 3rd notch band.',
      'Quadriceps and patellar tendons intact without focal proximal edema.',
    ],
    boardPearls: [
      {
        exam: 'Two-Structure Notch Rule',
        pearl: 'Only two ligaments cross the central notch. Seeing a third hypointense structure anteroinferior to the PCL reliably signals a displaced bucket-handle tear.',
      },
    ],
  },
  {
    id: 'approach-coronal',
    order: 8,
    category: 'approach',
    title: '4. Coronal: Collaterals & Bone',
    shortTitle: '4. Coronal & Collaterals',
    tag: 'How to Read MRI',
    diagnosticSign: 'MCL Body Extrusion Slice · PLC Stabilizers',
    summary:
      'Switch to the Coronal plane to verify meniscal extrusion, collateral ligaments (MCL / LCL), and biomechanical marrow contusion footprints.',
    subSteps: [
      {
        id: 'cor-mcl',
        label: 'MCL & Meniscal Extrusion Landmark',
        focusStructure: 'MCL',
        targetRasOverride: [68.3, 15.2, -16.4],
        targetBadge: 'MCL Mid-Body Slice',
        viewMode3D: 'solid',
        cameraPreset: 'medial',
        cameraDistanceScale: 1.05,
        mriPlane: 'coronal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.35,
        flexionDeg: 4,
        mriAnnotations: [
          {
            kind: 'caliper',
            aRas: [77.0, 15.2, -18.5],
            bRas: [75.0, 15.2, -18.5],
            tone: 'emerald',
            label: 'Normal Rim Flush (<= 3 mm)',
          },
        ],
        whatToLookFor:
          'On this coronal slice through the MCL body, follow the taut dark MCL band from medial femoral epicondyle down ~5 cm below the joint line.',
        diagnosticRules: [
          'Grade 1 MCL = intact fibers with superficial edema; Grade 2 = partial disruption; Grade 3 = complete fiber discontinuity.',
          'Use THIS exact coronal slice at the MCL level to measure medial meniscal extrusion (> 3 mm past medial tibial margin = abnormal!).',
        ],
        pitfallAndHook:
          'Fellowship Rule: Every time you look at the MCL on Coronal, glance immediately inward to check if the medial meniscus protrudes > 3 mm.',
      },
      {
        id: 'cor-lcl',
        label: 'LCL & Posterolateral Corner (PLC)',
        focusStructure: 'LCL',
        targetRasOverride: [156.0, 7.0, -24.0],
        targetBadge: 'LCL -> Fibular Head',
        viewMode3D: 'solid',
        cameraPreset: 'lateral',
        cameraDistanceScale: 1.05,
        mriPlane: 'coronal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.35,
        flexionDeg: 4,
        whatToLookFor:
          'Scroll slightly posterior on Coronal to trace the cord-like LCL obliquely from lateral epicondyle onto the lateral fibular head alongside biceps femoris.',
        diagnosticRules: [
          'PLC Triad: LCL (fibular collateral), popliteus tendon (in popliteal groove), and popliteofibular ligament.',
          'Always scrutinize the fibular styloid tip for "arcuate" avulsion edema.',
        ],
        pitfallAndHook:
          'Remember: Isolated PLC injuries are rare (< 2%) — always evaluate PLC when you find a PCL or ACL tear!',
      },
      {
        id: 'cor-marrow',
        label: 'Coronal Marrow & Condyles',
        focusStructure: 'Tibia',
        targetRasOverride: [115.0, 22.0, -18.0],
        targetBadge: 'Tibiofemoral Articular Box',
        viewMode3D: 'joint-interior',
        cameraPreset: 'anterior',
        cameraDistanceScale: 1.05,
        mriPlane: 'coronal',
        mriContrast: 'trabecular',
        mriZoom: 1.25,
        flexionDeg: 4,
        whatToLookFor:
          'Switch W/L window to Bone Marrow to screen subchondral plates of all four weight-bearing femoral/tibial corners as your biomechanical bruise map.',
        diagnosticRules: [
          'Lateral condyle + posterolateral tibia bruises = ACL pivot-shift injury (or MCL valgus impaction).',
          'Anteromedial tibia/femur bruises = varus-hyperextension PLC injury!',
        ],
        pitfallAndHook:
          'Memory Hook: Bone bruises are the "footprints of the accident" — read where the bones smashed together to deduce which ligament snapped.',
      },
    ],
    mriChecklist: [
      'Trace superficial and deep MCL on mid-coronal slices; check extrusion <= 3 mm.',
      'Trace LCL + popliteus onto fibular head posterolaterally.',
      'Map subchondral bone bruises across all 4 coronal corners.',
    ],
    boardPearls: [
      {
        exam: 'Coronal Contusion Map',
        pearl: 'Lateral bruises + medial injury? Valgus stress (MCL/ACL). Anteromedial bruises? Posterolateral corner (LCL/popliteus) varus-hyperextension!',
      },
    ],
  },
  {
    id: 'approach-axial',
    order: 9,
    category: 'approach',
    title: '5. Axial: Patella, MPFL & Cartilage',
    shortTitle: '5. Axial & Patella',
    tag: 'How to Read MRI',
    diagnosticSign: 'MPFL Integrity · Trochlear Groove · Thickest Cartilage',
    summary:
      'Finish every knee MRI on Axial slices to inspect the patellofemoral articulation, thickest articular cartilage, and medial patellofemoral ligament (MPFL).',
    subSteps: [
      {
        id: 'ax-cartilage',
        label: 'Retropatellar Cartilage Thickness',
        focusStructure: 'PatellarCartilage',
        targetBadge: 'Median Ridge (2.4–3.7 mm)',
        viewMode3D: 'cartilage-map',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.05,
        mriPlane: 'axial',
        mriContrast: 'chondral',
        mriZoom: 1.4,
        flexionDeg: 18,
        whatToLookFor:
          'Examine the bright crescent of retropatellar cartilage: OpenMSK quantifies median ridge thickness up to 3.7 mm here on 3T qDESS.',
        diagnosticRules: [
          'Evaluate focal contour blistering, partial-thickness fissuring, or full-thickness subchondral marrow exposure.',
          'Observe the wider lateral patellar facet sitting snugly over the lateral trochlear slope.',
        ],
        pitfallAndHook:
          'Retention Fact: Retropatellar cartilage at the median ridge is the thickest hyaline cartilage in the human body.',
      },
      {
        id: 'ax-mpfl',
        label: 'MPFL & Medial Retinaculum',
        focusStructure: 'Patella',
        targetRasOverride: [106.0, 65.0, 24.5],
        targetBadge: 'MPFL Patellar Attachment',
        viewMode3D: 'solid',
        cameraPreset: 'medial',
        cameraDistanceScale: 1.05,
        mriPlane: 'axial',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.45,
        flexionDeg: 6,
        whatToLookFor:
          'Follow the thin dark retinacular band sweeping medially off the superomedial patellar border toward the adductor tubercle / medial epicondyle.',
        diagnosticRules: [
          'MPFL is the primary passive restraint against lateral patellar dislocation (50–60% restraining force).',
          'Check femoral attachment at adductor tubercle vs patellar attachment for discontinuity or wavy laxity.',
        ],
        pitfallAndHook:
          'Clinical Clue: Most patients with transient lateral patellar dislocation reduce spontaneously before MRI — axial MPFL + kissing bruises solve the case!',
      },
      {
        id: 'ax-notch',
        label: 'Axial Intercondylar Condyles & Popliteal Fossa',
        focusStructure: 'Femur',
        targetRasOverride: [112.5, 22.0, 2.0],
        targetBadge: 'Notch Origins & Cyst Screen',
        viewMode3D: 'joint-interior',
        cameraPreset: 'anterior',
        cameraDistanceScale: 1.05,
        mriPlane: 'axial',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.3,
        flexionDeg: 4,
        whatToLookFor:
          'Scroll inferiorly into the intercondylar fossa to double-check ACL on lateral wall, PCL on medial wall, and screen posteriorly for Baker cysts between semimembranosus and medial gastrocnemius.',
        diagnosticRules: [
          'Check femoral ACL footprint along posteromedial lateral condyle and PCL along anterolateral medial condyle.',
          'Always verify popliteal vessels and posteromedial gastrocnemius-semimembranosus bursa (Baker cyst neck).',
        ],
        pitfallAndHook:
          'Baker Cyst Check: True Baker cyst neck ALWAYS passes cleanly between the medial head of gastrocnemius and semimembranosus tendon.',
      },
    ],
    mriChecklist: [
      'Assess retropatellar median ridge & odd facet cartilage on axial slices.',
      'Check patellar alignment in trochlear groove + MPFL continuity.',
      'Screen popliteal fossa (Baker cyst neck vs parameniscal cyst).',
    ],
    boardPearls: [
      {
        exam: 'Search Pattern Wrap-Up',
        pearl: 'A fixed 5-zone loop (Sequences -> Sag Menisci -> Sag Cruciates -> Coronal Collaterals/Bone -> Axial Patella/MPFL) ensures zero blind spots on call.',
      },
    ],
  },

  // ============================================================================
  // TRACK 2: 3D PATHOLOGY MODULES (ALL WITH DEDICATED 3D PATHOLOGY GEOMETRY)
  // ============================================================================
  {
    id: 'meniscal-tears-3d',
    order: 10,
    category: 'pathology',
    title: 'Meniscal Tear Shapes (3D)',
    shortTitle: 'Meniscal Tear Shapes',
    tag: '3D Pathology',
    diagnosticSign: 'Longitudinal vs Radial vs Horizontal + Cyst',
    summary:
      'Top-down 3D dissection of the tibial plateau demonstrating the three classic meniscal tear geometries directly on the C-shaped medial meniscus.',
    subSteps: [
      {
        id: 'tear-longitudinal',
        label: '1. Longitudinal (Vertical)',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [87.5, 9.5, -16.8],
        targetBadge: 'Longitudinal Peripheral Tear',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.45,
        flexionDeg: 4,
        meniscalTearMorphology: 'longitudinal',
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [87.5, 8.8, -14.2],
              [87.5, 9.2, -19.2],
            ],
            tone: 'crimson',
            widthPx: 3.0,
            label: 'Vertical Articular Tear',
          },
          {
            kind: 'arrow',
            fromRas: [87.5, 16.5, -9.5],
            toRas: [87.5, 9.6, -14.6],
            tone: 'cyan',
            label: 'Touches Superior Surface',
          },
        ],
        whatToLookFor:
          'Observe the red circumferential plane parallel to the outer capsular rim in 3D alongside the vertical MRI tear cleft connecting top and bottom meniscal surfaces.',
        diagnosticRules: [
          'Vertical high-signal line parallel to the outer contour extending to superior/inferior plateau surface.',
          'Often associated with trauma (especially ACL rupture); peripheral outer-third longitudinal tears are prime candidates for surgical repair.',
        ],
        pitfallAndHook:
          'Key Progression: Unchecked longitudinal tears widen and allow the inner segment to flip centrally -> Bucket-Handle Tear!',
      },
      {
        id: 'tear-radial',
        label: '2. Radial (Transverse Cleft)',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [91.0, 26.0, -17.0],
        targetBadge: 'Radial Free-Edge Cleft',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.05,
        mriPlane: 'coronal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.45,
        flexionDeg: 4,
        meniscalTearMorphology: 'radial',
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [93.5, 26.0, -16.2],
              [87.5, 26.0, -17.6],
            ],
            tone: 'crimson',
            widthPx: 3.2,
          },
          {
            kind: 'arrow',
            fromRas: [97.5, 26.0, -8.5],
            toRas: [92.5, 26.0, -15.8],
            tone: 'amber',
            label: 'Truncated Free Edge',
          },
        ],
        whatToLookFor:
          'Notice how the radial tear cuts PERPENDICULAR to the C-shape from the sharp inner avascular edge outward, severing load-bearing circumferential hoop fibers.',
        diagnosticRules: [
          'Produces the "Truncated Triangle" or "Marching Cleft Sign" shifting location across sequential MRI slices.',
          'Avulsion at the insertion is a specialized radial tear -> Posterior Root Tear.',
        ],
        pitfallAndHook:
          'Biomechanics Rule: Longitudinal tears spare circumferential hoop fibers; Radial tears cut through them like slicing a suspension bridge cable!',
      },
      {
        id: 'tear-horizontal',
        label: '3. Horizontal + Parameniscal Cyst',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [75.0, 21.0, -17.0],
        targetBadge: 'Horizontal Cleavage + Cyst',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.08,
        mriPlane: 'coronal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.42,
        flexionDeg: 4,
        meniscalTearMorphology: 'horizontal',
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [88.5, 21.0, -17.2],
              [74.5, 21.0, -17.0],
            ],
            tone: 'crimson',
            widthPx: 3.0,
          },
          {
            kind: 'region',
            pointsRas: [
              [74.5, 21.0, -14.2],
              [67.5, 21.0, -13.6],
              [65.5, 21.0, -17.0],
              [68.0, 21.0, -20.4],
              [74.5, 21.0, -19.2],
            ],
            tone: 'cyan',
            fillOpacity: 0.34,
            label: 'Parameniscal Cyst',
          },
          {
            kind: 'arrow',
            fromRas: [82.0, 21.0, -16.8],
            toRas: [70.5, 21.0, -16.8],
            tone: 'amber',
            label: 'Fluid Track -> Cyst',
          },
        ],
        whatToLookFor:
          'See how the horizontal cleavage splits the meniscus horizontally like a hamburger bun, pumping joint fluid outward to form the cyan peripheral Parameniscal Cyst on both 3D and Coronal MRI.',
        diagnosticRules: [
          'Horizontal high signal line extending straight to the free inner tip parallel to the tibial plateau.',
          'Finding a bright lobulated parameniscal cyst at the capsule mandates searching for the feeding horizontal tear.',
        ],
        pitfallAndHook:
          'Classic Sign: Joint cyst touching the peripheral meniscal rim = horizontal cleavage tear until proven otherwise!',
      },
    ],
    mriChecklist: [
      'Classify tear plane: Longitudinal (with circumference), Radial (perpendicular), or Horizontal (parallel to plateau).',
      'Inspect capsular margin for parameniscal cyst associated with horizontal cleavage.',
      'Assess red-red outer third viability for surgical repair vs debridement.',
    ],
    boardPearls: [
      {
        exam: 'Marching Cleft Sign',
        pearl: 'A radial tear moves progressively across adjacent coronal/sagittal slices ("marching cleft") and abruptly blunts the sharp inner meniscal triangle.',
      },
    ],
  },
  {
    id: 'bucket-handle',
    order: 11,
    category: 'pathology',
    title: 'Bucket-Handle Tear (Double PCL)',
    shortTitle: 'Bucket-Handle (Double PCL)',
    tag: '3D Pathology',
    diagnosticSign: 'Double PCL Sign + Absent Bow-Tie',
    summary:
      'A large longitudinal medial meniscal tear flips the inner rim centrally into the intercondylar notch anteroinferior to the PCL, locking the knee.',
    subSteps: [
      {
        id: 'bh-notch',
        label: '1. Flipped Fragment (Double PCL)',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [110.3, 24.0, -15.0],
        targetBadge: 'Flipped Bucket-Handle Fragment',
        viewMode3D: 'joint-interior',
        cameraPreset: 'notch',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.45,
        flexionDeg: 10,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [110.3, 29.0, -10.5],
              [110.3, 23.0, -15.2],
              [110.3, 16.5, -19.0],
            ],
            tone: 'crimson',
            widthPx: 3.4,
            label: 'Double PCL (Flipped Fragment)',
          },
          {
            kind: 'arrow',
            fromRas: [110.3, 14.0, -4.0],
            toRas: [110.3, 19.0, -9.5],
            tone: 'cyan',
            label: 'True Native PCL',
          },
        ],
        whatToLookFor:
          'Look inside the X-ray intercondylar notch and on Sagittal MRI: the crimson displaced medial fragment sits parallel and anteroinferior to the true PCL ("Double PCL Sign").',
        diagnosticRules: [
          'Sagittal "Double PCL Sign": low-signal displaced fragment mimics a second PCL ribbon in the intercondylar notch.',
          '"Absent Bow-Tie Sign": < 2 normal bow-tie body slices remain on the peripheral donor side.',
        ],
        pitfallAndHook:
          'Don’t Miss: "Empty medial gutter + third structure in notch = displaced bucket-handle tear."',
      },
      {
        id: 'bh-coronal',
        label: '2. Truncated Rim on Coronal',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [94.0, 23.0, -16.5],
        targetBadge: 'Truncated Rim -> Notch Flip',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.06,
        mriPlane: 'coronal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.4,
        flexionDeg: 6,
        mriAnnotations: [
          {
            kind: 'region',
            pointsRas: [
              [86.0, 23.0, -15.0],
              [78.0, 23.0, -14.8],
              [77.5, 23.0, -19.0],
              [86.5, 23.0, -18.5],
            ],
            tone: 'amber',
            dashed: true,
            label: 'Truncated Donor Body',
          },
          {
            kind: 'region',
            pointsRas: [
              [111.5, 23.0, -13.0],
              [106.5, 23.0, -13.5],
              [106.5, 23.0, -17.5],
              [111.5, 23.0, -17.0],
            ],
            tone: 'crimson',
            fillOpacity: 0.36,
            label: 'Fragment in Notch',
          },
          {
            kind: 'arrow',
            fromRas: [84.0, 23.0, -12.5],
            toRas: [108.0, 23.0, -14.2],
            curved: -0.22,
            tone: 'crimson',
            label: 'Inner Rim Flips Into Notch',
          },
        ],
        whatToLookFor:
          'On both top-down 3D and Coronal MRI, only a tiny stunted outer medial rim remains while the orphaned dark handle sits inside the central fossa.',
        diagnosticRules: [
          'Coronal view displays a small truncated medial body plus an orphaned triangular fragment inside the intercondylar fossa.',
          'Occasionally flips anteriorly onto the anterior horn ("Flipped Meniscus Sign" = double anterior horn!).',
        ],
        pitfallAndHook:
          'Pitfall: Check donor truncation! Unlike Humphry/Wrisberg ligaments, a bucket-handle ALWAYS steals volume from the donor meniscus.',
      },
      {
        id: 'bh-acl-check',
        label: '3. Screen Associated ACL Tear',
        focusStructure: 'ACL',
        targetBadge: 'Inspect ACL Next to Fragment',
        viewMode3D: 'joint-interior',
        cameraPreset: 'notch',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.4,
        flexionDeg: 14,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [112.5, 36.0, 4.0],
            toRas: [112.5, 27.0, -1.0],
            tone: 'cyan',
            label: 'Check ACL Alongside Locked Fragment',
          },
        ],
        whatToLookFor:
          'Verify whether the adjacent ACL remains continuous in the notch — bucket-handle medial tears frequently complicate chronic ACL instability.',
        diagnosticRules: [
          'Prompt orthopedic referral required: displaced fragments block full extension ("locked knee").',
          'Report donor rim width and anterior/posterior horn anchor integrity for surgical planning.',
        ],
        pitfallAndHook:
          'Clinical Priority: Mention "urgent arthroscopic reduction / repair candidate" in your PowerScribe impression.',
      },
    ],
    mriChecklist: [
      'Absent Bow-Tie Sign (< 2 bow-tie slices) on medial meniscus.',
      'Double PCL band anteroinferior to true PCL in notch.',
      'Coronal view confirms diminutive donor body + fragment in notch.',
    ],
    boardPearls: [
      {
        exam: 'FRCR 2B Trap',
        pearl: 'Distinguish a Double PCL sign from Humphry/Wrisberg meniscofemoral ligaments by verifying truncation/shortening of the medial meniscus body.',
      },
    ],
  },
  {
    id: 'posterior-root',
    order: 12,
    category: 'pathology',
    title: 'Posterior Root Tear & Extrusion',
    shortTitle: 'Posterior Root + Extrusion',
    tag: '3D Pathology',
    diagnosticSign: 'Ghost Sign + > 3 mm Medial Extrusion',
    summary:
      'Complete detachment of the medial posterior meniscal root destroys hoop tension, extruding the meniscus > 3 mm medially and accelerating cartilage collapse.',
    subSteps: [
      {
        id: 'root-extrusion',
        label: '1. Coronal > 3 mm Extrusion',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [75.0, 21.0, -17.5],
        targetBadge: '+4.2 mm Medial Extrusion',
        viewMode3D: 'solid',
        cameraPreset: 'medial',
        cameraDistanceScale: 1.06,
        mriPlane: 'coronal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.45,
        flexionDeg: 4,
        mriAnnotations: [
          {
            kind: 'region',
            pointsRas: [
              [76.0, 21.0, -14.8],
              [71.0, 21.0, -15.5],
              [71.0, 21.0, -19.0],
              [76.0, 21.0, -19.2],
            ],
            tone: 'crimson',
            dashed: true,
            fillOpacity: 0.34,
          },
          {
            kind: 'caliper',
            aRas: [76.2, 21.0, -20.5],
            bRas: [71.0, 21.0, -20.5],
            tone: 'amber',
            label: '+4.2 mm Extrusion (> 3 mm)',
          },
          {
            kind: 'arrow',
            fromRas: [81.0, 21.0, -13.0],
            toRas: [72.0, 21.0, -16.5],
            tone: 'crimson',
            label: 'Medial Extrusion',
          },
        ],
        whatToLookFor:
          'Look at the medial tibial plateau margin: the un-tethered Medial Meniscus bulges +4.2 mm outward beyond the bone edge right beneath the MCL.',
        diagnosticRules: [
          'Abnormal radial extrusion > 3 mm beyond the medial tibial plateau margin on the mid-coronal slice at MCL level.',
          'Caused by loss of circumferential hoop tension.',
        ],
        pitfallAndHook:
          'Rule of Thumb: See meniscal extrusion > 3 mm? Look immediately at the posterior root — it is torn ~80% of the time!',
      },
      {
        id: 'root-ghost',
        label: '2. Sagittal "Ghost Sign"',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [100.5, 9.0, -18.0],
        targetBadge: 'Torn Posterior Root Cleft',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.5,
        flexionDeg: 8,
        mriAnnotations: [
          {
            kind: 'region',
            pointsRas: [
              [100.5, 13.5, -16.0],
              [100.5, 5.5, -15.5],
              [100.5, 6.0, -20.0],
            ],
            tone: 'amber',
            dashed: true,
            fillOpacity: 0.3,
            label: 'Ghost Sign (Empty Root)',
          },
          {
            kind: 'arrow',
            fromRas: [100.5, 16.0, -9.0],
            toRas: [100.5, 9.5, -16.8],
            tone: 'crimson',
            label: 'Replaced by Bright Signal',
          },
        ],
        whatToLookFor:
          'In 3D see the crimson avulsion ring right at the posterior root anchor medial to PCL; on sagittal MRI, bright signal replaces the normally jet-black root ("Ghost Sign").',
        diagnosticRules: [
          '"Ghost Sign": absence of identifiable dark meniscus triangle on the sagittal slice just medial to PCL.',
          'Coronal vertical linear defect within 9 mm of the tibial posterior root insertion.',
        ],
        pitfallAndHook:
          'Why Surgeons Fix It: An untreated posterior root tear has the same joint contact pressure as a complete meniscectomy!',
      },
      {
        id: 'root-chondral',
        label: '3. Weight-Bearing Chondral Risk',
        focusStructure: 'FemoralCartilage',
        targetRasOverride: [90.0, 22.0, -12.0],
        targetBadge: 'Medial Overload & SIFK Zone',
        viewMode3D: 'cartilage-map',
        cameraPreset: 'medial',
        cameraDistanceScale: 1.06,
        mriPlane: 'coronal',
        mriContrast: 'chondral',
        mriZoom: 1.4,
        flexionDeg: 8,
        mriAnnotations: [
          {
            kind: 'edema',
            centerRas: [90.0, 22.0, -8.0],
            radiusMm: 8.0,
            tone: 'crimson',
            label: 'Subchondral SIFK Risk Zone',
          },
        ],
        whatToLookFor:
          'Switch to Cartilage Map to check the weight-bearing medial femoral condyle (`1.73 mm` mean thickness) for rapid thinning or subchondral insufficiency fracture (SIFK).',
        diagnosticRules: [
          'Check underlying medial femoral condyle & tibial plateau marrow for bright edema or subchondral crescentic fracture line (formerly SONK).',
          'Preserved hyaline cartilage makes the patient an ideal candidate for transtibial root repair.',
        ],
        pitfallAndHook:
          'Key Pearl: Always correlate root tears with underlying medial femoral condyle subchondral insufficiency fracture (SIFK)!',
      },
    ],
    mriChecklist: [
      'Measure medial meniscal extrusion at coronal MCL slice (> 3 mm = abnormal).',
      'Check sagittal "Ghost Sign" just medial to PCL tibial footprint.',
      'Screen medial condyle cartilage and marrow for SIFK.',
    ],
    boardPearls: [
      {
        exam: 'Root Biomechanics',
        pearl: 'Transtibial pull-out root repair restores hoop tension only if performed before advanced medial compartment chondrosis (Outerbridge III/IV) sets in.',
      },
    ],
  },
  {
    id: 'acl-rupture',
    order: 13,
    category: 'pathology',
    title: 'ACL Rupture & Pivot-Shift',
    shortTitle: 'ACL + Pivot-Shift',
    tag: '3D Pathology',
    diagnosticSign: 'Pivot-Shift Kissing Bruises + Segond + Lachman',
    summary:
      'Full-thickness ACL tear eliminates anterior-rotatory stability, leaving unmistakable pivot-shift kissing bone bruises, anterior tibial translation, and potential Segond avulsion.',
    subSteps: [
      {
        id: 'acl-tear-gap',
        label: '1. Midsubstance Tear & Laxity',
        focusStructure: 'ACL',
        targetBadge: 'Torn ACL + Flattened Course',
        viewMode3D: 'joint-interior',
        cameraPreset: 'notch',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.45,
        flexionDeg: 18,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [112.5, 21.0, 9.5],
              [112.5, 32.0, -12.0],
            ],
            tone: 'cyan',
            dashed: true,
            widthPx: 1.6,
            label: 'Expected Blumensaat Slope',
          },
          {
            kind: 'cleft',
            pointsRas: [
              [112.5, 22.0, 4.0],
              [112.5, 26.5, -1.5],
              [112.5, 28.0, -8.0],
            ],
            tone: 'crimson',
            widthPx: 3.4,
            label: 'Disrupted / Flattened ACL',
          },
          {
            kind: 'arrow',
            fromRas: [112.5, 38.0, -2.0],
            toRas: [112.5, 27.0, -2.0],
            tone: 'crimson',
            label: 'Midsubstance Fluid Gap',
          },
        ],
        whatToLookFor:
          'Observe the translucent crimson injured ACL in the notch with loss of taut Blumensaat alignment while intact black PCL behind it begins vertical buckling.',
        diagnosticRules: [
          'Primary signs: focal discontinuity, wavy or horizontal course flattening (< Blumensaat slope), or diffuse fluid gap.',
          'Secondary sign: "Question-Mark PCL" buckling caused by anterior tibial translation.',
        ],
        pitfallAndHook:
          'Hold On: Check ALL three planes — sagittal notch views can suffer partial volume averaging if the scan wasn’t oblique!',
      },
      {
        id: 'acl-lachman',
        label: '2. Lachman Drawer (Scrub Flexion)',
        focusStructure: 'LateralMeniscus',
        targetRasOverride: [137.0, 4.0, -12.0],
        targetBadge: 'Uncovered Lat. Meniscus (>7 mm)',
        viewMode3D: 'joint-interior',
        cameraPreset: 'lateral',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.4,
        flexionDeg: 26,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [137.0, 12.0, -22.0],
            toRas: [137.0, 29.0, -22.0],
            tone: 'crimson',
            label: 'Anterior Drawer +7.6 mm',
          },
          {
            kind: 'arrow',
            fromRas: [137.0, 4.0, -3.0],
            toRas: [137.0, 4.5, -11.5],
            tone: 'amber',
            label: 'Uncovered Post. Horn',
          },
        ],
        whatToLookFor:
          'Watch the Right Tibia glide forward (+7.6 mm Lachman Peak at 25° flexion!) relative to Femur in 3D, leaving the posterior horn of the lateral meniscus uncovered anteriorly.',
        diagnosticRules: [
          'Anterior tibial translation >= 5–7 mm relative to lateral femoral condyle indicates complete ACL loss.',
          'Drag the Flexion slider from 0° to 30°: instability peaks at 20°–30° when posterior capsule and hamstrings relax (Lachman test!).',
        ],
        pitfallAndHook:
          'Retention Hook: ACL Anterior Drawer peaks around 25° Flexion (Lachman), NOT 90°!',
      },
      {
        id: 'acl-bruises',
        label: '3. Kissing Bruises & Segond Flake',
        focusStructure: 'Femur',
        targetRasOverride: [135.0, 18.0, -8.0],
        targetBadge: 'Pivot-Shift Bruise & Segond',
        viewMode3D: 'joint-interior',
        cameraPreset: 'lateral',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'trabecular',
        mriZoom: 1.35,
        flexionDeg: 25,
        mriAnnotations: [
          {
            kind: 'edema',
            centerRas: [135.0, 26.0, -5.0],
            radiusMm: 8.5,
            tone: 'crimson',
            label: 'Lat. Femoral Sulcus Bruise',
          },
          {
            kind: 'edema',
            centerRas: [135.0, 4.5, -17.5],
            radiusMm: 8.5,
            tone: 'crimson',
            label: 'Posterolateral Tibia Bruise',
          },
          {
            kind: 'arrow',
            fromRas: [135.0, 22.0, -8.0],
            toRas: [135.0, 8.0, -15.5],
            tone: 'amber',
            dashed: true,
            label: 'Pivot-Shift Impact Vector',
          },
        ],
        whatToLookFor:
          'Look laterally in 3D & MRI: ruby pivot-shift kissing bruises light up the lateral femoral sulcus terminalis & posterolateral tibial plateau, with detached Segond cortical flake laterally.',
        diagnosticRules: [
          'Classic Pivot-Shift Contusions: lateral femoral condylopatellar sulcus (> 1.5 mm "deep sulcus sign") + posterolateral tibial plateau.',
          'Segond fracture (small cortical avulsion just distal to lateral tibial plateau) = virtually 100% specific for ACL tear!',
        ],
        pitfallAndHook:
          'Don’t Miss: Also check the posteromedial meniscus peripheral capsule (Ramp lesion) on sagittal slices in every acute ACL tear.',
      },
    ],
    mriChecklist: [
      'Direct ACL discontinuity / horizontal fiber orientation.',
      'Pivot-shift kissing bruises: lateral femoral sulcus + posterolateral tibia.',
      'Check lateral meniscus posterior horn uncovering, Segond avulsion & Ramp lesion.',
    ],
    boardPearls: [
      {
        exam: 'Lachman vs Pivot-Shift',
        pearl: 'Valgus + internal rotation injury bangs the lateral femoral condyle directly into the posterolateral tibial plateau as the tibia subluxes anteriorly.',
      },
    ],
  },
  {
    id: 'pcl-dashboard',
    order: 14,
    category: 'pathology',
    title: 'PCL Dashboard Tear',
    shortTitle: 'PCL Tear (Sag)',
    tag: '3D Pathology',
    diagnosticSign: 'Posterior Tibial Sag + Anterior Tibial Bruise',
    summary:
      'Direct anterior blow to the flexed tibia ruptures the PCL midsubstance, permitting severe posterior tibial sag in high flexion and placing the Posterolateral Corner at risk.',
    subSteps: [
      {
        id: 'pcl-midsubstance',
        label: '1. Torn Thickened PCL (> 7 mm)',
        focusStructure: 'PCL',
        targetBadge: 'Torn PCL Midsubstance',
        viewMode3D: 'joint-interior',
        cameraPreset: 'posterior',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.45,
        flexionDeg: 55,
        mriAnnotations: [
          {
            kind: 'region',
            pointsRas: [
              [113.8, 25.0, -3.0],
              [113.8, 17.5, -6.5],
              [113.8, 11.5, -16.0],
              [113.8, 16.5, -19.5],
              [113.8, 22.0, -10.5],
            ],
            tone: 'crimson',
            fillOpacity: 0.32,
            label: 'Thickened Torn PCL >= 7 mm',
          },
          {
            kind: 'caliper',
            aRas: [113.8, 22.0, -8.5],
            bRas: [113.8, 14.5, -11.5],
            tone: 'amber',
            label: 'AP >= 7 mm',
          },
        ],
        whatToLookFor:
          'Rotate to the posterior notch: the injured crimson PCL loses its tight smooth black ribbon and becomes widened (> 7 mm AP) or disrupted midsubstance.',
        diagnosticRules: [
          'PCL rarely tears cleanly with huge gaps; look for focal AP thickening >= 7 mm with diffuse bright internal signal.',
          'Check tibial posterior facet attachment for small osseous PCL avulsion fracture (repaired acutely!).',
        ],
        pitfallAndHook:
          'Pitfall: Intact meniscofemoral ligaments (Wrisberg/Humphry) can make a completely torn PCL look "pseudo-intact" — trust thickness >= 7 mm!',
      },
      {
        id: 'pcl-sag',
        label: '2. Posterior Sag (Flex 75°)',
        focusStructure: 'Tibia',
        targetRasOverride: [115.0, 32.0, -25.0],
        targetBadge: 'Anterior Dashboard Bruise',
        viewMode3D: 'joint-interior',
        cameraPreset: 'lateral',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'trabecular',
        mriZoom: 1.35,
        flexionDeg: 75,
        mriAnnotations: [
          {
            kind: 'edema',
            centerRas: [115.0, 38.0, -25.0],
            radiusMm: 9.5,
            tone: 'crimson',
            label: 'Anterior Dashboard Bruise',
          },
          {
            kind: 'arrow',
            fromRas: [115.0, 50.0, -23.0],
            toRas: [115.0, 38.5, -24.5],
            tone: 'amber',
            label: 'Direct Dashboard Blow',
          },
          {
            kind: 'arrow',
            fromRas: [115.0, 30.0, -34.0],
            toRas: [115.0, 12.0, -34.0],
            tone: 'crimson',
            label: 'Posterior Sag -8.2 mm',
          },
        ],
        whatToLookFor:
          'At 75° Flexion, watch the Right Tibia sag backward (−8.2 mm posterior drawer) in 3D, with the crimson Dashboard bruise marking direct impact on the anterior proximal tibia.',
        diagnosticRules: [
          'Posterior drawer instability maximizes at 70°–90° knee flexion when PCL is the primary posterior restraint.',
          'Look for anterior proximal tibial marrow bruise opposite the flexed femur ("dashboard injury").',
        ],
        pitfallAndHook:
          'Compare Mechanisms: ACL = Kissing bruises posteriorly/laterally; PCL = Dashboard bruise anteriorly on proximal tibia!',
      },
      {
        id: 'pcl-plc',
        label: '3. Mandatory PLC Check',
        focusStructure: 'LCL',
        targetRasOverride: [154.0, 2.0, -45.0],
        targetBadge: 'Fibular Head / LCL Check',
        viewMode3D: 'solid',
        cameraPreset: 'lateral',
        cameraDistanceScale: 1.06,
        mriPlane: 'coronal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.4,
        flexionDeg: 25,
        mriAnnotations: [
          {
            kind: 'edema',
            centerRas: [154.0, 2.0, -44.0],
            radiusMm: 7.0,
            tone: 'amber',
            label: 'Check Fibular Styloid (Arcuate)',
          },
        ],
        whatToLookFor:
          'Inspect LCL and proximal Fibular Styloid closely: missing combined Posterolateral Corner injury causes isolated PCL grafts to stretch out and fail.',
        diagnosticRules: [
          'Up to 60% of acute PCL tears involve concurrent Posterolateral Corner (LCL + popliteus + arcuate) or ACL trauma.',
          'Check coronal fibular head for arcuate avulsion and anteromedial condyle for varus kissing edema.',
        ],
        pitfallAndHook:
          'Golden Partner Rule: Whenever you diagnose a PCL tear, immediately jump to the Fibular Head & LCL!',
      },
    ],
    mriChecklist: [
      'PCL AP thickness >= 7 mm or disrupted fiber contour.',
      'Anterior tibial dashboard bone bruise + posterior sag in flexion.',
      'Mandatory check of LCL, popliteus, and fibular head (PLC).',
    ],
    boardPearls: [
      {
        exam: 'Pseudo-Intact PCL',
        pearl: 'A torn PCL often preserves a tubular outline due to surrounding synovium and meniscofemoral fibers; AP thickening > 7 mm on sagittal MRI is diagnostic.',
      },
    ],
  },
  {
    id: 'unhappy-triad',
    order: 15,
    category: 'pathology',
    title: 'MCL & O’Donoghue Unhappy Triad',
    shortTitle: 'MCL & Unhappy Triad',
    tag: '3D Pathology',
    diagnosticSign: 'ACL + Grade 3 MCL + Peripheral Meniscus',
    summary:
      'High-energy valgus + external rotation ("clip injury") disrupts both ACL and MCL while crashing the lateral compartment and tearing the peripheral meniscus.',
    subSteps: [
      {
        id: 'triad-mcl',
        label: '1. Grade 3 MCL & Valgus Bruises',
        focusStructure: 'MCL',
        targetRasOverride: [68.3, 15.2, -16.4],
        targetBadge: 'Torn MCL Fibers (Medial)',
        viewMode3D: 'solid',
        cameraPreset: 'medial',
        cameraDistanceScale: 1.06,
        mriPlane: 'coronal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.35,
        flexionDeg: 18,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [69.5, 15.2, -5.0],
              [66.8, 15.2, -14.0],
              [68.5, 15.2, -26.0],
            ],
            tone: 'crimson',
            widthPx: 3.2,
            label: 'Grade 3 MCL Disruption',
          },
          {
            kind: 'edema',
            centerRas: [136.0, 15.2, -6.5],
            radiusMm: 8.5,
            tone: 'crimson',
            label: 'Valgus Lateral Contusions',
          },
          {
            kind: 'edema',
            centerRas: [136.0, 15.2, -19.5],
            radiusMm: 8.0,
            tone: 'crimson',
          },
          {
            kind: 'arrow',
            fromRas: [148.0, 15.2, -13.0],
            toRas: [137.0, 15.2, -13.0],
            tone: 'amber',
            label: 'Valgus Compression',
          },
        ],
        whatToLookFor:
          'Inspect the crimson torn MCL spanning the medial joint line while paradoxical valgus impaction bruises light up the opposite LATERAL femoral & tibial condyles.',
        diagnosticRules: [
          'Grade 3 MCL tear disrupts both superficial tibial collateral and deep meniscofemoral/meniscotibial capsular bands.',
          'Valgus opening tears medial structures by tension while crushing lateral bones by compression.',
        ],
        pitfallAndHook:
          'Paradox Hook: Lateral bone bruise + Medial MCL tear = classic valgus "clip injury" compression/tension pair.',
      },
      {
        id: 'triad-acl',
        label: '2. Concurrent ACL Failure',
        focusStructure: 'ACL',
        targetBadge: 'Ruptured ACL (+6.6 mm Drawer)',
        viewMode3D: 'joint-interior',
        cameraPreset: 'notch',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.4,
        flexionDeg: 22,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [112.5, 22.0, 4.0],
              [112.5, 27.5, -2.0],
              [112.5, 29.0, -8.5],
            ],
            tone: 'crimson',
            widthPx: 3.2,
            label: 'Ruptured ACL + Drawer',
          },
        ],
        whatToLookFor:
          'Inside See-Through Joint, BOTH the ACL and MCL turn crimson with combined anteromedial rotatory instability.',
        diagnosticRules: [
          'Always evaluate deep MCL and posteromedial corner (posterior oblique ligament) when ACL + MCL tear together.',
          'Deep MCL separation allows peripheral meniscocapsular separation ("floating meniscus").',
        ],
        pitfallAndHook:
          'Surgical Timing: Grade 3 MCL tears may need bracing/healing before or concurrent repair during ACL reconstruction.',
      },
      {
        id: 'triad-meniscus',
        label: '3. Medial vs Acute Lateral Meniscus',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [81.0, 8.0, -17.0],
        targetBadge: 'Posteromedial Ramp / Peripheral Tear',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.45,
        flexionDeg: 18,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [81.0, 6.0, -14.2],
              [81.0, 6.2, -19.2],
            ],
            tone: 'crimson',
            widthPx: 3.2,
            label: 'Posteromedial Ramp Tear',
          },
        ],
        whatToLookFor:
          'Notice the crimson posteromedial capsular tear site along the outer Medial Meniscus rim — and remember to inspect the Lateral Meniscus too!',
        diagnosticRules: [
          'O’Donoghue classically described ACL + MCL + Medial Meniscus.',
          'Modern MRI/arthroscopy series show Lateral Meniscus tears actually happen slightly more often in acute pivot-shift valgus trauma!',
        ],
        pitfallAndHook:
          'Board Classic vs Reality: Remember "Classically Medial, Acutely Often Lateral" — always check BOTH menisci carefully!',
      },
    ],
    mriChecklist: [
      'Complete MCL fiber disruption + periligamentous edema.',
      'Full-thickness ACL tear + lateral compartment valgus impaction bruises.',
      'Screen BOTH medial capsular/ramp zone and lateral posterior horn.',
    ],
    boardPearls: [
      {
        exam: 'Board Classic',
        pearl: 'Valgus + external rotation mechanism = O’Donoghue Triad (ACL + MCL + Meniscus).',
      },
    ],
  },
  {
    id: 'patellar-dislocation',
    order: 16,
    category: 'pathology',
    title: 'Patellar Dislocation & MPFL Tear',
    shortTitle: 'Patella Dislocation & MPFL',
    tag: '3D Pathology',
    diagnosticSign: 'Lateral Subluxation + Torn MPFL + Kissing Bruises',
    summary:
      'Interactive 3D lateral patellar dislocation & reduction showing torn MPFL ligament, directional MRI subluxation vectors, and inferomedial patella + anterolateral condyle kissing bruises.',
    biomechControl: 'patella-reduction',
    subSteps: [
      {
        id: 'pat-sublux',
        label: '1. Lateral Subluxation (3D Motion)',
        focusStructure: 'Patella',
        targetRasOverride: [124.0, 62.0, 22.0],
        targetBadge: 'Laterally Dislocated Patella',
        viewMode3D: 'solid',
        cameraPreset: 'anterior',
        cameraDistanceScale: 1.05,
        mriPlane: 'axial',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.35,
        flexionDeg: 6,
        patellaSubluxation: 1.0,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [118.0, 66.0, 22.0],
            toRas: [143.0, 56.0, 22.0],
            curved: -0.22,
            tone: 'crimson',
            label: 'Lateral Subluxation',
          },
          {
            kind: 'region',
            pointsRas: [
              [133.0, 65.0, 22.0],
              [149.0, 58.0, 22.0],
              [146.0, 50.0, 22.0],
              [131.0, 57.0, 22.0],
            ],
            tone: 'amber',
            dashed: true,
            fillOpacity: 0.24,
            label: 'Subluxed Position',
          },
          {
            kind: 'arrow',
            fromRas: [142.0, 49.0, 22.0],
            toRas: [117.0, 58.0, 22.0],
            curved: 0.28,
            tone: 'cyan',
            dashed: true,
            label: 'Relocation Recoil',
          },
        ],
        whatToLookFor:
          'Notice the Right Patella shifted laterally over the outer trochlear wall in 3D AND the crimson lateral subluxation trajectory drawn over the Axial MRI. Drag the Reduction slider to snap it back.',
        diagnosticRules: [
          'Axial MRI evaluates lateral patellar tilt/subluxation relative to a shallow or dysplastic trochlear groove.',
          'Assess TT-TG (tibial tubercle to trochlear groove) distance (> 20 mm abnormal).',
        ],
        pitfallAndHook:
          'Clinical Reality: Almost all patellar dislocations relocate spontaneously on scene — MRI catches the "crime scene footprints" afterward!',
      },
      {
        id: 'pat-mpfl',
        label: '2. Torn Medial Patellofemoral Ligament',
        focusStructure: 'Patella',
        targetRasOverride: [96.0, 52.0, 23.0],
        targetBadge: 'Torn MPFL Band (Medial)',
        viewMode3D: 'solid',
        cameraPreset: 'medial',
        cameraDistanceScale: 1.05,
        mriPlane: 'axial',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.45,
        flexionDeg: 6,
        patellaSubluxation: 0.65,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [106.0, 64.0, 23.0],
              [99.0, 57.0, 23.0],
              [94.5, 51.0, 23.0],
              [87.0, 44.0, 23.0],
            ],
            tone: 'crimson',
            widthPx: 3.4,
            label: 'Torn MPFL (Medial Retinaculum)',
          },
          {
            kind: 'edema',
            centerRas: [96.0, 54.0, 23.0],
            radiusMm: 6.0,
            tone: 'crimson',
          },
          {
            kind: 'arrow',
            fromRas: [118.0, 67.0, 23.0],
            toRas: [137.0, 60.0, 23.0],
            tone: 'amber',
            label: 'Lateral Pull',
          },
        ],
        whatToLookFor:
          'On the medial patellar border in 3D and Axial MRI, follow the torn crimson MPFL band stretched across the medial gutter toward the femoral adductor tubercle.',
        diagnosticRules: [
          'MPFL tears occur in > 90% of first-time lateral patellar dislocations (commonly femoral origin, midsubstance, or patellar avulsion).',
          'Check vastus medialis obliquus (VMO) elevation and fluid tracking along the torn retinaculum.',
        ],
        pitfallAndHook:
          'Memory Hook: Patella always dislocates LATERALLY, so it tears the MEDIAL tether (MPFL) and slams its MEDIAL facet into the LATERAL condyle!',
      },
      {
        id: 'pat-kissing',
        label: '3. Medial Patella + Lat. Condyle Bruises',
        focusStructure: 'Femur',
        targetRasOverride: [122.0, 55.0, 17.0],
        targetBadge: 'Dislocation Kissing Bruises',
        viewMode3D: 'joint-interior',
        cameraPreset: 'anterior',
        cameraDistanceScale: 1.06,
        mriPlane: 'axial',
        mriContrast: 'trabecular',
        mriZoom: 1.35,
        flexionDeg: 6,
        patellaSubluxation: 0.35,
        mriAnnotations: [
          {
            kind: 'edema',
            centerRas: [107.0, 62.0, 17.0],
            radiusMm: 6.5,
            tone: 'crimson',
            label: 'Inferomedial Patella Bruise',
          },
          {
            kind: 'edema',
            centerRas: [137.0, 48.0, 17.0],
            radiusMm: 8.5,
            tone: 'crimson',
            label: 'Anterolateral Condyle Bruise',
          },
          {
            kind: 'arrow',
            fromRas: [136.0, 49.0, 17.0],
            toRas: [109.0, 61.0, 17.0],
            curved: 0.16,
            tone: 'amber',
            label: 'Kissing Contusion Pair',
          },
        ],
        whatToLookFor:
          'Compare BOTH Axial MRI and translucent 3D: the Inferomedial Patellar Facet smashes into the Anterolateral Femoral Condyle as the kneecap snaps back over the lateral wall.',
        diagnosticRules: [
          'Pathognomonic Kissing Contusion Pair: Inferomedial patella + Anterolateral non-weight-bearing femoral condyle.',
          'Always hunt inside the joint fluid for a displaced osteochondral loose fragment sheared off the medial patellar facet!',
        ],
        pitfallAndHook:
          'Compare Bruise Zones: ACL Pivot-Shift hits the WEIGHT-BEARING lateral sulcus/posterior tibia; Patellar Dislocation hits the ANTEROLATERAL trochlear rim + MEDIAL patella!',
      },
    ],
    mriChecklist: [
      'Kissing bone bruises: inferomedial patella + anterolateral femoral condyle.',
      'MPFL tear / avulsion on axial slices + VMO elevation.',
      'Hunt for intra-articular osteochondral loose body + trochlear dysplasia.',
    ],
    boardPearls: [
      {
        exam: 'Location Differentiator',
        pearl: 'Anterolateral femoral trochlear bruise (high/anterior) + medial patella = Patellar Dislocation. Weight-bearing condylopatellar sulcus + posterolateral tibia = ACL!',
      },
    ],
  },
  {
    id: 'chondral-oa',
    order: 17,
    category: 'pathology',
    title: 'Chondral Wear & OA Thickness',
    shortTitle: 'Chondral & OA Map',
    tag: '3D Pathology',
    diagnosticSign: 'Quantitative mm Map · Outerbridge / ICRS',
    summary:
      'Quantitative Stanford OpenMSK 3T qDESS cartilage thickness biomarkers (0.0–3.8 mm, BScore -0.203) paired with Modified Outerbridge / ICRS lesion grading.',
    subSteps: [
      {
        id: 'oa-map',
        label: '1. Quantitative Chondral Map (mm)',
        focusStructure: 'FemoralCartilage',
        targetBadge: 'OpenMSK Thickness (0–3.8 mm)',
        viewMode3D: 'cartilage-map',
        cameraPreset: 'anterior',
        cameraDistanceScale: 1.05,
        mriPlane: 'sagittal',
        mriContrast: 'chondral',
        mriZoom: 1.3,
        flexionDeg: 28,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [112.6, 56.0, 26.0],
            toRas: [112.6, 50.0, 21.0],
            tone: 'cyan',
            label: '2.40 mm Patellar Peak',
          },
        ],
        whatToLookFor:
          'Inspect real per-vertex cartilage thickness across the knee: sapphire blue (>= 3.0 mm) at central trochlea/patellar ridge vs amber/crimson thinning (< 1.2 mm) along margins.',
        diagnosticRules: [
          'OpenMSK Baseline Means: Patellar 2.40 mm, Ant. Femoral 2.25 mm, Med. Tibial 1.95 mm, Med. Weight-Bearing Femoral 1.73 mm.',
          'OA Bone Shape Score (BScore -0.203) quantifies subchondral bone shape risk relative to healthy population norms.',
        ],
        pitfallAndHook:
          'Reading Tip: Scroll flexion to 30°–50° in Cartilage Map mode to expose the entire weight-bearing femoral condyles out from behind the patella!',
      },
      {
        id: 'oa-icrs',
        label: '2. Focal Defect Grading (Outerbridge)',
        focusStructure: 'FemoralCartilage',
        targetRasOverride: [91.0, 22.0, -14.0],
        targetBadge: 'Medial Weight-Bearing Fissure Site',
        viewMode3D: 'cartilage-map',
        cameraPreset: 'medial',
        cameraDistanceScale: 1.05,
        mriPlane: 'coronal',
        mriContrast: 'chondral',
        mriZoom: 1.45,
        flexionDeg: 18,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [91.0, 22.0, -12.0],
              [91.0, 22.0, -15.6],
            ],
            tone: 'crimson',
            widthPx: 3.4,
            label: 'Outerbridge III–IV Fissure',
          },
        ],
        whatToLookFor:
          'Inspect the crimson Outerbridge defect target ring on the weight-bearing medial femoral condyle — notice sharp cartilage fissure tracking down to subchondral bone.',
        diagnosticRules: [
          'Grade I: focal signal blistering / softening with intact surface.',
          'Grade II: < 50% partial-thickness defect; Grade III: > 50% depth without bare bone; Grade IV: full-thickness to subchondral bone + marrow edema.',
        ],
        pitfallAndHook:
          'Always Confirm in 2 Planes: Magic-angle blur mimics Grade I/II thinning on a single oblique cut — verify on orthogonal Coronal + Sagittal!',
      },
      {
        id: 'oa-subchondral',
        label: '3. Subchondral Cyst & Osteophyte Clues',
        focusStructure: 'MedialTibialCartilage',
        targetRasOverride: [89.5, 24.8, -19.2],
        targetBadge: 'Subchondral Bone Plate',
        viewMode3D: 'cartilage-map',
        cameraPreset: 'medial',
        cameraDistanceScale: 1.06,
        mriPlane: 'coronal',
        mriContrast: 'trabecular',
        mriZoom: 1.45,
        flexionDeg: 4,
        mriAnnotations: [
          {
            kind: 'edema',
            centerRas: [89.5, 24.8, -22.0],
            radiusMm: 7.5,
            tone: 'crimson',
            label: 'Subchondral BML & Cyst',
          },
        ],
        whatToLookFor:
          'Check beneath thin cartilage in Bone Marrow window for focal subchondral cysts, bright edema (BML), or marginal osteophytes that lock OA severity.',
        diagnosticRules: [
          'Subchondral bone marrow lesions (BMLs) beneath chondral loss strongly correlate with clinical knee pain and rapid OA progression.',
          'Always look simultaneously for medial meniscal extrusion driving medial compartment wear.',
        ],
        pitfallAndHook:
          'Retention Hook: "No Grade IV cartilage loss sits quietly — it almost always leaves reactive subchondral marrow edema or a cyst underneath!"',
      },
    ],
    mriChecklist: [
      'Inspect retropatellar median ridge, trochlea, and weight-bearing condyles.',
      'Grade focal defects (< 50% = II, > 50% = III, full-thickness = IV).',
      'Correlate chondral thinning with meniscal extrusion and subchondral marrow edema.',
    ],
    boardPearls: [
      {
        exam: 'Cartilage Window Rule',
        pearl: 'A wider upper W/L ceiling prevents hyperintense qDESS/FLASH cartilage from blowing out to flat white so superficial blisters remain visible.',
      },
    ],
  },
  {
    id: 'ramp-wrisberg',
    order: 18,
    category: 'pathology',
    title: 'Posteromedial Ramp & Wrisberg Rip',
    shortTitle: 'Ramp & Wrisberg Rip',
    tag: '3D Pathology',
    diagnosticSign: 'ACL-Associated PHMM Capsular Separation · Lateral Zip Tear',
    summary:
      'Two easily overlooked peripheral meniscal injuries strongly linked to acute ACL rupture: posteromedial meniscocapsular ramp separation and longitudinal Wrisberg rip tears extending medial to the popliteal hiatus.',
    biomechControl: 'flexion',
    subSteps: [
      {
        id: 'ramp-cleft',
        label: '1. Posteromedial Ramp Cleft',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [87.0, 2.5, -17.5],
        targetBadge: 'Posteromedial Ramp Junction',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'posterior',
        cameraDistanceScale: 1.08,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.45,
        flexionDeg: 14,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [87.0, 1.0, -14.5],
              [87.0, 2.2, -20.5],
            ],
            tone: 'crimson',
            widthPx: 3.0,
            label: 'Ramp Fluid Cleft (SMJ)',
          },
          {
            kind: 'edema',
            centerRas: [87.0, 5.5, -24.5],
            radiusMm: 7.5,
            tone: 'amber',
            label: 'PM Tibia Margin Bruise',
          },
        ],
        whatToLookFor:
          'Look along the posterior peripheral margin of the medial meniscus on fluid-sensitive sagittal images for thin linear fluid filling the meniscocapsular separation behind the posterior horn.',
        diagnosticRules: [
          'Thin bright fluid cleft or complete meniscotibial ligament stripping between the PHMM and posteromedial capsule.',
          'Often accompanied by a characteristic posteromedial tibial plateau contrecoup marrow contusion.',
        ],
        pitfallAndHook:
          'Hidden behind the posterior tibial horn at arthroscopy: MRI warning prompts an accessory posteromedial portal to prevent graft stretching.',
      },
      {
        id: 'ramp-acl-companion',
        label: '2. ACL Graft Failure Risk',
        focusStructure: 'ACL',
        targetBadge: 'Unstable ACL + PHMM Junction',
        viewMode3D: 'joint-interior',
        cameraPreset: 'notch',
        cameraDistanceScale: 1.06,
        mriPlane: 'sagittal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.35,
        flexionDeg: 25,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [112.5, 36.0, 9.5],
            toRas: [112.5, 25.0, -2.0],
            tone: 'crimson',
            label: 'ACL Instability Load',
          },
        ],
        whatToLookFor:
          'Because the posterior horn of the medial meniscus acts as a primary brake against anterior tibial translation, an unrepaired ramp lesion leaves persistent rotatory laxity even after ACL reconstruction.',
        diagnosticRules: [
          'Check every acute ACL tear systematically along the entire posteromedial corner on sagittal fluid-sensitive slices.',
          'Fluid-interposed clefts (> 1–2 mm) or meniscocapsular irregularity require repair.',
        ],
        pitfallAndHook:
          'Routine supine neutral extension may reduce the cleft and hide fluid—look carefully for irregularity of the posterior meniscocapsular cortex.',
      },
      {
        id: 'wrisberg-rip',
        label: '3. Wrisberg Zip Tear',
        focusStructure: 'LateralMeniscus',
        targetRasOverride: [130.5, 7.5, -14.5],
        targetBadge: 'Wrisberg Zip Tear Zone',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'posterior',
        cameraDistanceScale: 1.08,
        mriPlane: 'sagittal',
        mriContrast: 'meniscus-cruciate',
        mriZoom: 1.45,
        flexionDeg: 10,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [130.5, 7.2, -11.5],
              [130.5, 9.2, -16.8],
            ],
            tone: 'crimson',
            widthPx: 3.0,
            label: 'Longitudinal Zip Cleft',
          },
        ],
        whatToLookFor:
          'Examine the posterior horn of the lateral meniscus near the notch where the meniscofemoral ligament of Wrisberg attaches. Sudden traction during pivot-shift tears a longitudinal vertical split.',
        diagnosticRules: [
          'Vertical longitudinal tear in the PHLM located within ~14 mm of the PCL insertion where the Wrisberg ligament inserts.',
          'Trace carefully on coronal and sagittal slices to distinguish from the normal Wrisberg insertion cleft.',
        ],
        pitfallAndHook:
          'The normal oblique low-signal Wrisberg band creates a fat/synovial interface at the superolateral posterior horn; a true zip tear extends vertically into the meniscus body.',
      },
    ],
    mriChecklist: [
      'Inspect the posteromedial meniscocapsular junction on every acute ACL tear.',
      'Look for posteromedial tibial plateau marrow contusion behind the medial meniscus.',
      'Screen the lateral posterior horn medial to the popliteal hiatus for a Wrisberg zip tear.',
    ],
    boardPearls: [
      {
        exam: 'Stability Rule',
        pearl: 'Present in 15–25% of ACL ruptures; missed ramp lesions are a leading cause of persistent anteroposterior instability after ACL surgery.',
      },
    ],
  },
  {
    id: 'sifk-hoffa',
    order: 19,
    category: 'pathology',
    title: 'SIFK & Hoffa Impingement',
    shortTitle: 'SIFK & Hoffa Edema',
    tag: '3D Pathology',
    diagnosticSign: 'Subchondral Crescent Line · Superolateral Hoffa Edema',
    summary:
      'High-yield non-ligamentous pain generators often misdiagnosed on knee MRI: spontaneous subchondral insufficiency fracture of the knee (SIFK) following root failure, and superolateral Hoffa fat pad impingement.',
    subSteps: [
      {
        id: 'sifk-crescent',
        label: '1. Subchondral Crescent',
        focusStructure: 'Femur',
        targetRasOverride: [90.5, 19.0, -5.5],
        targetBadge: 'Medial Condyle SIFK',
        viewMode3D: 'solid',
        cameraPreset: 'medial',
        cameraDistanceScale: 1.06,
        mriPlane: 'coronal',
        mriContrast: 'trabecular',
        mriZoom: 1.4,
        flexionDeg: 4,
        mriAnnotations: [
          {
            kind: 'cleft',
            pointsRas: [
              [84.5, 19.0, -6.8],
              [90.5, 19.0, -7.8],
              [96.5, 19.0, -6.5],
            ],
            tone: 'crimson',
            widthPx: 2.8,
            label: 'Low-Signal Fracture Crescent',
          },
          {
            kind: 'edema',
            centerRas: [90.5, 19.0, 2.0],
            radiusMm: 10.5,
            tone: 'amber',
            label: 'Disproportionate Condylar BML',
          },
        ],
        whatToLookFor:
          'Directly beneath the weight-bearing medial femoral condyle articular cortex, search for a thin serpiginous dark line paralleling the articular surface surrounded by extensive marrow edema.',
        diagnosticRules: [
          'Curvilinear hypointense subchondral fracture line <= 3 mm below the weight-bearing articular cortex.',
          'Massive disproportionate bone marrow edema filling much of the condyle is classic for SIFK.',
        ],
        pitfallAndHook:
          'Unlike classic AVN (SONK misnomer), SIFK lacks a serpentine geographic rim or double-line sign in its early stage—check for an extruded medial meniscal root!',
      },
      {
        id: 'sifk-root-link',
        label: '2. Root Overload Mechanism',
        focusStructure: 'MedialMeniscus',
        targetRasOverride: [81.0, 20.0, -16.5],
        targetBadge: 'Meniscal Overload Trigger',
        viewMode3D: 'plateau-topdown',
        cameraPreset: 'plateau',
        cameraDistanceScale: 1.06,
        mriPlane: 'coronal',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.35,
        flexionDeg: 6,
        mriAnnotations: [
          {
            kind: 'arrow',
            fromRas: [84.0, 20.0, -16.5],
            toRas: [77.5, 20.0, -16.5],
            tone: 'amber',
            label: '> 3 mm Meniscal Extrusion',
          },
        ],
        whatToLookFor:
          'Loss of meniscal hoop stress from a medial posterior root tear or partial meniscectomy concentrates axial load directly onto bare subchondral bone, precipitating trabecular microfracture.',
        diagnosticRules: [
          'Measure coronal meniscal extrusion past the medial tibial margin (> 3 mm).',
          'Assess articular surface contour for flattening or subchondral collapse (> 4 mm predicts poor non-operative prognosis).',
        ],
        pitfallAndHook:
          'Reporting SIFK early while articular contour remains convex enables protected non-weight-bearing offloading before irreversible collapse occurs.',
      },
      {
        id: 'hoffa-impingement',
        label: '3. Superolateral Hoffa Edema',
        focusStructure: 'PatellarTendon',
        targetRasOverride: [128.0, 44.0, 12.0],
        targetBadge: 'Superolateral Hoffa Fat Pad',
        viewMode3D: 'solid',
        cameraPreset: 'lateral',
        cameraDistanceScale: 1.08,
        mriPlane: 'axial',
        mriContrast: 'qdess-clinical',
        mriZoom: 1.35,
        flexionDeg: 8,
        mriAnnotations: [
          {
            kind: 'edema',
            centerRas: [129.0, 45.0, 12.0],
            radiusMm: 7.5,
            tone: 'amber',
            label: 'Patellar Tendon–Condyle Pinch',
          },
        ],
        whatToLookFor:
          'Check the superolateral corner of Hoffa’s infrapatellar fat pad pinched strictly between the lateral border of the patellar tendon and the anterolateral femoral condyle.',
        diagnosticRules: [
          'Focal bright fluid-sensitive edema strictly localized to the superolateral corner of Hoffa’s fat pad.',
          'Often associated with patella alta, increased TT-TG distance, and lateral patellar facet chondromalacia.',
        ],
        pitfallAndHook:
          'Do not overlook focal superolateral Hoffa edema when menisci and ligaments are normal—it explains anterior lateral knee pain in young runners and maltrackers.',
      },
    ],
    mriChecklist: [
      'Trace the weight-bearing medial femoral condyle subchondral plate for a dark crescentic SIFK line.',
      'Check if condylar marrow edema is paired with a posterior medial meniscal root tear or > 3 mm extrusion.',
      'Always clear the superolateral Hoffa corner between patellar tendon and lateral trochlea for friction edema.',
    ],
    boardPearls: [
      {
        exam: 'SIFK vs AVN',
        pearl: 'Focal linear dark subchondral band paralleling the condyle with huge edema and a torn medial root = SIFK; serpentine sclerotic double-line border = osteonecrosis.',
      },
    ],
  },
];

// Keep backward-compatible export name for existing tests/helpers
export const KNEE_CHAPTERS = KNEE_MODULES;

export const RESIDENT_QUIZ_QUESTIONS: ResidentQuizQuestion[] = [
  {
    id: 'q1-locate-acl',
    kind: 'locate',
    prompt: 'Click directly on the Anterior Cruciate Ligament (ACL) on the Sagittal 3T MRI or 3D Knee (or choose below):',
    hint: 'Follow the striated band parallel to Blumensaat’s intercondylar roof.',
    moduleId: 'approach-sag-cruciates',
    viewMode3D: 'joint-interior',
    cameraPreset: 'notch',
    mriPlane: 'sagittal',
    mriContrast: 'qdess-clinical',
    mriZoom: 1.35,
    flexionDeg: 4,
    targetStructure: 'ACL',
    targetBadge: 'ACL',
    options: [
      { id: 'ACL', label: 'ACL (Anterior Cruciate)' },
      { id: 'PCL', label: 'PCL (Posterior Cruciate)' },
      { id: 'PatellarTendon', label: 'Patellar Tendon' },
      { id: 'MedialMeniscus', label: 'Medial Meniscus' },
    ],
    correctOptionId: 'ACL',
    explanation:
      'The ACL runs straight and parallel to the intercondylar roof (Blumensaat’s line) from the posteromedial lateral condyle to the anterior tibia.',
  },
  {
    id: 'q2-locate-pcl',
    kind: 'locate',
    prompt: 'Pinpoint the Posterior Cruciate Ligament (PCL) directly on the 3T MRI or 3D Knee:',
    hint: 'Look for the thick (3–4 mm) uniformly black comma-shaped arc in the central notch.',
    moduleId: 'approach-sag-cruciates',
    viewMode3D: 'joint-interior',
    cameraPreset: 'posterior',
    mriPlane: 'sagittal',
    mriContrast: 'meniscus-cruciate',
    mriZoom: 1.35,
    flexionDeg: 8,
    targetStructure: 'PCL',
    targetBadge: 'PCL',
    options: [
      { id: 'ACL', label: 'ACL' },
      { id: 'PCL', label: 'PCL' },
      { id: 'LateralMeniscus', label: 'Lateral Meniscus' },
      { id: 'QuadricepsTendon', label: 'Quadriceps Tendon' },
    ],
    correctOptionId: 'PCL',
    explanation:
      'The PCL is thicker (~3–4 mm) and uniformly dark across sequences compared to the striated ACL, forming a smooth posterior arc.',
  },
  {
    id: 'q3-meniscus-rule',
    kind: 'vignette',
    prompt: 'Sagittal MRI shows bright high signal inside the posterior horn medial meniscus that does NOT touch the top or bottom surface. What is your call?',
    hint: 'Remember the Two-Slice Articular Surface Rule.',
    moduleId: 'approach-sequences',
    viewMode3D: 'plateau-topdown',
    cameraPreset: 'plateau',
    mriPlane: 'sagittal',
    mriContrast: 'meniscus-cruciate',
    mriZoom: 1.4,
    flexionDeg: 4,
    targetStructure: 'MedialMeniscus',
    targetRasOverride: [87.5, 9.5, -17.0],
    options: [
      { id: 'degen', label: 'Mucoid Degeneration (NOT a tear)' },
      { id: 'long', label: 'Acute Longitudinal Tear' },
      { id: 'bh', label: 'Displaced Bucket-Handle Tear' },
      { id: 'root', label: 'Complete Posterior Root Avulsion' },
    ],
    correctOptionId: 'degen',
    explanation:
      'Intrasubstance high signal that never reaches the superior or inferior articular surface (Grade 1/2) represents mucoid degeneration, not a tear.',
  },
  {
    id: 'q4-locate-mcl',
    kind: 'locate',
    prompt: 'On this Coronal 3T slice, click the Medial Collateral Ligament (MCL) — your landmark for measuring medial meniscal extrusion:',
    hint: 'On this Right Knee coronal view, anatomical Medial sits on the left side (radiological convention) / +X in 3D.',
    moduleId: 'approach-coronal',
    viewMode3D: 'solid',
    cameraPreset: 'medial',
    mriPlane: 'coronal',
    mriContrast: 'meniscus-cruciate',
    mriZoom: 1.35,
    flexionDeg: 4,
    targetStructure: 'MCL',
    targetBadge: 'MCL',
    options: [
      { id: 'MCL', label: 'MCL (Medial Collateral)' },
      { id: 'LCL', label: 'LCL (Fibular Collateral)' },
      { id: 'MedialMeniscus', label: 'Medial Meniscus' },
      { id: 'ACL', label: 'ACL' },
    ],
    correctOptionId: 'MCL',
    explanation:
      'The MCL spans from medial femoral epicondyle down to the proximal medial tibia ~5 cm below the joint line; always check medial extrusion <= 3 mm at this coronal level.',
  },
  {
    id: 'q5-double-pcl',
    kind: 'vignette',
    prompt: 'A locked knee shows only ONE sagittal bow-tie slice on the medial meniscus and a 3rd dark band anteroinferior to the PCL in the notch. Diagnosis?',
    hint: 'Check the "Only Two Structures Belong in the Notch" rule.',
    moduleId: 'bucket-handle',
    viewMode3D: 'joint-interior',
    cameraPreset: 'notch',
    mriPlane: 'sagittal',
    mriContrast: 'meniscus-cruciate',
    mriZoom: 1.4,
    flexionDeg: 10,
    targetStructure: 'PCL',
    mriAnnotations: [
      {
        kind: 'cleft',
        pointsRas: [
          [110.3, 29.0, -10.5],
          [110.3, 23.0, -15.2],
          [110.3, 16.5, -19.0],
        ],
        tone: 'crimson',
        widthPx: 3.2,
        label: 'Double PCL Fragment',
      },
    ],
    options: [
      { id: 'bh', label: 'Displaced Bucket-Handle Tear (Double PCL)' },
      { id: 'radial', label: 'Small Free-Edge Radial Tear' },
      { id: 'ramp', label: 'Isolated Posteromedial Ramp Lesion' },
      { id: 'normal-wrisberg', label: 'Normal Ligament of Wrisberg' },
    ],
    correctOptionId: 'bh',
    explanation:
      'Absent Bow-Tie (< 2 slices) proves donor meniscus truncation, ruling out a normal Humphry/Wrisberg ligament and confirming a flipped bucket-handle fragment (Double PCL Sign).',
  },
  {
    id: 'q6-pivot-bruises',
    kind: 'vignette',
    prompt: 'Where do the classic "kissing bone bruises" sit after an ACL pivot-shift injury — and how do they differ from transient patellar dislocation?',
    hint: 'Compare weight-bearing sulcus vs high anterolateral trochlear wall.',
    moduleId: 'acl-rupture',
    viewMode3D: 'joint-interior',
    cameraPreset: 'lateral',
    mriPlane: 'sagittal',
    mriContrast: 'trabecular',
    mriZoom: 1.3,
    flexionDeg: 25,
    targetStructure: 'Femur',
    mriAnnotations: [
      {
        kind: 'edema',
        centerRas: [135.0, 26.0, -5.0],
        radiusMm: 8.5,
        tone: 'crimson',
        label: 'Lat. Sulcus',
      },
      {
        kind: 'edema',
        centerRas: [135.0, 4.5, -17.5],
        radiusMm: 8.5,
        tone: 'crimson',
        label: 'PL Tibia',
      },
    ],
    options: [
      { id: 'acl-lat', label: 'Lat. femoral sulcus + posterolateral tibia (Patellar dislocation hits anterolateral condyle + medial patella)' },
      { id: 'med-both', label: 'Medial femoral condyle + posteromedial tibia' },
      { id: 'ant-tib', label: 'Anterior proximal tibia alone (Dashboard)' },
      { id: 'am-both', label: 'Anteromedial femur + medial tibia' },
    ],
    correctOptionId: 'acl-lat',
    explanation:
      'ACL pivot-shift bangs the mid/sulcus lateral femoral condyle into the posterolateral tibial plateau. Patellar dislocation hits the high anterolateral trochlear rim + inferomedial patella.',
  },
  {
    id: 'q7-locate-lcl-fibula',
    kind: 'locate',
    prompt: 'Click the Fibula (or LCL) on the Lateral aspect of this Right Knee — the primary anchor of the Posterolateral Corner (PLC):',
    hint: 'Look posterolaterally (viewer’s Left on Anterior 3D; right side of Coronal radiological slice).',
    moduleId: 'approach-coronal',
    viewMode3D: 'solid',
    cameraPreset: 'lateral',
    mriPlane: 'coronal',
    mriContrast: 'qdess-clinical',
    mriZoom: 1.3,
    flexionDeg: 4,
    targetStructure: 'Fibula',
    targetBadge: 'Fibula / PLC',
    options: [
      { id: 'Fibula', label: 'Proximal Fibula / LCL' },
      { id: 'Tibia', label: 'Proximal Tibia' },
      { id: 'Patella', label: 'Patella' },
      { id: 'MCL', label: 'MCL' },
    ],
    correctOptionId: 'Fibula',
    explanation:
      'The LCL and biceps femoris form the conjoint tendon attaching on the lateral fibular head; styloid avulsion ("arcuate sign") signals Posterolateral Corner injury.',
  },
  {
    id: 'q8-root-extrusion',
    kind: 'vignette',
    prompt: 'On the Coronal MCL-level slice, the medial meniscus protrudes 4.2 mm past the medial tibial rim and vanishes anterior to PCL on Sagittal. Most critical consequence?',
    hint: 'Think about hoop stress loss.',
    moduleId: 'posterior-root',
    viewMode3D: 'plateau-topdown',
    cameraPreset: 'medial',
    mriPlane: 'coronal',
    mriContrast: 'meniscus-cruciate',
    mriZoom: 1.4,
    flexionDeg: 6,
    targetStructure: 'MedialMeniscus',
    mriAnnotations: [
      {
        kind: 'caliper',
        aRas: [76.2, 21.0, -20.5],
        bRas: [71.0, 21.0, -20.5],
        tone: 'amber',
        label: '+4.2 mm Extrusion (> 3 mm)',
      },
    ],
    options: [
      { id: 'root', label: 'Medial Posterior Root Tear -> loss of hoop tension & rapid OA / SIFK' },
      { id: 'horiz', label: 'Benign parameniscal ganglion cyst without instability' },
      { id: 'lat', label: 'Discoid lateral meniscus variant' },
      { id: 'bakers', label: 'Popliteal Baker cyst neck rupture' },
    ],
    correctOptionId: 'root',
    explanation:
      'Extrusion > 3 mm + Sagittal "Ghost Sign" = Posterior Root Tear, functionally equivalent to total meniscectomy and rapidly triggering medial cartilage collapse / SIFK.',
  },
];

export function buildKneeFellowshipReport(
  moduleId: KneeModuleId,
  flexionDeg: number,
  anteriorDrawerMm: number
): FellowshipReport {
  const examHeader = 'MRI RIGHT KNEE WITHOUT IV CONTRAST (3.0 TESLA IN-VIVO 3D qDESS)';
  const technique =
    'In-vivo 3.0T 3D sagittal qDESS MRI of the Right Knee (0.3125 × 0.3125 × 1.0 mm, Stanford OpenMSK reference dataset; BScore -0.203) with multiplanar coronal and axial reconstructions.';

  if (moduleId.startsWith('normal-') || moduleId.startsWith('approach-')) {
    const findings = [
      {
        compartment: 'Menisci',
        text: 'Normal C-shaped medial (posterior horn > anterior horn) and symmetric O-shaped lateral menisci without articular surface tear, truncation, or extrusion (> 3 mm absent).',
      },
      {
        compartment: 'Cruciate Ligaments',
        text: 'Intact ACL parallel to Blumensaat’s roof (expected benign distal PD striations preserved) and thick uniformly dark PCL without redundant notch structures.',
      },
      {
        compartment: 'Collaterals & Extensor',
        text: 'Intact superficial/deep MCL, LCL, posterolateral corner, MPFL, quadriceps tendon, and patellar tendon.',
      },
      {
        compartment: 'Articular Cartilage & Marrow',
        text: 'Smooth hyaline cartilage (Patellar 2.40 mm, Femoral 1.73–2.25 mm, Med Tibial 1.95 mm, Lat Tibial 2.20 mm; BScore -0.203). No kissing bone bruises.',
      },
    ];
    const impression = ['Normal systematic 3.0T MRI examination of the right knee.'];
    const recommendation = 'No acute internal derangement.';
    return {
      examHeader,
      clinicalIndication: `Systematic Right knee MRI review (${flexionDeg}° flexion; AP drawer ${anteriorDrawerMm >= 0 ? '+' : ''}${anteriorDrawerMm} mm).`,
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  if (moduleId === 'meniscal-tears-3d') {
    const findings = [
      {
        compartment: 'Medial Meniscus Morphology',
        text: 'Abnormal intrameniscal signal extending to the articular surface on >= 2 consecutive slices (specify Longitudinal peripheral, Radial free-edge cleft, or Horizontal cleavage +/- parameniscal cyst).',
        abnormal: true,
      },
      {
        compartment: 'Lateral Compartment & Ligaments',
        text: 'Lateral meniscus, ACL, PCL, MCL, and LCL remain continuous without displaced notch fragment.',
      },
      {
        compartment: 'Cartilage & Marrow',
        text: 'Adjacent medial compartment hyaline cartilage preserved without subchondral insufficiency fracture.',
      },
      {
        compartment: 'Extensor Mechanism',
        text: 'Intact quadriceps tendon, patellar tendon, and MPFL.',
      },
    ];
    const impression = ['Tear of the posterior horn medial meniscus (specify orientation and articular surface extension).'];
    const recommendation = 'Orthopedic sports medicine correlation regarding peripheral repairability vs partial meniscectomy.';
    return {
      examHeader,
      clinicalIndication: 'Medial joint line pain and suspected meniscal tear.',
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  if (moduleId === 'bucket-handle') {
    const findings = [
      {
        compartment: 'Medial Compartment',
        text: 'Longitudinal tear of the medial meniscus with displaced inner handle flipped into the intercondylar notch anteroinferior to the PCL ("Double PCL sign"), leaving a truncated outer rim ("Absent Bow-Tie sign").',
        abnormal: true,
      },
      {
        compartment: 'Lateral Compartment',
        text: 'Lateral meniscus and lateral hyaline cartilage remain intact.',
      },
      {
        compartment: 'Cruciate & Collateral Ligaments',
        text: 'ACL, PCL, MCL, and posterolateral corner structures are continuous.',
      },
      {
        compartment: 'Extensor Mechanism & Marrow',
        text: 'Intact extensor mechanism without acute osseous fracture.',
      },
    ];
    const impression = ['Displaced bucket-handle tear of the medial meniscus of the right knee ("Double PCL sign").'];
    const recommendation = 'Urgent orthopedic sports medicine evaluation for arthroscopic reduction and repair.';
    return {
      examHeader,
      clinicalIndication: 'Acute locked right knee.',
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  if (moduleId === 'posterior-root') {
    const findings = [
      {
        compartment: 'Medial Compartment',
        text: 'Complete tear of the medial meniscus posterior root ("Ghost sign" immediately medial to PCL) with +4.2 mm medial radial extrusion beyond the tibial plateau margin at the MCL level.',
        abnormal: true,
      },
      {
        compartment: 'Cartilage & Marrow',
        text: 'Inspect weight-bearing medial femoral condyle closely for early subchondral insufficiency fracture (SIFK) due to hoop stress loss.',
        abnormal: true,
      },
      {
        compartment: 'Cruciates & Collaterals',
        text: 'ACL, PCL, MCL, and LCL intact.',
      },
      {
        compartment: 'Lateral Compartment',
        text: 'Lateral meniscus and cartilage intact.',
      },
    ];
    const impression = ['Complete medial meniscus posterior root tear with 4.2 mm radial extrusion.'];
    const recommendation = 'Orthopedic surgical evaluation for transtibial root repair to prevent rapid medial compartment OA.';
    return {
      examHeader,
      clinicalIndication: 'Posteromedial pain after deep flexion.',
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  if (moduleId === 'acl-rupture') {
    const findings = [
      {
        compartment: 'Cruciate Ligaments',
        text: `Complete midsubstance ACL rupture with discontinuity, horizontal flattening below Blumensaat's roof, and ${anteriorDrawerMm} mm anterior tibial translation at ${flexionDeg}° flexion.`,
        abnormal: true,
      },
      {
        compartment: 'Bone Marrow',
        text: 'Pivot-shift kissing marrow contusions in lateral femoral condylopatellar sulcus and posterolateral tibial plateau; evaluate lateral tibial rim for Segond avulsion.',
        abnormal: true,
      },
      {
        compartment: 'Menisci',
        text: 'Uncovered posterior horn of lateral meniscus; screen posteromedial periphery for ACL-associated Ramp lesion.',
      },
      {
        compartment: 'Collaterals & Extensor',
        text: 'MCL, LCL, and extensor mechanism intact.',
      },
    ];
    const impression = ['Complete acute rupture of the right ACL with pivot-shift bone marrow contusions.'];
    const recommendation = 'Orthopedic sports medicine consultation for ACL reconstruction planning.';
    return {
      examHeader,
      clinicalIndication: 'Non-contact pivot-shift injury with acute hemarthrosis.',
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  if (moduleId === 'pcl-dashboard') {
    const findings = [
      {
        compartment: 'Cruciate Ligaments',
        text: `Complete midsubstance PCL rupture with focal thickening (> 7 mm AP) and ${Math.abs(anteriorDrawerMm)} mm posterior tibial sag at ${flexionDeg}° flexion.`,
        abnormal: true,
      },
      {
        compartment: 'Bone Marrow',
        text: 'Dashboard-pattern anterior proximal tibial marrow contusion.',
        abnormal: true,
      },
      {
        compartment: 'Posterolateral Corner',
        text: 'Always correlate LCL, popliteus tendon, and fibular head ("arcuate sign") to exclude combined PCL/PLC injury.',
      },
      {
        compartment: 'Menisci & Extensor',
        text: 'Medial/lateral menisci and extensor mechanism intact.',
      },
    ];
    const impression = ['Complete rupture of the right PCL with posterior tibial translation.'];
    const recommendation = 'Clinical correlation for posterior drawer laxity and Posterolateral Corner stability.';
    return {
      examHeader,
      clinicalIndication: 'Anterior proximal tibial impact with flexed knee.',
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  if (moduleId === 'unhappy-triad') {
    const findings = [
      {
        compartment: 'Cruciate Ligaments',
        text: `Complete ACL disruption with ${anteriorDrawerMm} mm anterior tibial translation.`,
        abnormal: true,
      },
      {
        compartment: 'MCL & Menisci',
        text: 'Grade 3 superficial & deep MCL disruption plus peripheral meniscal tear (classically medial, acutely often lateral).',
        abnormal: true,
      },
      {
        compartment: 'Bone Marrow',
        text: 'Lateral compartment valgus impaction bruises alongside medial epicondylar edema.',
        abnormal: true,
      },
      {
        compartment: 'Posterolateral & Extensor',
        text: 'LCL and extensor mechanism intact.',
      },
    ];
    const impression = ['O’Donoghue Unhappy Triad (Right Knee): ACL rupture, Grade 3 MCL tear, and peripheral meniscal tear.'];
    const recommendation = 'Urgent sports medicine evaluation for combined ligamentous/meniscal management.';
    return {
      examHeader,
      clinicalIndication: 'Valgus and external rotation contact injury.',
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  if (moduleId === 'patellar-dislocation') {
    const findings = [
      {
        compartment: 'Patellofemoral & MPFL',
        text: 'Lateral patellar tilt/subluxation with complete disruption of the Medial Patellofemoral Ligament (MPFL).',
        abnormal: true,
      },
      {
        compartment: 'Bone Marrow & Cartilage',
        text: 'Characteristic kissing bone bruises on the inferomedial patellar facet and anterolateral femoral trochlear condyle; check joint space for sheared osteochondral loose bodies.',
        abnormal: true,
      },
      {
        compartment: 'Cruciates & Collaterals',
        text: 'ACL, PCL, MCL, and LCL intact.',
      },
      {
        compartment: 'Menisci',
        text: 'Medial and lateral menisci intact.',
      },
    ];
    const impression = ['Recent transient lateral patellar dislocation with MPFL disruption and classic kissing contusions.'];
    const recommendation = 'Orthopedic assessment for trochlear morphology, osteochondral fragments, and stabilization.';
    return {
      examHeader,
      clinicalIndication: 'Acute patellofemoral pain and instability.',
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  // chondral-oa
  const findings = [
    {
      compartment: 'Articular Cartilage',
      text: 'Quantitative OpenMSK cartilage evaluation (Patellar 2.40 mm, Femoral 1.73–2.25 mm, Med Tibial 1.95 mm, BScore -0.203); evaluate focal Outerbridge / ICRS defects in two orthogonal planes.',
      abnormal: true,
    },
    {
      compartment: 'Subchondral Marrow & Bone',
      text: 'Evaluate subchondral cysts, bone marrow edema lesions, and marginal osteophytes.',
    },
    {
      compartment: 'Menisci',
      text: 'Check meniscal extrusion and posterior root integrity beneath thinning compartment.',
    },
    {
      compartment: 'Ligaments',
      text: 'Cruciates and collaterals intact.',
    },
  ];
  const impression = ['Quantitative 3T chondral assessment; correlate focal defect depth with subchondral marrow status.'];
  const recommendation = 'Orthopedic correlation for chondroprotective vs cartilage restoration planning.';
  return {
    examHeader,
    clinicalIndication: 'Quantitative osteoarthritis & focal chondral evaluation.',
    technique,
    findings,
    impression,
    recommendation,
    dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
  };
}

function formatDictation(
  header: string,
  technique: string,
  findings: Array<{ compartment: string; text: string }>,
  impression: string[],
  recommendation: string
): string {
  const lines = [
    header,
    '',
    `TECHNIQUE: ${technique}`,
    '',
    'FINDINGS:',
    ...findings.map((f) => `- ${f.compartment}: ${f.text}`),
    '',
    'IMPRESSION:',
    ...impression.map((imp, i) => `${i + 1}. ${imp}`),
    '',
    `RECOMMENDATION: ${recommendation}`,
  ];
  return lines.join('\n');
}
