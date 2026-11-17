import type { StructuredReport } from '../types/radiology';

/* ============================================================================
 * MODULE 1: KNEE MRI STRUCTURED REPORT ENGINE
 * ========================================================================== */
export type KneePathology =
  | 'normal'
  | 'bucket-handle-medial'
  | 'acl-complete'
  | 'unhappy-triad'
  | 'posterior-horn-medial'
  | 'pcl-tear';

export interface KneeCaseInput {
  side: 'Right' | 'Left';
  pathology: KneePathology;
  effusion: 'None' | 'Small' | 'Moderate-Large';
  boneContusion: boolean;
  flexionDeg: number;
}

export function buildKneeReport(input: KneeCaseInput): StructuredReport {
  const { side, pathology, effusion, boneContusion } = input;

  const findings: string[] = [];
  const impression: string[] = [];
  let categoryBadge = 'Normal Internal Derangement Screen';
  let categoryTone: StructuredReport['categoryTone'] = 'normal';
  let recommendation = 'No acute surgical meniscal or ligamentous internal derangement.';

  if (pathology === 'normal') {
    findings.push(
      'Medial and lateral menisci demonstrate normal triangular morphology and homogeneous low signal without tear.',
      'Anterior and posterior cruciate ligaments are intact with normal course and signal intensity.',
      'Medial and lateral collateral ligament complexes and extensor mechanism are intact.',
      'Articular cartilage surfaces are preserved without focal full-thickness defect.'
    );
    impression.push(`Normal MRI of the ${side.toLowerCase()} knee without meniscal or ligamentous tear.`);
  } else if (pathology === 'bucket-handle-medial') {
    categoryBadge = 'Displaced Bucket-Handle Tear';
    categoryTone = 'critical';
    findings.push(
      'Medial meniscus demonstrates a longitudinal vertical tear with a large displaced fragment flipped into the intercondylar notch anterior to the PCL ("double PCL sign") and truncation of the body ("absent bow-tie sign").',
      'Lateral meniscus, ACL, PCL, MCL, and LCL remain intact.'
    );
    impression.push(
      `Displaced bucket-handle tear of the ${side.toLowerCase()} medial meniscus with fragment in the intercondylar notch (double PCL sign).`
    );
    recommendation = 'Prompt orthopedic sports medicine evaluation for arthroscopic reduction/repair versus partial meniscectomy.';
  } else if (pathology === 'acl-complete') {
    categoryBadge = 'Complete ACL Rupture';
    categoryTone = 'critical';
    findings.push(
      'Complete disruption of the anterior cruciate ligament (ACL) midsubstance with fiber discontinuity, wavy distal stump, and anterior tibial translation (> 7 mm).',
      'PCL, MCL, LCL, and posterolateral corner structures are intact.',
      boneContusion
        ? 'Characteristic pivot-shift bone marrow contusions involving the lateral femoral condyle (sulcus terminalis) and posterolateral tibial plateau.'
        : 'No acute osseous fracture or prominent pivot-shift marrow contusion.'
    );
    impression.push(
      `Complete tear of the ${side.toLowerCase()} anterior cruciate ligament${boneContusion ? ' with classic pivot-shift lateral compartment bone contusions' : ''}.`
    );
    recommendation = 'Orthopedic sports medicine consultation for ACL reconstruction planning and stability assessment.';
  } else if (pathology === 'unhappy-triad') {
    categoryBadge = "O'Donoghue Unhappy Triad";
    categoryTone = 'critical';
    findings.push(
      'Complete midsubstance rupture of the anterior cruciate ligament (ACL) with abnormal horizontal orientation of residual fibers.',
      'High-grade (Grade III) disruption of the superficial and deep medial collateral ligament (MCL) with surrounding periligamentous edema.',
      'Complex tear of the posterior horn and body of the medial meniscus (with medial meniscocapsular separation / ramp component).',
      boneContusion
        ? 'Impaction marrow edema along the lateral femoral condyle and posterolateral tibial plateau.'
        : 'Mild subchondral marrow edema.'
    );
    impression.push(
      `Acute valgus-external rotation injury ("O'Donoghue triad") of the ${side.toLowerCase()} knee: complete ACL tear, high-grade MCL tear, and medial meniscal tear.`
    );
    recommendation = 'Urgent orthopedic sports medicine referral for staged vs combined ligamentous/meniscal management.';
  } else if (pathology === 'posterior-horn-medial') {
    categoryBadge = 'Medial Meniscus Tear';
    categoryTone = 'warning';
    findings.push(
      'Oblique/horizontal tear of the posterior horn of the medial meniscus extending to the inferior articular surface, with a small adjacent parameniscal cyst.',
      'Lateral meniscus, ACL, PCL, and collateral ligaments are intact.'
    );
    impression.push(
      `Tear of the posterior horn of the ${side.toLowerCase()} medial meniscus with small parameniscal cyst.`
    );
    recommendation = 'Correlate clinically with medial joint-line tenderness and mechanical locking; conservative PT vs arthroscopy per symptoms.';
  } else if (pathology === 'pcl-tear') {
    categoryBadge = 'Complete PCL Tear';
    categoryTone = 'warning';
    findings.push(
      'Full-thickness disruption of the posterior cruciate ligament (PCL) at its midsubstance with posterior tibial sag and surrounding edema.',
      'Anterior cruciate ligament, menisci, and collateral complexes remain intact.',
      boneContusion
        ? 'Anterior tibial plateau dashboard-mechanism bone marrow contusion.'
        : 'No significant osseous contusion.'
    );
    impression.push(`Complete tear of the ${side.toLowerCase()} posterior cruciate ligament.`);
    recommendation = 'Orthopedic evaluation for posterior drawer laxity and potential posterolateral corner testing.';
  }

  findings.push(
    effusion === 'None'
      ? 'No significant joint effusion.'
      : `${effusion} suprapatellar joint effusion${pathology !== 'normal' ? ' (likely hemarthrosis in acute setting)' : ''}.`
  );

  return {
    title: `MRI ${side} Knee Without Contrast`,
    modality: 'MRI 3T (PD, T2-FS, T1)',
    categoryBadge,
    categoryTone,
    technique: `Multiplanar PD, T2-weighted fat-suppressed, and T1-weighted sequences of the ${side.toLowerCase()} knee.`,
    findings,
    impression,
    recommendation,
    metricsSummary: [
      { label: 'Laterality', value: side },
      { label: 'Flexion Sim', value: `${input.flexionDeg}°` },
      { label: 'Effusion', value: effusion },
      { label: 'Pivot Bruise', value: boneContusion ? 'Present' : 'Absent' },
    ],
  };
}

