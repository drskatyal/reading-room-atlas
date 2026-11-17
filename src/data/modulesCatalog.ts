import type { ModuleId, ModuleMeta, ReelFrameScript, SearchEntry } from '../types/radiology';

export const MODULES_CATALOG: ModuleMeta[] = [
  {
    id: 'knee-mri',
    shortTitle: 'Knee MRI',
    title: 'Knee MRI & Biomechanics',
    subtitle: 'Menisci, Cruciates, Collaterals & Multi-Planar PD/T2-FS',
    modalityTag: '3T MRI',
    accentColor: '#38bdf8',
    description:
      'Interactive 3D tibiofemoral & patellofemoral anatomy with dynamic flexion, tear simulation, and synchronized Sagittal/Coronal/Axial W/L MRI stacks.',
    structuresCount: 14,
    pearls: [
      {
        id: 'knee-1',
        track: 'ABR Core',
        title: 'Double PCL Sign (Bucket-Handle Medial Meniscus)',
        summary:
          'A flipped medial meniscal fragment displaced into the intercondylar notch lies anterior and parallel to the PCL on sagittal MRI. Look for a truncated/absent bow-tie on peripheral sagittal slices.',
        keySign: 'Double PCL + Absent Bow-Tie',
      },
      {
        id: 'knee-2',
        track: 'FRCR 2B',
        title: 'Pivot-Shift Kissing Contusions & Segond Fracture',
        summary:
          'Classic non-contact ACL tear pattern produces bone marrow edema at the sulcus terminalis of the lateral femoral condyle and the posterolateral tibial plateau.',
        keySign: 'Sulcus Terminalis > 1.5 mm',
      },
      {
        id: 'knee-3',
        track: 'EDiR',
        title: 'Magic Angle vs True Meniscal Tear (Rule of Twos)',
        summary:
          'True tear requires unequivocal extension to the articular surface on ≥ 2 consecutive slices ("two-slice touch rule") or gross morphological distortion.',
        keySign: 'Two-Slice Touch Rule',
      },
    ],
  },
  {
    id: 'carotid-doppler',
    shortTitle: 'Carotid Doppler',
    title: 'Carotid & Vertebral Doppler Lab',
    subtitle: 'SRU 2003 Consensus, Spencer Curve & Live PW Spectral',
    modalityTag: 'US / PW',
    accentColor: '#f87171',
    description:
      'Live B-mode, Color aliasing, and pulsed-wave spectral Doppler simulator synchronized with 3D bifurcation plaque and the Spencer flow curve.',
    structuresCount: 10,
    pearls: [
      {
        id: 'carotid-1',
        track: 'ABR Core',
        title: 'SRU 2003 Thresholds (50–69% vs ≥ 70%)',
        summary:
          '50–69% stenosis: ICA PSV 125–230 cm/s, ICA/CCA ratio 2.0–4.0, EDV 40–100 cm/s. ≥ 70% stenosis: ICA PSV ≥ 230 cm/s, ratio ≥ 4.0, EDV ≥ 100 cm/s.',
        keySign: 'PSV ≥ 230 / Ratio ≥ 4.0',
      },
      {
        id: 'carotid-2',
        track: 'FRCR 2B',
        title: 'Near-Occlusion ("String Sign") Pitfall',
        summary:
          'Beyond ~94% stenosis on the Spencer curve, volume flow collapses and PSV can paradoxically fall into the normal range. Rely on narrow color string + tardus-parvus distal flow.',
        keySign: 'Spencer Descending Limb',
      },
      {
        id: 'carotid-3',
        track: 'EDiR',
        title: 'Distinguishing ICA vs ECA (Temporal Tap)',
        summary:
          'ICA supplies low-resistance brain parenchyma (high diastolic flow). ECA supplies high-resistance musculature (sharp triphasic notch) and shows serrations during superficial temporal artery tapping.',
        keySign: 'Low-R ICA vs High-R ECA',
      },
    ],
  },
  {
    id: 'temporal-bone',
    shortTitle: 'Temporal Bone',
    title: 'Temporal Bone & IAC',
    subtitle: 'HRCT Obliques (Pöschl / Stenvers) & 3D CISS IAC',
    modalityTag: 'HRCT + MRI',
    accentColor: '#d4a853',
    description:
      'Instant-load 3D membranous labyrinth, ossicular chain, and CN VII/VIII paired with Axial, Coronal, Pöschl, Stenvers, and IAC CISS oblique planes.',
    structuresCount: 13,
    pearls: [
      {
        id: 'tb-1',
        track: 'ABR Core',
        title: 'Pöschl vs Stenvers Plane for SSCD',
        summary:
          'Pöschl plane cuts parallel to the superior semicircular canal (displays the canal as a full ring — ideal for superior dehiscence). Stenvers cuts perpendicular to the petrous axis (best for cochlear turns & round window).',
        keySign: 'Pöschl = Ring of SSC',
      },
      {
        id: 'tb-2',
        track: 'FRCR 2B',
        title: '"7-Up, Coke-Down" IAC Nerve Mnemonic',
        summary:
          'On sagittal oblique CISS through the lateral IAC, CN VII (Facial) is anterior-superior ("7-Up"), Cochlear nerve is anterior-inferior ("Coke-Down"), and Superior/Inferior Vestibular nerves sit posteriorly.',
        keySign: '7-Up (CN VII) / Coke-Down (Cochlear)',
      },
      {
        id: 'tb-3',
        track: 'EDiR',
        title: 'Acquired Pars Flaccida Cholesteatoma',
        summary:
          'Arises in Prussak space lateral to the malleus head; blunts the scutum and displaces the ossicles medially (whereas pars tensa cholesteatoma displaces ossicles laterally).',
        keySign: 'Scutum Erosion + Prussak Space',
      },
    ],
  },
  {
    id: 'thyroid-tirads',
    shortTitle: 'Thyroid TI-RADS',
    title: 'Thyroid TI-RADS & Neck US',
    subtitle: 'ACR 2017 Point Matrix, FNA Cutoffs & Danger Zones',
    modalityTag: 'US 15MHz',
    accentColor: '#34d399',
    description:
      '3D surgical neck anatomy (thyroid, RLN, parathyroids, carotid sheath) paired with live ultrasound feature synthesis and ACR TI-RADS 2017 management calculator.',
    structuresCount: 11,
    pearls: [
      {
        id: 'th-1',
        track: 'ABR Core',
        title: 'ACR TI-RADS Size Cutoffs for FNA',
        summary:
          'TR3 FNA ≥ 2.5 cm (FU ≥ 1.5 cm); TR4 FNA ≥ 1.5 cm (FU ≥ 1.0 cm); TR5 FNA ≥ 1.0 cm (FU ≥ 0.5 cm). TR1 & TR2 require no FNA regardless of size.',
        keySign: '2.5 / 1.5 / 1.0 cm Rule',
      },
      {
        id: 'th-2',
        track: 'FRCR 2B',
        title: 'Comet-Tail vs Punctate Echogenic Foci',
        summary:
          'Large (>1 mm) V-shaped comet-tail artifacts in cystic/spongiform nodules represent benign inspissated colloid (0 pts). Punctate non-shadowing foci (<1 mm) in solid tissue score 3 pts (psammoma bodies).',
        keySign: 'Comet-Tail (0) vs Punctate (3)',
      },
      {
        id: 'th-3',
        track: 'EDiR',
        title: 'Recurrent Laryngeal Nerve Danger Triangle',
        summary:
          'Posterior subcapsular nodules bordering the tracheoesophageal groove require explicit comment on posterior capsular abutment/extrathyroidal extension to protect the RLN during resection/ablation.',
        keySign: 'TE Groove Assessment',
      },
    ],
  },
  {
    id: 'liver-lirads',
    shortTitle: 'Liver LI-RADS',
    title: 'Liver LI-RADS v2018 & Couinaud',
    subtitle: '8 Functional Segments, 4-Phase CT/MRI & LR Matrix',
    modalityTag: '4-Phase CT/MR',
    accentColor: '#fbbf24',
    description:
      '3D Couinaud Segments I–VIII bounded by hepatic/portal veins synchronized with dynamic arterial/portal/delayed imaging and ACR LI-RADS v2018 classification.',
    structuresCount: 14,
    pearls: [
      {
        id: 'lr-1',
        track: 'ABR Core',
        title: 'LR-4 to LR-5 Upgrade Prohibition',
        summary:
          'Ancillary features favoring malignancy (diffusion restriction, mild-mod T2 hyperintensity, HBP hypointensity) may upgrade LR-3 to LR-4, but NEVER upgrade LR-4 to LR-5.',
        keySign: 'Ancillary Never Upgrades to LR-5',
      },
      {
        id: 'lr-2',
        track: 'FRCR 2B',
        title: 'Couinaud Landmark Planes',
        summary:
          'Middle hepatic vein (Cantlie line) separates Right and Left lobes; Right hepatic vein separates Anterior (V/VIII) from Posterior (VI/VII); Left hepatic vein / falciform separates II/III from IVa/IVb; Portal bifurcation separates superior from inferior.',
        keySign: 'HV Vertical / PV Horizontal',
      },
      {
        id: 'lr-3',
        track: 'EDiR',
        title: 'LR-M Targetoid Appearance',
        summary:
          'Rim APHE, peripheral washout, and delayed central enhancement indicate LR-M (probably/definitely malignant, not HCC-specific — classic for intrahepatic cholangiocarcinoma).',
        keySign: 'Rim APHE = LR-M',
      },
    ],
  },
];

