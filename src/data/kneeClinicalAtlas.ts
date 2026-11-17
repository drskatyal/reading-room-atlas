import type {
  FellowshipReport,
  KneeChapter,
  KneeChapterId,
  MriContrastPreset,
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
    defaultMin: 14,
    defaultMax: 222,
  },
  {
    id: 'meniscus-cruciate',
    label: 'Meniscus & Cruciate Window',
    shortLabel: 'Meniscus / ACL',
    spec: 'High-Contrast Fibrocartilage',
    defaultMin: 18,
    defaultMax: 148,
  },
  {
    id: 'chondral',
    label: 'Articular Chondral Window',
    shortLabel: 'Chondral',
    spec: 'Extended Hyaline Gradient',
    defaultMin: 35,
    defaultMax: 235,
  },
  {
    id: 'trabecular',
    label: 'Marrow & Cortex Window',
    shortLabel: 'Trabecular',
    spec: 'Subchondral & Bone Detail',
    defaultMin: 2,
    defaultMax: 115,
  },
];

export const STRUCTURES_INFO: Record<StructureId, StructureClinicalInfo> = {
  Femur: {
    id: 'Femur',
    labelIndex: 1,
    name: 'Distal Femur & Condyles (Right)',
    shortLabel: 'Femur',
    group: 'bone',
    mriSignal:
      'Sharp black subchondral cortical plate bounding water-suppressed trabecular marrow on 3T qDESS.',
    clinicalPearl:
      'Deepening of the lateral femoral condylopatellar sulcus (> 1.5–2.0 mm, "deep sulcus sign") is pathognomonic for ACL pivot-shift impaction.',
    attachmentSummary:
      'Posteromedial lateral condyle (ACL origin); anterolateral medial condyle (PCL origin).',
  },
  Tibia: {
    id: 'Tibia',
    labelIndex: 2,
    name: 'Proximal Tibia & Plateau (Right)',
    shortLabel: 'Tibia',
    group: 'bone',
    mriSignal:
      'Concave medial plateau vs convex lateral plateau with steeper posterior tibial slope.',
    clinicalPearl:
      'Posterolateral tibial plateau marrow edema paired with lateral femoral sulcus terminalis bruising confirms pivot-shift ACL rupture.',
    attachmentSummary: 'Intercondylar eminence anchors ACL anteriorly and PCL at posterior tibial facet.',
  },
  Fibula: {
    id: 'Fibula',
    labelIndex: 3,
    name: 'Proximal Fibula & Styloid',
    shortLabel: 'Fibula',
    group: 'bone',
    mriSignal:
      'Posterolateral cortical landmark supporting the fibular collateral and biceps femoris insertion.',
    clinicalPearl:
      'Arcuate sign (fibular styloid avulsion) indicates posterolateral corner injury; Segond avulsion sits just anterior on the lateral tibial rim.',
    attachmentSummary: 'LCL + biceps femoris conjoint tendon insert onto lateral fibular head.',
  },
  Patella: {
    id: 'Patella',
    labelIndex: 4,
    name: 'Patella',
    shortLabel: 'Patella',
    group: 'bone',
    mriSignal:
      'Broader flatter lateral facet versus steeper medial facet (Wiberg type II morphology).',
    clinicalPearl:
      'Transient lateral patellar dislocation leaves classic kissing contusions on the medial patellar facet and anterolateral femoral condyle.',
    attachmentSummary: 'Quadriceps tendon inserts superiorly; patellar tendon arises from inferior pole.',
  },
  FemoralCartilage: {
    id: 'FemoralCartilage',
    labelIndex: 5,
    name: 'Femoral Trochlear & Condylar Cartilage',
    shortLabel: 'Fem. Cartilage',
    group: 'cartilage',
    mriSignal:
      'Smooth hyperintense hyaline cartilage band on 3T qDESS (mean OpenMSK thickness 1.73–2.25 mm).',
    clinicalPearl:
      'Evaluate articular cartilage defects in two orthogonal planes using the modified Outerbridge / ICRS grading system.',
    attachmentSummary: 'Lines weight-bearing medial/lateral femoral condyles and trochlear groove.',
  },
  MedialTibialCartilage: {
    id: 'MedialTibialCartilage',
    labelIndex: 6,
    name: 'Medial Tibial Articular Cartilage',
    shortLabel: 'Med. Tib. Cart.',
    group: 'cartilage',
    mriSignal:
      'Hyperintense chondral carpet over concave medial plateau (OpenMSK mean 1.95 mm ± 0.54 mm).',
    clinicalPearl:
      'Meniscal extrusion > 3 mm from posterior root tear rapidly accelerates medial compartment chondral wear.',
    attachmentSummary: 'Covers central weight-bearing medial tibial plateau beneath medial meniscus.',
  },
  LateralTibialCartilage: {
    id: 'LateralTibialCartilage',
    labelIndex: 7,
    name: 'Lateral Tibial Articular Cartilage',
    shortLabel: 'Lat. Tib. Cart.',
    group: 'cartilage',
    mriSignal:
      'Thickened central apex over convex lateral tibial plateau (OpenMSK mean 2.20 mm ± 0.76 mm).',
    clinicalPearl:
      'Lateral meniscal discoid morphology predisposes to premature lateral tibial chondral delamination.',
    attachmentSummary: 'Covers lateral tibial plateau beneath the circular lateral meniscus.',
  },
  PatellarCartilage: {
    id: 'PatellarCartilage',
    labelIndex: 8,
    name: 'Patellar Retropatellar Cartilage',
    shortLabel: 'Pat. Cartilage',
    group: 'cartilage',
    mriSignal:
      'Thickest hyaline cartilage in the human body at median ridge (OpenMSK mean 2.40 mm, peak 3.7 mm).',
    clinicalPearl:
      'Chondromalacia patellae most commonly affects the median ridge and odd/medial facets; inspect axial views closely.',
    attachmentSummary: 'Articulates with femoral trochlea across 0°–90° knee flexion.',
  },
  MedialMeniscus: {
    id: 'MedialMeniscus',
    labelIndex: 9,
    name: 'Medial Meniscus (C-Shaped)',
    shortLabel: 'Med. Meniscus',
    group: 'meniscus',
    mriSignal:
      'Uniformly hypointense triangular fibrocartilage; posterior horn ~2× larger than anterior horn.',
    clinicalPearl:
      'Look for the "Absent Bow-Tie Sign" (< 2 consecutive sagittal bow-tie slices) and "Double PCL Sign" in displaced bucket-handle tears.',
    attachmentSummary: 'Firmly tethered to the deep MCL capsule; posterior root inserts medial to PCL.',
  },
  LateralMeniscus: {
    id: 'LateralMeniscus',
    labelIndex: 10,
    name: 'Lateral Meniscus (O-Shaped)',
    shortLabel: 'Lat. Meniscus',
    group: 'meniscus',
    mriSignal:
      'Symmetric dark anterior and posterior horns ("bow-tie" configuration on 2–3 sagittal slices).',
    clinicalPearl:
      'Avoid calling normal popliteal hiatus or meniscofemoral ligaments (Humphry/Wrisberg) a posterior horn lateral meniscal tear.',
    attachmentSummary: 'More mobile circular ring; separated posteriorly from LCL by popliteus tendon.',
  },
  ACL: {
    id: 'ACL',
    labelIndex: 11,
    name: 'Anterior Cruciate Ligament (ACL)',
    shortLabel: 'ACL',
    group: 'cruciate',
    mriSignal:
      'Striated low-to-intermediate taut fibers parallel to Blumensaat intercondylar roof line.',
    clinicalPearl:
      'Primary signs: discontinuity, horizontal angulation, focal T2 fluid gap. Secondary signs: > 5–7 mm anterior tibial translation & uncovered lateral meniscus.',
    attachmentSummary: 'Posteromedial lateral femoral condyle -> anteromedial tibial spine.',
  },
  PCL: {
    id: 'PCL',
    labelIndex: 12,
    name: 'Posterior Cruciate Ligament (PCL)',
    shortLabel: 'PCL',
    group: 'cruciate',
    mriSignal:
      'Thick, homogeneous, uniformly hypointense curved band (~3–4 mm thick) forming a gentle arc in extension.',
    clinicalPearl:
      'An extra low-signal band parallel and anteroinferior to the PCL in the notch is the classic "Double PCL Sign" of a medial bucket-handle tear.',
    attachmentSummary: 'Anterolateral medial femoral condyle -> posterior intercondylar tibial fossa.',
  },
  MCL: {
    id: 'MCL',
    labelIndex: 13,
    name: 'Medial Collateral Ligament (MCL)',
    shortLabel: 'MCL',
    group: 'collateral',
    mriSignal:
      'Thin taut dark band best evaluated on coronal views extending from medial epicondyle to proximal tibia.',
    clinicalPearl:
      'Grade 1 = periligamentous edema, intact fibers; Grade 2 = partial tearing; Grade 3 = complete disruption (inspect ACL + MM for Unhappy Triad).',
    attachmentSummary: 'Medial femoral epicondyle -> proximal anteromedial tibia (~5 cm below joint line).',
  },
  LCL: {
    id: 'LCL',
    labelIndex: 14,
    name: 'Lateral (Fibular) Collateral Ligament',
    shortLabel: 'LCL',
    group: 'collateral',
    mriSignal:
      'Cord-like taut hypointense band joining biceps femoris distally to form the conjoint tendon.',
    clinicalPearl:
      'Always inspect the fibular head, popliteus tendon, and popliteofibular ligament together as the Posterolateral Corner (PLC) stabilizers.',
    attachmentSummary: 'Lateral femoral epicondyle -> lateral aspect of fibular head.',
  },
  PatellarTendon: {
    id: 'PatellarTendon',
    labelIndex: 15,
    name: 'Patellar Tendon (Ligament)',
    shortLabel: 'Pat. Tendon',
    group: 'extensor',
    mriSignal:
      'Uniformly low-signal flat band (3–5 mm AP thickness); normal Insall-Salvati ratio 0.8–1.2.',
    clinicalPearl:
      'Jumper knee (proximal patellar tendinosis) causes focal posterior proximal thickening & hyperintensity right at the inferior patellar pole.',
    attachmentSummary: 'Inferior pole of patella -> anterior tibial tubercle.',
  },
  QuadricepsTendon: {
    id: 'QuadricepsTendon',
    labelIndex: 16,
    name: 'Quadriceps Tendon',
    shortLabel: 'Quad Tendon',
    group: 'extensor',
    mriSignal:
      'Classic trilaminar striated appearance on sagittal imaging from fused rectus/vastus aponeuroses.',
    clinicalPearl:
      'Full-thickness ruptures typically occur 1–2 cm proximal to the superior patellar pole with patella baja and buckled patellar tendon.',
    attachmentSummary: 'Distal quadriceps musculature -> superior pole of patella.',
  },
};