/* ============================================================================
 * MODULE 2: CAROTID DOPPLER SRU 2003 & SPENCER HEMODYNAMICS
 * ========================================================================== */
export interface CarotidInput {
  side: 'Right' | 'Left';
  stenosisPct: number; // 0..100 NASCET
  ccaPsv: number; // cm/s
  plaqueType: 'None' | 'Soft/Lipid' | 'Calcified' | 'Ulcerated';
  vertebralFlow: 'Antegrade' | 'Bidirectional (Pre-Steal)' | 'Reversed (Subclavian Steal)';
  nearOcclusionOverride?: boolean;
}

export interface CarotidHemodynamics {
  psv: number;
  edv: number;
  ratio: number;
  spencerFlowIndex: number; // 0..100% relative volume flow
  sruCategory:
    | 'Normal (< 50%)'
    | '< 50% Stenosis'
    | '50–69% Stenosis'
    | '≥ 70% to Near-Occlusion'
    | 'Near-Occlusion (String Sign)'
    | 'Total Occlusion';
  tone: StructuredReport['categoryTone'];
}

/**
 * Computes realistic physiological Doppler velocities from NASCET % stenosis
 * following the classic Spencer flow-velocity curve, including near-occlusion drop-off.
 */
export function computeSpencerHemodynamics(stenosisPct: number, ccaPsv: number): CarotidHemodynamics {
  const s = Math.max(0, Math.min(100, stenosisPct));
  let psv = 72;
  let edv = 22;
  let spencerFlowIndex = 100;

  if (s >= 99) {
    psv = 0;
    edv = 0;
    spencerFlowIndex = 0;
  } else if (s >= 94) {
    // Near-occlusion / string sign: severe trickle flow, velocity drops below peak
    const drop = (s - 94) / 5;
    psv = Math.round(310 - drop * 255);
    edv = Math.round(95 - drop * 80);
    spencerFlowIndex = Math.max(4, Math.round(28 * (1 - drop)));
  } else if (s >= 70) {
    // Steep exponential acceleration along Spencer curve
    const t = (s - 70) / 24;
    psv = Math.round(235 + t * 235);
    edv = Math.round(102 + t * 88);
    spencerFlowIndex = Math.round(78 - t * 48);
  } else if (s >= 50) {
    const t = (s - 50) / 20;
    psv = Math.round(132 + t * 98);
    edv = Math.round(42 + t * 54);
    spencerFlowIndex = Math.round(94 - t * 16);
  } else {
    const t = s / 50;
    psv = Math.round(68 + t * 48);
    edv = Math.round(20 + t * 16);
    spencerFlowIndex = Math.round(100 - t * 6);
  }

  const ratio = ccaPsv > 0 ? Number((psv / ccaPsv).toFixed(2)) : 0;

  // SRU 2003 Consensus Stratification
  let sruCategory: CarotidHemodynamics['sruCategory'] = 'Normal (< 50%)';
  let tone: StructuredReport['categoryTone'] = 'normal';

  if (s >= 99 || (psv === 0 && edv === 0)) {
    sruCategory = 'Total Occlusion';
    tone = 'critical';
  } else if (s >= 94) {
    sruCategory = 'Near-Occlusion (String Sign)';
    tone = 'critical';
  } else if (psv >= 230 || ratio >= 4.0 || edv >= 100) {
    sruCategory = '≥ 70% to Near-Occlusion';
    tone = 'critical';
  } else if (psv >= 125 || ratio >= 2.0 || edv >= 40) {
    sruCategory = '50–69% Stenosis';
    tone = 'warning';
  } else if (s > 15) {
    sruCategory = '< 50% Stenosis';
    tone = 'info';
  }

  return { psv, edv, ratio, spencerFlowIndex, sruCategory, tone };
}