export const GLOBAL_SEARCH_ENTRIES: SearchEntry[] = [
  ...MODULES_CATALOG.map((m) => ({
    id: `mod-${m.id}`,
    moduleId: m.id,
    category: 'Module' as const,
    title: m.title,
    subtitle: m.subtitle,
    keywords: [m.shortTitle, m.modalityTag, m.description],
  })),
  {
    id: 'k-double-pcl',
    moduleId: 'knee-mri',
    category: 'Pathology',
    title: 'Bucket-Handle Medial Meniscal Tear (Double PCL Sign)',
    subtitle: 'Knee MRI — Displaced intercondylar notch fragment',
    keywords: ['bucket handle', 'double pcl', 'absent bow tie', 'meniscus'],
    presetAction: 'bucket-handle-medial',
  },
  {
    id: 'k-acl-pivot',
    moduleId: 'knee-mri',
    category: 'Pathology',
    title: 'Complete ACL Tear & Pivot-Shift Bone Bruises',
    subtitle: 'Knee MRI — Sulcus terminalis & posterolateral tibia contusion',
    keywords: ['acl', 'anterior cruciate', 'pivot shift', 'segond'],
    presetAction: 'acl-complete',
  },
  {
    id: 'k-triad',
    moduleId: 'knee-mri',
    category: 'Pathology',
    title: "O'Donoghue Unhappy Triad (ACL + MCL + Medial Meniscus)",
    subtitle: 'Knee MRI — Valgus external rotation injury',
    keywords: ['unhappy triad', 'odonoghue', 'mcl', 'acl'],
    presetAction: 'unhappy-triad',
  },
  {
    id: 'c-sru',
    moduleId: 'carotid-doppler',
    category: 'Calculator',
    title: 'SRU 2003 Carotid Stenosis & Spencer Curve Calculator',
    subtitle: 'Carotid Doppler — PSV ≥ 230 / Ratio ≥ 4.0 / Near-Occlusion',
    keywords: ['sru', 'spencer', 'nascet', 'ica', 'psv', 'edv', 'string sign'],
    presetAction: '82',
  },
  {
    id: 'c-steal',
    moduleId: 'carotid-doppler',
    category: 'Pathology',
    title: 'Subclavian Steal (Reversed Vertebral Flow)',
    subtitle: 'Carotid Doppler — Hemodynamic waveform reversal',
    keywords: ['vertebral', 'steal', 'subclavian', 'bidirectional'],
    presetAction: 'steal',
  },
  {
    id: 'tb-sscd',
    moduleId: 'temporal-bone',
    category: 'Pathology',
    title: 'Superior Semicircular Canal Dehiscence (SSCD)',
    subtitle: 'Temporal Bone — Pöschl oblique plane third-window lesion',
    keywords: ['sscd', 'poschl', 'tullio', 'dehiscence', 'arcuate eminence'],
    presetAction: 'sscd',
  },
  {
    id: 'tb-iac',
    moduleId: 'temporal-bone',
    category: 'Structure',
    title: 'Internal Auditory Canal ("7-Up, Coke-Down" Nerves)',
    subtitle: 'Temporal Bone — CN VII, Cochlear, Sup/Inf Vestibular on CISS',
    keywords: ['iac', 'ciss', '7-up', 'facial nerve', 'schwannoma'],
    presetAction: 'vestibular-schwannoma',
  },
  {
    id: 'tb-cholesteatoma',
    moduleId: 'temporal-bone',
    category: 'Pathology',
    title: 'Pars Flaccida Cholesteatoma (Prussak Space / Scutum)',
    subtitle: 'Temporal Bone — Scutum blunting & ossicular erosion',
    keywords: ['cholesteatoma', 'prussak', 'scutum', 'ossicles', 'incus'],
    presetAction: 'cholesteatoma',
  },
  {
    id: 'th-tirads',
    moduleId: 'thyroid-tirads',
    category: 'Calculator',
    title: 'ACR TI-RADS 2017 Point Matrix & FNA Thresholds',
    subtitle: 'Thyroid US — TR1–TR5 scoring & 2.5 / 1.5 / 1.0 cm cutoffs',
    keywords: ['tirads', 'ti-rads', 'fna', 'punctate', 'taller than wide', 'nodule'],
    presetAction: 'tr5',
  },
  {
    id: 'lr-lirads',
    moduleId: 'liver-lirads',
    category: 'Calculator',
    title: 'ACR LI-RADS v2018 Diagnostic Table & Couinaud Segments',
    subtitle: 'Liver CT/MRI — APHE, Washout, Capsule, LR-M & LR-TIV',
    keywords: ['lirads', 'li-rads', 'couinaud', 'aphe', 'washout', 'hcc', 'cantlie'],
    presetAction: 'lr5',
  },
  ...MODULES_CATALOG.flatMap((m) =>
    m.pearls.map((p) => ({
      id: p.id,
      moduleId: m.id,
      category: 'Exam Pearl' as const,
      title: `${p.track}: ${p.title}`,
      subtitle: p.keySign ? `Key Sign: ${p.keySign}` : m.shortTitle,
      keywords: [p.track, p.title, p.summary, p.keySign ?? ''],
    }))
  ),
];