export const KNEE_CHAPTERS: KneeChapter[] = [
  {
    id: 'normal-anatomy',
    title: 'Normal 3T Anatomy & Screw-Home',
    shortTitle: 'Normal 3T',
    diagnosticSign: 'Intact Bow-Tie & Blumensaat Alignment',
    summary:
      'Inspect the in-vivo 3T qDESS Right Knee MRI alongside 16 anatomical structures and quantitative cartilage thickness (mm). Scrub flexion 0°–90° to observe physiological screw-home rotation.',
    defaultFlexionDeg: 4,
    defaultContrast: 'qdess-clinical',
    defaultPlane: 'sagittal',
    focusStructure: 'ACL',
    cameraPreset: 'anterior',
    mriChecklist: [
      'ACL fibers straight and taut parallel to Blumensaat intercondylar roof.',
      'PCL forms a smooth, uniformly hypointense arc without redundancy.',
      'Medial and lateral menisci show intact dark triangular horns on >= 2 sagittal slices.',
      'Hyaline cartilage forms a continuous, bright qDESS cap (BScore -0.20, normal OA risk).',
    ],
    boardPearls: [
      {
        exam: 'FRCR 2B / ABR Core',
        pearl:
          'Normal ACL shows mild distal striation (anteromedial vs posterolateral bundles) on thin-slice 3T sagittal scans; avoid overcalling mucoid degeneration unless the ligament is thickened (> 7 mm).',
      },
      {
        exam: 'MSK Fellowship',
        pearl:
          'During initial knee flexion (0°–25°), the Right tibia internally rotates to unlock the extended knee — reversing the terminal screw-home locking mechanism.',
      },
    ],
  },
  {
    id: 'bucket-handle',
    title: 'Bucket-Handle Medial Meniscus',
    shortTitle: 'Double PCL',
    diagnosticSign: 'Double PCL Sign + Absent Bow-Tie',
    summary:
      'A longitudinal tear flips the inner medial meniscal fragment into the intercondylar notch beneath the PCL, leaving a truncated peripheral rim.',
    defaultFlexionDeg: 10,
    defaultContrast: 'meniscus-cruciate',
    defaultPlane: 'sagittal',
    focusStructure: 'MedialMeniscus',
    cameraPreset: 'notch',
    mriChecklist: [
      'Absent Bow-Tie Sign: medial meniscus loses its normal >= 2-slice bow-tie configuration.',
      'Double PCL Sign: flipped fragment lies parallel and anteroinferior to the true PCL in the notch.',
      'Coronal view shows a diminutive medial body with a displaced fragment against the intercondylar wall.',
      'Check ACL integrity — bucket-handle tears frequently accompany chronic ACL deficiency.',
    ],
    boardPearls: [
      {
        exam: 'FRCR 2B Trap',
        pearl:
          'Do not confuse the anterior meniscofemoral ligament of Humphry with a displaced bucket-handle fragment; verify truncation of the donor meniscus.',
      },
      {
        exam: 'Surgical Impact',
        pearl:
          'Displaced bucket-handle tears cause mechanical knee locking and require urgent arthroscopic reduction and peripheral repair or partial meniscectomy.',
      },
    ],
  },
  {
    id: 'acl-rupture',
    title: 'Complete Acute ACL Rupture',
    shortTitle: 'ACL + Pivot Shift',
    diagnosticSign: 'Kissing Contusions + Anterior Drawer',
    summary:
      'Midsubstance ACL fiber disruption eliminates anteroposterior and rotatory constraint, producing valgus-internal rotation pivot-shift kissing bone contusions.',
    defaultFlexionDeg: 25,
    defaultContrast: 'qdess-clinical',
    defaultPlane: 'sagittal',
    focusStructure: 'ACL',
    cameraPreset: 'notch',
    mriChecklist: [
      'Complete fiber discontinuity and fluid-filled gap replacing normal taut ACL bands.',
      'Pivot-shift kissing marrow contusions: lateral femoral condyle sulcus terminalis + posterolateral tibial plateau.',
      'Uncovered posterior horn of lateral meniscus (> 7 mm anterior tibial translation).',
      'PCL buckling ("question-mark" verticality) and Segond lateral capsular avulsion fracture.',
    ],
    boardPearls: [
      {
        exam: 'ABR Core Classic',
        pearl:
          'Kissing contusions on the lateral femoral condyle (sulcus terminalis) + posterolateral tibial plateau = pathognomonic ACL pivot-shift injury.',
      },
      {
        exam: 'Lachman Kinematics',
        pearl:
          'Maximal anterior tibial translation occurs around 20°–30° knee flexion because the posterior joint capsule and hamstrings relax.',
      },
    ],
  },
  {
    id: 'posterior-root',
    title: 'Medial Posterior Root Tear & Extrusion',
    shortTitle: 'Root Extrusion',
    diagnosticSign: 'Ghost Sign + > 3 mm Extrusion',
    summary:
      'Disruption of the medial meniscus posterior root within 9 mm of its tibial attachment abolishes hoop stress, causing radial meniscal extrusion (> 3 mm) and accelerated medial chondral wear.',
    defaultFlexionDeg: 8,
    defaultContrast: 'meniscus-cruciate',
    defaultPlane: 'coronal',
    focusStructure: 'MedialMeniscus',
    cameraPreset: 'medial',
    mriChecklist: [
      'Sagittal "Ghost Sign": absent dark posterior root triangle immediately medial to the PCL.',
      'Coronal vertical linear cleft just medial to the PCL tibial attachment.',
      'Pathological radial extrusion (> 3 mm medially beyond the medial tibial plateau margin).',
      'Check medial femoral condyle weight-bearing zone for subchondral insufficiency fracture (SIFK).',
    ],
    boardPearls: [
      {
        exam: 'MSK Pearls',
        pearl:
          'A posterior root tear is biomechanically equivalent to a total meniscectomy because circumferential hoop tension is completely lost.',
      },
      {
        exam: 'Coronal Check',
        pearl:
          'Always measure meniscal extrusion on the coronal slice at the level of the MCL body; > 3 mm is abnormal.',
      },
    ],
  },
  {
    id: 'pcl-dashboard',
    title: 'Complete PCL Tear ("Dashboard")',
    shortTitle: 'PCL Tear',
    diagnosticSign: 'Posterior Tibial Sag (> 70° Flexion)',
    summary:
      'Posteriorly directed impact to the flexed proximal tibia ruptures the PCL midsubstance, permitting posterior tibial sag and posterolateral corner strain.',
    defaultFlexionDeg: 75,
    defaultContrast: 'meniscus-cruciate',
    defaultPlane: 'sagittal',
    focusStructure: 'PCL',
    cameraPreset: 'posterior',
    mriChecklist: [
      'Focal or diffuse disruption of the normally black PCL band with AP thickness > 7 mm or fluid gap.',
      'Posterior tibial sag relative to the posterior femoral condyles in flexion.',
      'Anterior tibial plateau & anterior femoral condyle dashboard contusions.',
      'Mandatory inspection of the Posterolateral Corner (LCL, popliteus, fibular head).',
    ],
    boardPearls: [
      {
        exam: 'FRCR 2B Pearl',
        pearl:
          'A torn PCL can still appear partially continuous ("pseudo-intact") due to intact meniscofemoral ligaments; check for focal thickening > 7 mm.',
      },
      {
        exam: 'Biomechanics',
        pearl:
          'Posterior tibial drawer instability peaks around 70°–90° flexion when the PCL is the primary restraint to posterior translation.',
      },
    ],
  },
  {
    id: 'unhappy-triad',
    title: "O'Donoghue Unhappy Triad",
    shortTitle: 'Unhappy Triad',
    diagnosticSign: 'ACL + MCL + Meniscus (Valgus-ER)',
    summary:
      'High-energy valgus + external rotation trauma tears the ACL and MCL alongside peripheral meniscal injury (historically medial, acutely often lateral).',
    defaultFlexionDeg: 22,
    defaultContrast: 'qdess-clinical',
    defaultPlane: 'coronal',
    focusStructure: 'MCL',
    cameraPreset: 'anterior',
    mriChecklist: [
      'Full-thickness midsubstance ACL disruption with anterior tibial translation.',
      'Grade 3 MCL tear with wavy/disrupted superficial & deep meniscocapsular fibers.',
      'Peripheral meniscal tear (medial or acute lateral posterior horn) with joint effusion.',
      'Lateral pivot-shift bone marrow edema + medial epicondylar avulsion edema.',
    ],
    boardPearls: [
      {
        exam: 'Board Classic',
        pearl:
          'O’Donoghue originally described ACL + MCL + Medial Meniscus, though arthroscopic series show acute lateral meniscal tears occur frequently at initial pivot-shift.',
      },
      {
        exam: 'Stability Priority',
        pearl:
          'Recognize Grade 3 MCL tears preoperatively; deep MCL / posteromedial corner laxity may require concurrent repair with ACL reconstruction.',
      },
    ],
  },
];