export function classifySruDirect(psv: number, edv: number, ccaPsv: number, nearOcclusion = false, totalOcclusion = false): {
  category: CarotidHemodynamics['sruCategory'];
  ratio: number;
  tone: StructuredReport['categoryTone'];
} {
  const ratio = ccaPsv > 0 ? Number((psv / ccaPsv).toFixed(2)) : 0;
  if (totalOcclusion || (psv === 0 && edv === 0)) {
    return { category: 'Total Occlusion', ratio, tone: 'critical' };
  }
  if (nearOcclusion) {
    return { category: 'Near-Occlusion (String Sign)', ratio, tone: 'critical' };
  }
  if (psv >= 230 || ratio >= 4.0 || edv >= 100) {
    return { category: '≥ 70% to Near-Occlusion', ratio, tone: 'critical' };
  }
  if (psv >= 125 || ratio >= 2.0 || edv >= 40) {
    return { category: '50–69% Stenosis', ratio, tone: 'warning' };
  }
  return { category: '< 50% Stenosis', ratio, tone: 'normal' };
}

export function buildCarotidReport(input: CarotidInput, hemo: CarotidHemodynamics): StructuredReport {
  const findings: string[] = [
    `${input.side} CCA demonstrates normal antegrade flow with PSV of ${input.ccaPsv} cm/s.`,
    input.plaqueType === 'None'
      ? `No sonographically significant atherosclerotic plaque at the ${input.side.toLowerCase()} carotid bulb or proximal ICA.`
      : `${input.plaqueType} atherosclerotic plaque identified at the ${input.side.toLowerCase()} carotid bifurcation/proximal ICA causing ~${input.stenosisPct}% NASCET diameter narrowing.`,
  ];

  if (hemo.sruCategory === 'Total Occlusion') {
    findings.push(
      `Absent color and spectral Doppler flow within the ${input.side.toLowerCase()} proximal ICA consistent with complete occlusion. Compensatory elevated resistance may be seen in the ipsilateral CCA.`
    );
  } else if (hemo.sruCategory === 'Near-Occlusion (String Sign)') {
    findings.push(
      `Markedly narrowed residual color lumen ("string sign") in the proximal ICA with dampened/variable velocities (PSV ${hemo.psv} cm/s, EDV ${hemo.edv} cm/s, ICA/CCA ratio ${hemo.ratio}).`
    );
  } else {
    findings.push(
      `Proximal ${input.side} ICA demonstrates PSV ${hemo.psv} cm/s, EDV ${hemo.edv} cm/s, and ICA/CCA PSV ratio of ${hemo.ratio}.`
    );
  }

  findings.push(
    `Ipsilateral ECA demonstrates high-resistance waveform. ${input.side} vertebral artery shows ${input.vertebralFlow.toLowerCase()} flow.`
  );

  const recommendation =
    hemo.sruCategory === '≥ 70% to Near-Occlusion' || hemo.sruCategory === 'Near-Occlusion (String Sign)'
      ? 'High-grade surgical/endovascular threshold stenosis (SRU ≥ 70%). Recommend CTA neck/head or MRA confirmation and vascular surgery consultation.'
      : hemo.sruCategory === '50–69% Stenosis'
        ? 'Moderate ICA stenosis (SRU 50–69%). Recommend optimal medical therapy and annual duplex surveillance.'
        : hemo.sruCategory === 'Total Occlusion'
          ? 'Confirm total ICA occlusion with CTA/MRA if acute stroke symptoms are present; endarterectomy is generally not indicated for chronic complete occlusion.'
          : 'No hemodynamically significant carotid stenosis. Routine risk-factor management.';

  return {
    title: `Duplex Carotid Ultrasound (${input.side})`,
    modality: 'US B-Mode / Color / PW Doppler',
    categoryBadge: `SRU: ${hemo.sruCategory}`,
    categoryTone: hemo.tone,
    technique: `Grayscale, color, and angle-corrected (≤ 60°) spectral pulsed-wave Doppler evaluation of the ${input.side.toLowerCase()} carotid and vertebral arteries.`,
    findings,
    impression: [
      `${input.side} ICA: ${hemo.sruCategory} (PSV ${hemo.psv} cm/s, EDV ${hemo.edv} cm/s, ICA/CCA ratio ${hemo.ratio}).`,
      ...(input.vertebralFlow !== 'Antegrade'
        ? [`${input.side} vertebral artery ${input.vertebralFlow.toLowerCase()} consistent with subclavian steal physiology.`]
        : []),
    ],
    recommendation,
    metricsSummary: [
      { label: 'ICA PSV', value: `${hemo.psv} cm/s` },
      { label: 'ICA EDV', value: `${hemo.edv} cm/s` },
      { label: 'ICA/CCA Ratio', value: `${hemo.ratio}` },
      { label: 'Spencer Flow', value: `${hemo.spencerFlowIndex}%` },
    ],
  };
}