export const REEL_SCRIPTS: Record<ModuleId, ReelFrameScript> = {
  'knee-mri': {
    title: 'Double PCL Sign — Bucket-Handle Meniscal Tear',
    hookCaption: 'Don’t miss the displaced medial meniscus hiding under the PCL!',
    pearlCaption: 'Double PCL sign on sagittal MRI + absent bow-tie = Bucket-Handle Tear.',
    durationSec: 10,
    steps: [
      { t: 0, cameraAzimuth: 0.4, cameraPolar: 1.25, label: '3D Knee Overview', caption: '1. Locate the medial meniscus & PCL in 3D' },
      { t: 0.35, cameraAzimuth: 1.15, cameraPolar: 1.15, label: 'Intercondylar Notch', caption: '2. Bucket-handle fragment flips beneath PCL' },
      { t: 0.7, cameraAzimuth: -0.3, cameraPolar: 1.05, label: 'Sagittal MRI Sync', caption: '3. Classic Double PCL Sign on Sagittal PD/T2' },
    ],
  },
  'carotid-doppler': {
    title: 'Near-Occlusion Trap on the Spencer Curve',
    hookCaption: 'Normal ICA velocity with 96% stenosis? Watch the Spencer Curve!',
    pearlCaption: 'Beyond 94% stenosis, PSV drops — look for the Color "String Sign".',
    durationSec: 10,
    steps: [
      { t: 0, cameraAzimuth: 0.3, cameraPolar: 1.25, label: 'Carotid Bifurcation', caption: '1. Identify CCA, Bulb, ICA & ECA' },
      { t: 0.35, cameraAzimuth: 0.9, cameraPolar: 1.15, label: 'Turbulent Jet', caption: '2. 70–90% accelerates PSV ≥ 230 cm/s' },
      { t: 0.7, cameraAzimuth: -0.2, cameraPolar: 1.2, label: 'String Sign', caption: '3. >94% collapses flow — Spencer descending limb' },
    ],
  },
  'temporal-bone': {
    title: 'Pöschl Oblique for Superior Canal Dehiscence',
    hookCaption: 'Axial HRCT misses SSCD — always reconstruct Pöschl!',
    pearlCaption: 'Pöschl plane displays the Superior Semicircular Canal as a complete ring.',
    durationSec: 10,
    steps: [
      { t: 0, cameraAzimuth: 0.5, cameraPolar: 1.2, label: 'Otic Capsule', caption: '1. 3D Cochlea, Vestibule & 3 Orthogonal Canals' },
      { t: 0.35, cameraAzimuth: 1.35, cameraPolar: 0.95, label: 'Arcuate Eminence', caption: '2. Rotate to superior canal apex roof defect' },
      { t: 0.7, cameraAzimuth: 0.2, cameraPolar: 1.1, label: 'Pöschl HRCT', caption: '3. Missing bony roof = Third Window SSCD' },
    ],
  },
  'thyroid-tirads': {
    title: 'ACR TI-RADS 2017: The 2.5 / 1.5 / 1.0 cm FNA Rule',
    hookCaption: 'Stop memorizing TI-RADS cutoffs the hard way.',
    pearlCaption: 'TR3 ≥ 2.5 cm • TR4 ≥ 1.5 cm • TR5 ≥ 1.0 cm (and check the TE groove!).',
    durationSec: 10,
    steps: [
      { t: 0, cameraAzimuth: 0.2, cameraPolar: 1.25, label: 'Surgical Neck', caption: '1. Thyroid lobes, trachea & RLN danger zone' },
      { t: 0.35, cameraAzimuth: 0.95, cameraPolar: 1.15, label: 'TE Groove', caption: '2. Check posterior capsule vs Recurrent Laryngeal N.' },
      { t: 0.7, cameraAzimuth: -0.35, cameraPolar: 1.2, label: 'TR5 Threshold', caption: '3. Solid + Very Hypoechoic + Taller + Punctate = TR5' },
    ],
  },
  'liver-lirads': {
    title: 'Couinaud Segments & LI-RADS v2018 Tie-Breaker',
    hookCaption: 'Remember: Ancillary features NEVER upgrade LR-4 to LR-5!',
    pearlCaption: 'Cantlie line (Middle HV) splits lobes; Portal bifurcation splits sup/inf.',
    durationSec: 10,
    steps: [
      { t: 0, cameraAzimuth: 0.35, cameraPolar: 1.2, label: 'Couinaud I–VIII', caption: '1. Hepatic veins divide vertical sectors' },
      { t: 0.35, cameraAzimuth: 1.1, cameraPolar: 1.1, label: 'Segment VIII Lesion', caption: '2. Nonrim APHE + Washout = LR-5 HCC' },
      { t: 0.7, cameraAzimuth: -0.25, cameraPolar: 1.15, label: '4-Phase Kinetics', caption: '3. Arterial hyperenhancement -> Portal washout' },
    ],
  },
};