export function buildKneeFellowshipReport(
  chapterId: KneeChapterId,
  flexionDeg: number,
  anteriorDrawerMm: number
): FellowshipReport {
  const chapter = KNEE_CHAPTERS.find((c) => c.id === chapterId) ?? KNEE_CHAPTERS[0];

  const examHeader = 'MRI RIGHT KNEE WITHOUT IV CONTRAST (3.0 TESLA IN-VIVO 3D qDESS)';
  const technique =
    'In-vivo 3.0T 3D sagittal qDESS MRI of the Right Knee (0.3125 × 0.3125 × 1.0 mm, Stanford OpenMSK reference dataset; BScore -0.20) with multiplanar coronal and axial reconstructions.';

  if (chapterId === 'normal-anatomy') {
    const findings = [
      {
        compartment: 'Cruciate Ligaments',
        text: 'The ACL and PCL are intact with normal course, taut orientation, and uniform low signal intensity.',
      },
      {
        compartment: 'Menisci',
        text: 'The medial and lateral menisci demonstrate normal C- and O-shaped morphology without tear, truncation, or radial extrusion.',
      },
      {
        compartment: 'Collateral Ligaments & Extensor',
        text: 'The MCL, LCL, biceps femoris tendon, quadriceps tendon, and patellar tendon are intact.',
      },
      {
        compartment: 'Articular Cartilage & Marrow',
        text: 'Quantitative OpenMSK cartilage thickness is preserved across femoral (1.73–2.25 mm), medial tibial (1.95 mm), lateral tibial (2.20 mm), and patellar (2.40 mm) surfaces (BScore -0.20).',
      },
    ];
    const impression = ['Normal in-vivo 3T MRI examination of the right knee.'];
    const recommendation = 'No acute internal derangement or advanced osteoarthritis biomarker abnormality.';
    return {
      examHeader,
      clinicalIndication: `Routine Right knee 3T evaluation (${flexionDeg}° simulated flexion; drawer ${anteriorDrawerMm >= 0 ? '+' : ''}${anteriorDrawerMm} mm).`,
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  if (chapterId === 'bucket-handle') {
    const findings = [
      {
        compartment: 'Medial Compartment',
        text: 'Longitudinal tear of the medial meniscus with a displaced bucket-handle fragment flipped into the intercondylar notch anteroinferior to the PCL ("Double PCL sign"), leaving a truncated peripheral rim.',
        abnormal: true,
      },
      {
        compartment: 'Lateral Compartment',
        text: 'The lateral meniscus and lateral compartment hyaline cartilage (2.20 mm mean) are intact.',
      },
      {
        compartment: 'Cruciate & Collateral Ligaments',
        text: 'The ACL, PCL, MCL, and posterolateral corner structures remain continuous.',
      },
      {
        compartment: 'Extensor Mechanism & Marrow',
        text: 'Intact extensor mechanism; small reactive joint effusion without acute osseous fracture.',
      },
    ];
    const impression = [
      'Displaced bucket-handle tear of the medial meniscus of the right knee with flipped fragment in the intercondylar notch ("Double PCL sign").',
    ];
    const recommendation =
      'Prompt orthopedic sports medicine evaluation for arthroscopic reduction and meniscal repair vs partial meniscectomy.';
    return {
      examHeader,
      clinicalIndication: 'Acute locked right knee and medial joint line tenderness.',
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  if (chapterId === 'acl-rupture') {
    const findings = [
      {
        compartment: 'Cruciate Ligaments',
        text: `Complete midsubstance rupture of the ACL with fiber discontinuity, fluid-filled gap, and ${anteriorDrawerMm} mm anterior tibial translation at ${flexionDeg}° flexion. Secondary vertical buckling of the PCL.`,
        abnormal: true,
      },
      {
        compartment: 'Bone Marrow & Cartilage',
        text: 'Classic pivot-shift kissing bone marrow contusions involving the lateral femoral condyle sulcus terminalis and posterolateral tibial plateau.',
        abnormal: true,
      },
      {
        compartment: 'Menisci',
        text: 'Uncovering of the posterior horn of the lateral meniscus secondary to anterior tibial translation; evaluate peripheral ramp region closely.',
      },
      {
        compartment: 'Collateral Ligaments & Extensor',
        text: 'MCL, LCL, and extensor mechanism tendons remain intact; moderate hemarthrosis.',
      },
    ];
    const impression = [
      'Complete acute rupture of the right anterior cruciate ligament (ACL) with pivot-shift kissing marrow contusions.',
    ];
    const recommendation =
      'Orthopedic sports medicine consultation for ACL reconstruction planning and clinical stability correlation.';
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

  if (chapterId === 'posterior-root') {
    const findings = [
      {
        compartment: 'Medial Compartment',
        text: 'Full-thickness radial tear of the medial meniscus posterior root within 5 mm of its tibial insertion ("Ghost sign"), accompanied by 4.2 mm medial meniscal extrusion.',
        abnormal: true,
      },
      {
        compartment: 'Articular Cartilage & Marrow',
        text: 'Focal early cartilage thinning along the weight-bearing medial femoral condyle (1.73 mm baseline mean); evaluate for subchondral insufficiency edema.',
        abnormal: true,
      },
      {
        compartment: 'Cruciate & Collateral Ligaments',
        text: 'ACL, PCL, MCL, and LCL are intact without acute disruption.',
      },
      {
        compartment: 'Lateral Compartment & Extensor',
        text: 'Intact lateral meniscus and extensor mechanism.',
      },
    ];
    const impression = [
      'Complete tear of the right medial meniscus posterior root with 4.2 mm radial extrusion, resulting in functional loss of meniscal hoop tension.',
    ];
    const recommendation =
      'Orthopedic evaluation for transtibial pull-out root repair if chondral status and patient age permit.';
    return {
      examHeader,
      clinicalIndication: 'Posteromedial right knee pain after deep squat ("pop").',
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  if (chapterId === 'pcl-dashboard') {
    const findings = [
      {
        compartment: 'Cruciate Ligaments',
        text: `Complete midsubstance tear of the PCL with focal fluid-signal disruption and ${Math.abs(anteriorDrawerMm)} mm posterior tibial sag at ${flexionDeg}° flexion.`,
        abnormal: true,
      },
      {
        compartment: 'Bone Marrow',
        text: 'Dashboard-pattern bone marrow contusions along the anterior proximal tibia and inferior patellar/femoral pole.',
        abnormal: true,
      },
      {
        compartment: 'Posterolateral Corner & Collaterals',
        text: 'ACL, MCL, and LCL are intact; carefully exclude subtle popliteus or arcuate complex strain.',
      },
      {
        compartment: 'Menisci & Extensor',
        text: 'Medial and lateral menisci and extensor mechanism are intact.',
      },
    ];
    const impression = [
      'Complete rupture of the right posterior cruciate ligament (PCL) with posterior tibial translation.',
    ];
    const recommendation =
      'Orthopedic correlation with posterior drawer testing and clinical assessment of the posterolateral corner.';
    return {
      examHeader,
      clinicalIndication: 'Anterior proximal tibial impact with flexed right knee.',
      technique,
      findings,
      impression,
      recommendation,
      dictationText: formatDictation(examHeader, technique, findings, impression, recommendation),
    };
  }

  const findings = [
    {
      compartment: 'Cruciate Ligaments',
      text: `Complete midsubstance rupture of the ACL with ${anteriorDrawerMm} mm anterior tibial translation.`,
      abnormal: true,
    },
    {
      compartment: 'Medial Collateral & Meniscus',
      text: 'Grade 3 disruption of the superficial and deep MCL fibers alongside a peripheral medial meniscal tear (O’Donoghue Unhappy Triad).',
      abnormal: true,
    },
    {
      compartment: 'Bone Marrow',
      text: 'Lateral pivot-shift kissing contusions and medial epicondylar soft tissue edema.',
      abnormal: true,
    },
    {
      compartment: 'Lateral Compartment & Extensor',
      text: 'LCL and extensor mechanism intact; moderate joint effusion.',
    },
  ];
  const impression = [
    `O'Donoghue Unhappy Triad (Right Knee): Complete ACL rupture, Grade 3 MCL tear, and peripheral medial meniscal tear (${chapter.diagnosticSign}).`,
  ];
  const recommendation =
    'Urgent orthopedic sports medicine evaluation for staged or combined ligamentous and meniscal stabilization.';
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