/* ============================================================================
 * MODULE 3: TEMPORAL BONE & IAC STRUCTURED REPORT
 * ========================================================================== */
export type TemporalPathology =
  | 'normal'
  | 'sscd'
  | 'cholesteatoma'
  | 'vestibular-schwannoma'
  | 'otosclerosis'
  | 'mondini';

export function buildTemporalReport(side: 'Right' | 'Left', pathology: TemporalPathology): StructuredReport {
  const findings: string[] = [];
  const impression: string[] = [];
  let categoryBadge = 'Normal Otic Capsule & IAC';
  let categoryTone: StructuredReport['categoryTone'] = 'normal';
  let recommendation = 'No temporal bone or cerebellopontine angle abnormality identified.';

  if (pathology === 'normal') {
    findings.push(
      'Normal pneumatization of mastoid air cells and clear middle ear cavity.',
      'Intact scutum and normal "ice cream cone" configuration of the malleus and incus; intact stapes superstructure.',
      'Normal 2.5-turn cochlea, vestibule, and semicircular canals with intact bony roof over the superior semicircular canal on Pöschl view.',
      'Normal caliber of the internal auditory canal (IAC) with four distinct nerve bundles (CN VII, cochlear, superior/inferior vestibular) on CISS MRI.'
    );
    impression.push(`Normal ${side.toLowerCase()} temporal bone HRCT and IAC MRI.`);
  } else if (pathology === 'sscd') {
    categoryBadge = 'SSCD (Third Window)';
    categoryTone = 'warning';
    findings.push(
      'Focal absence of the arcuate eminence bony covering along the superior margin of the superior semicircular canal, best depicted on the Pöschl oblique reformation.',
      'Ossicular chain, scutum, cochlea, and internal auditory canal remain intact.'
    );
    impression.push(
      `${side} superior semicircular canal dehiscence (SSCD), correlating with Tullio phenomenon / conductive-type third-window physiology.`
    );
    recommendation = 'Correlate with VEMP testing and neurotology consultation if symptomatic.';
  } else if (pathology === 'cholesteatoma') {
    categoryBadge = 'Pars Flaccida Cholesteatoma';
    categoryTone = 'critical';
    findings.push(
      'Non-dependent soft-tissue opacification within Prussak space lateral to the ossicular head causing medial displacement of the ossicles.',
      'Blunting/erosion of the scutum and early erosion of the long process of the incus. Tegmen tympani and lateral semicircular canal wall are closely inspected for dehiscence.'
    );
    impression.push(
      `${side} pars flaccida (acquired) cholesteatoma with scutum blunting and ossicular erosion.`
    );
    recommendation = 'Recommend non-EPI DWI MRI if preoperative confirmation needed; ENT surgical excision indicated.';
  } else if (pathology === 'vestibular-schwannoma') {
    categoryBadge = 'Vestibular Schwannoma';
    categoryTone = 'critical';
    findings.push(
      'Well-circumscribed enhancing/T2-hypointense mass centered at the porus acusticus with intracanalicular and cerebellopontine angle cisternal extension ("ice cream cone" morphology).',
      'Mild widening of the internal auditory canal without acute hydrocephalus or brainstem compression.'
    );
    impression.push(`${side} vestibular schwannoma involving the IAC and cerebellopontine angle.`);
    recommendation = 'Neurotology/neurosurgery tumor board evaluation for observation vs stereotactic radiosurgery vs microsurgical resection.';
  } else if (pathology === 'otosclerosis') {
    categoryBadge = 'Fenestral Otosclerosis';
    categoryTone = 'warning';
    findings.push(
      'Focal demineralized/radiolucent otospongiotic plaque centered at the fissula ante fenestram just anterior to the oval window.',
      'Cochlear pericochlear otic capsule remains preserved (no retrofenestral double-ring halo).'
    );
    impression.push(`${side} fenestral otosclerosis at the fissula ante fenestram.`);
    recommendation = 'Correlate with audiometry (Carhart notch / conductive hearing loss) for stapedectomy candidacy.';
  } else if (pathology === 'mondini') {
    categoryBadge = 'Incomplete Partition Type II';
    categoryTone = 'warning';
    findings.push(
      'Cochlea demonstrates 1.5 turns with coalescence of the middle and apical turns into a cystic apex, accompanied by an enlarged vestibule and dilated vestibular aqueduct (> 1.5 mm at midpoint).'
    );
    impression.push(`${side} Mondini malformation (Incomplete Partition Type II) with enlarged vestibular aqueduct.`);
    recommendation = 'Counsel patient regarding avoidance of head trauma (sudden SNHL risk); evaluate cochlear implant candidacy if indicated.';
  }

  return {
    title: `HRCT Temporal Bone & IAC MRI (${side})`,
    modality: 'HRCT (0.5 mm) + 3D CISS MRI',
    categoryBadge,
    categoryTone,
    technique: `Sub-millimeter isotropic HRCT with Axial, Coronal, Pöschl, and Stenvers reformations paired with 3D heavily T2-weighted CISS of the ${side.toLowerCase()} IAC.`,
    findings,
    impression,
    recommendation,
    metricsSummary: [
      { label: 'Laterality', value: side },
      { label: 'Key Plane', value: pathology === 'sscd' ? 'Pöschl Oblique' : pathology === 'vestibular-schwannoma' ? 'IAC CISS' : 'Axial / Stenvers' },
      { label: 'Bone Window', value: 'W:4000 L:700' },
      { label: 'CN VII Canal', value: pathology === 'cholesteatoma' ? 'Monitor' : 'Intact' },
    ],
  };
}

/* ============================================================================
 * MODULE 4: ACR TI-RADS 2017 CALCULATOR & REPORT ENGINE
 * ========================================================================== */
export interface TiradsInput {
  lobe: 'Right' | 'Left' | 'Isthmus';
  pole: 'Upper' | 'Mid' | 'Lower';
  sizeMm: number;
  composition: 'cystic' | 'spongiform' | 'mixed' | 'solid';
  echogenicity: 'anechoic' | 'hyperechoic' | 'hypoechoic' | 'very-hypoechoic';
  shape: 'wider' | 'taller';
  margin: 'smooth' | 'ill-defined' | 'lobulated' | 'ete';
  foci: 'none' | 'comet-tail' | 'macro' | 'rim' | 'punctate';
}

export interface TiradsResult {
  points: number;
  category: 'TR1' | 'TR2' | 'TR3' | 'TR4' | 'TR5';
  riskLabel: string;
  action: 'No FNA or Follow-up' | 'Follow-up US Recommended' | 'FNA Recommended';
  fnaThresholdMm: number | null;
  fuThresholdMm: number | null;
  tone: StructuredReport['categoryTone'];
}

export function calculateAcrTirads(input: TiradsInput): TiradsResult {
  // Spongiform or purely cystic nodules automatically score 0 in ACR TI-RADS 2017
  if (input.composition === 'cystic' || input.composition === 'spongiform') {
    return {
      points: 0,
      category: 'TR1',
      riskLabel: 'Benign (< 2% malignancy risk)',
      action: 'No FNA or Follow-up',
      fnaThresholdMm: null,
      fuThresholdMm: null,
      tone: 'normal',
    };
  }

  let points = 0;
  // Composition
  points += input.composition === 'mixed' ? 1 : 2;
  // Echogenicity
  if (input.echogenicity === 'hyperechoic') points += 1;
  else if (input.echogenicity === 'hypoechoic') points += 2;
  else if (input.echogenicity === 'very-hypoechoic') points += 3;
  // Shape
  if (input.shape === 'taller') points += 3;
  // Margin
  if (input.margin === 'lobulated') points += 2;
  else if (input.margin === 'ete') points += 3;
  // Echogenic foci
  if (input.foci === 'macro') points += 1;
  else if (input.foci === 'rim') points += 2;
  else if (input.foci === 'punctate') points += 3;

  let category: TiradsResult['category'] = 'TR1';
  let riskLabel = 'Benign';
  let fnaThresholdMm: number | null = null;
  let fuThresholdMm: number | null = null;
  let tone: StructuredReport['categoryTone'] = 'normal';

  if (points === 0) {
    category = 'TR1';
    riskLabel = 'Benign (~0.3%)';
  } else if (points === 2 || points === 1) {
    category = 'TR2';
    riskLabel = 'Not Suspicious (~1.5%)';
    tone = 'info';
  } else if (points === 3) {
    category = 'TR3';
    riskLabel = 'Mildly Suspicious (~4.8%)';
    fnaThresholdMm = 25;
    fuThresholdMm = 15;
    tone = 'info';
  } else if (points >= 4 && points <= 6) {
    category = 'TR4';
    riskLabel = 'Moderately Suspicious (~9.1%)';
    fnaThresholdMm = 15;
    fuThresholdMm = 10;
    tone = 'warning';
  } else {
    category = 'TR5';
    riskLabel = 'Highly Suspicious (~35%)';
    fnaThresholdMm = 10;
    fuThresholdMm = 5;
    tone = 'critical';
  }

  let action: TiradsResult['action'] = 'No FNA or Follow-up';
  if (fnaThresholdMm !== null && input.sizeMm >= fnaThresholdMm) {
    action = 'FNA Recommended';
  } else if (fuThresholdMm !== null && input.sizeMm >= fuThresholdMm) {
    action = 'Follow-up US Recommended';
  }

  return { points, category, riskLabel, action, fnaThresholdMm, fuThresholdMm, tone };
}

export function buildTiradsReport(input: TiradsInput, result: TiradsResult): StructuredReport {
  const sizeCm = (input.sizeMm / 10).toFixed(1);
  const compLabel = {
    cystic: 'cystic/almost completely cystic (0 pts)',
    spongiform: 'spongiform (0 pts)',
    mixed: 'mixed cystic and solid (1 pt)',
    solid: 'solid/almost completely solid (2 pts)',
  }[input.composition];

  const echoLabel = {
    anechoic: 'anechoic (0 pts)',
    hyperechoic: 'hyper- to isoechoic (1 pt)',
    hypoechoic: 'hypoechoic (2 pts)',
    'very-hypoechoic': 'very hypoechoic (3 pts)',
  }[input.echogenicity];

  const marginLabel = {
    smooth: 'smooth (0 pts)',
    'ill-defined': 'ill-defined (0 pts)',
    lobulated: 'lobulated/irregular (2 pts)',
    ete: 'extrathyroidal extension (3 pts)',
  }[input.margin];

  const fociLabel = {
    none: 'none (0 pts)',
    'comet-tail': 'large comet-tail artifacts (0 pts)',
    macro: 'macrocalcifications (1 pt)',
    rim: 'peripheral (rim) calcifications (2 pts)',
    punctate: 'punctate echogenic foci (3 pts)',
  }[input.foci];

  const recText =
    result.action === 'FNA Recommended'
      ? `ACR TI-RADS ${result.category} nodule measuring ≥ ${(result.fnaThresholdMm! / 10).toFixed(1)} cm: Ultrasound-guided FNA is recommended.`
      : result.action === 'Follow-up US Recommended'
        ? `ACR TI-RADS ${result.category} nodule below FNA threshold (${(result.fnaThresholdMm! / 10).toFixed(1)} cm) but ≥ ${(result.fuThresholdMm! / 10).toFixed(1)} cm: Follow-up ultrasound recommended (1 year for TR5; 1, 2, 3, and 5 years for TR4; 1, 3, and 5 years for TR3).`
        : `No FNA or routine follow-up ultrasound indicated per ACR TI-RADS 2017 (${result.category}, ${sizeCm} cm).`;

  return {
    title: 'Ultrasound Thyroid (ACR TI-RADS 2017)',
    modality: 'High-Frequency Linear US (12–15 MHz)',
    categoryBadge: `ACR ${result.category} (${result.points} pts) — ${result.action}`,
    categoryTone: result.tone,
    technique: 'Transverse and longitudinal grayscale and color Doppler sonography of the thyroid gland and cervical soft tissues.',
    findings: [
      `Target nodule in the ${input.lobe.toLowerCase()} lobe (${input.pole.toLowerCase()} pole) measuring ${sizeCm} cm (${input.sizeMm} mm).`,
      input.composition === 'cystic' || input.composition === 'spongiform'
        ? `Composition is ${compLabel}; benign ACR TI-RADS 1 appearance.`
        : `Features: ${compLabel}, ${echoLabel}, ${input.shape === 'taller' ? 'taller-than-wide orientation (3 pts)' : 'wider-than-tall orientation (0 pts)'}, ${marginLabel} margins, and echogenic foci: ${fociLabel}.`,
    ],
    impression: [
      `${input.lobe} thyroid nodule (${sizeCm} cm): ACR TI-RADS ${result.category} (${result.points} points; ${result.riskLabel}).`,
    ],
    recommendation: recText,
    metricsSummary: [
      { label: 'TI-RADS Score', value: `${result.points} pts (${result.category})` },
      { label: 'Max Diameter', value: `${sizeCm} cm` },
      { label: 'FNA Cutoff', value: result.fnaThresholdMm ? `≥ ${(result.fnaThresholdMm / 10).toFixed(1)} cm` : 'N/A' },
      { label: 'Action', value: result.action.replace(' Recommended', '') },
    ],
  };
}

/* ============================================================================
 * MODULE 5: ACR LI-RADS v2018 CALCULATOR & REPORT ENGINE
 * ========================================================================== */
export interface LiradsInput {
  segment: 'I' | 'II' | 'III' | 'IVa' | 'IVb' | 'V' | 'VI' | 'VII' | 'VIII';
  sizeMm: number;
  aphe: boolean; // Nonrim arterial phase hyperenhancement
  washout: boolean; // Nonperipheral washout
  capsule: boolean; // Enhancing capsule
  thresholdGrowth: boolean;
  isBenignCystOrHemangioma: boolean;
  isTargetoidLrm: boolean; // Rim APHE, peripheral washout, delayed central enhancement
  isTumorInVein: boolean;
  ancillaryMalignancy: boolean; // Restricted diffusion / mild-mod T2 hyperintensity / HBP hypointensity
  ancillaryBenign: boolean;
}

export interface LiradsResult {
  category: 'LR-1' | 'LR-2' | 'LR-3' | 'LR-4' | 'LR-5' | 'LR-M' | 'LR-TIV';
  label: string;
  tone: StructuredReport['categoryTone'];
  majorCount: number;
}

export function calculateAcrLirads(input: LiradsInput): LiradsResult {
  if (input.isTumorInVein) {
    return { category: 'LR-TIV', label: 'Definite Tumor in Vein', tone: 'critical', majorCount: 0 };
  }
  if (input.isBenignCystOrHemangioma) {
    return { category: 'LR-1', label: 'Definitely Benign', tone: 'normal', majorCount: 0 };
  }
  if (input.isTargetoidLrm) {
    return {
      category: 'LR-M',
      label: 'Probably or Definitely Malignant, Not HCC Specific',
      tone: 'critical',
      majorCount: 0,
    };
  }

  const additionalMajor =
    (input.washout ? 1 : 0) + (input.capsule ? 1 : 0) + (input.thresholdGrowth ? 1 : 0);

  let category: LiradsResult['category'] = 'LR-3';

  if (!input.aphe) {
    if (input.sizeMm < 20) {
      category = additionalMajor <= 1 ? 'LR-3' : 'LR-4';
    } else {
      category = additionalMajor === 0 ? 'LR-3' : 'LR-4';
    }
  } else {
    // Nonrim APHE present
    if (input.sizeMm < 10) {
      category = additionalMajor === 0 ? 'LR-3' : 'LR-4';
    } else if (input.sizeMm >= 10 && input.sizeMm <= 19) {
      if (additionalMajor === 0) {
        category = 'LR-3';
      } else if (additionalMajor === 1) {
        // LR-5 requires APHE + 10-19mm + (washout OR threshold growth); capsule alone gives LR-4
        category = input.washout || input.thresholdGrowth ? 'LR-5' : 'LR-4';
      } else {
        category = 'LR-5';
      }
    } else {
      // >= 20 mm with nonrim APHE
      category = additionalMajor === 0 ? 'LR-4' : 'LR-5';
    }
  }

  // Ancillary feature tie-break (cannot upgrade LR-4 to LR-5 per ACR LI-RADS v2018!)
  if (input.ancillaryMalignancy && !input.ancillaryBenign) {
    if (category === 'LR-3') category = 'LR-4';
  } else if (input.ancillaryBenign && !input.ancillaryMalignancy) {
    if (category === 'LR-4') category = 'LR-3';
    else if (category === 'LR-3') category = 'LR-2';
  }

  const labels: Record<LiradsResult['category'], { label: string; tone: StructuredReport['categoryTone'] }> = {
    'LR-1': { label: 'Definitely Benign', tone: 'normal' },
    'LR-2': { label: 'Probably Benign', tone: 'info' },
    'LR-3': { label: 'Intermediate Probability of Malignancy', tone: 'info' },
    'LR-4': { label: 'Probably HCC', tone: 'warning' },
    'LR-5': { label: 'Definitely HCC', tone: 'critical' },
    'LR-M': { label: 'Malignant, Not HCC Specific', tone: 'critical' },
    'LR-TIV': { label: 'Tumor in Vein', tone: 'critical' },
  };

  return {
    category,
    label: labels[category].label,
    tone: labels[category].tone,
    majorCount: (input.aphe ? 1 : 0) + additionalMajor,
  };
}

export function buildLiradsReport(input: LiradsInput, result: LiradsResult): StructuredReport {
  const sizeCm = (input.sizeMm / 10).toFixed(1);
  const features: string[] = [];
  if (input.aphe) features.push('nonrim arterial phase hyperenhancement (APHE)');
  if (input.washout) features.push('nonperipheral washout appearance');
  if (input.capsule) features.push('enhancing "capsule"');
  if (input.thresholdGrowth) features.push('threshold growth');

  const findings: string[] = [
    `Cirrhosis-risk liver with Couinaud segment ${input.segment} observation measuring ${input.sizeMm} mm (${sizeCm} cm).`,
  ];

  if (result.category === 'LR-TIV') {
    findings.push(
      'Enhancing soft tissue within the adjacent portal/hepatic venous branch with vessel expansion consistent with definite tumor in vein (LR-TIV).'
    );
  } else if (result.category === 'LR-1') {
    findings.push('Classic benign imaging appearance (simple cyst or peripheral nodular discontinuous hemangioma fill-in).');
  } else if (result.category === 'LR-M') {
    findings.push(
      'Targetoid morphology demonstrating rim APHE, peripheral washout, and/or delayed central enhancement (favoring intrahepatic cholangiocarcinoma or combined HCC-CCA).'
    );
  } else {
    findings.push(
      features.length > 0
        ? `Major imaging features present: ${features.join(', ')}.`
        : 'No major HCC features (no nonrim APHE, washout, or capsule).'
    );
    if (input.ancillaryMalignancy) {
      findings.push('Ancillary features favoring malignancy present (mild-moderate T2 hyperintensity / restricted diffusion / hepatobiliary hypointensity).');
    }
  }

  const recommendation =
    result.category === 'LR-5'
      ? 'Diagnostic of hepatocellular carcinoma (OPTN Class 5 if ≥ 20 mm or 10–19 mm with washout + growth). Multidisciplinary liver tumor board review; biopsy not required.'
      : result.category === 'LR-4'
        ? 'Probably HCC. Multidisciplinary discussion for biopsy vs close 3-month follow-up vs empiric locoregional therapy.'
        : result.category === 'LR-M' || result.category === 'LR-TIV'
          ? 'Urgent hepatobiliary tumor board referral; tissue biopsy generally indicated for LR-M to distinguish cholangiocarcinoma from atypical HCC.'
          : result.category === 'LR-3'
            ? 'Repeat multiphase contrast-enhanced CT/MRI in 3–6 months.'
            : 'Return to routine 6-month HCC surveillance ultrasound.';

  return {
    title: 'Multiphasic Liver MRI / CT (ACR LI-RADS v2018)',
    modality: '4-Phase Dynamic CT / MRI',
    categoryBadge: `${result.category} — ${result.label}`,
    categoryTone: result.tone,
    technique: 'Pre-contrast, late hepatic arterial, portal venous, and delayed/hepatobiliary phase imaging in an at-risk liver.',
    findings,
    impression: [
      `Couinaud Segment ${input.segment} hepatic observation (${input.sizeMm} mm): ${result.category} (${result.label}).`,
    ],
    recommendation,
    metricsSummary: [
      { label: 'LI-RADS Class', value: result.category },
      { label: 'Segment', value: `Seg ${input.segment}` },
      { label: 'Size', value: `${input.sizeMm} mm` },
      { label: 'Major Features', value: `${result.majorCount} / 4` },
    ],
  };
}
