import type {
  GuideFigurePlate,
  GuidePlateAnnotation,
  GuideSubSection,
  GuideTone,
  RaGuideChapter,
} from '../types/atlas';

export type {
  GuideFigurePlate,
  GuidePlateAnnotation,
  GuideSubSection,
  GuideTone,
  RaGuideChapter,
};

export const FIVE_PASS_SCROLL_ORDER: Array<{ step: string; title: string; detail: string }> = [
  {
    step: 'Pass 1',
    title: 'Marrow & Fluid',
    detail: 'Screen fat-suppressed sequences first for occult fractures, bone bruises, and effusion.',
  },
  {
    step: 'Pass 2',
    title: 'Sagittal Menisci',
    detail: 'Scroll medial to lateral: verify two intact bow-ties per meniscus and posterior horn ratios.',
  },
  {
    step: 'Pass 3',
    title: 'Cruciate Ligaments',
    detail: 'Follow the ACL along Blumensaat’s roof and the uniform black PCL arc across the notch.',
  },
  {
    step: 'Pass 4',
    title: 'Coronal Collaterals & Roots',
    detail: 'Check MCL, LCL/fibular styloid, and trace each posterior root to bone (< 3 mm extrusion).',
  },
  {
    step: 'Pass 5',
    title: 'Axial Patella & Cartilage',
    detail: 'Assess trochlear depth, MPFL continuity, retropatellar cartilage, and loose bodies.',
  },
];

export const RA_GUIDE_CHAPTERS: RaGuideChapter[] = [
  {
    id: 'sequences-routine',
    number: '1',
    title: 'Pulse Sequences & Search Routine',
    lead: 'Consistent sequence habits eliminate the most common resident errors before you ever inspect a single meniscus or ligament.',
    subsections: [
      {
        heading: 'Proton Density vs. Fluid-Sensitive Contrast',
        paragraphs: [
          'Intermediate-weighted proton density (PD) series give high spatial resolution for meniscal surface clefts and articular cartilage margins, whereas T2-weighted or fat-suppressed 3D qDESS sequences isolate free fluid and bone marrow edema.',
          'Because the normal ACL contains interleaved fat and synovium between its fiber bundles, it often appears mildly gray and striated distally on PD images. Never diagnose a cruciate or bone marrow abnormality from PD alone—confirm every suspected ligament disruption or marrow bruise on fluid-sensitive slices.',
        ],
      },
      {
        heading: 'The Two-Slice Articular Surface Rule',
        bullets: [
          {
            lead: 'Mucoid Degeneration (Grades 1–2):',
            text: 'Globular or linear intrameniscal high signal that stops inside the black fibrocartilage triangle is intrasubstance degeneration and should not be reported as a tear.',
          },
          {
            lead: 'True Tear (Grade 3):',
            text: 'Abnormal signal must unequivocally breach either the superior or inferior meniscal articular surface on at least two consecutive slices (or in two orthogonal planes).',
          },
        ],
        pitfall:
          'When meniscal signal only barely touches an articular margin on one thin slice, look at the adjacent coronal slice before committing—false-positive posterior horn tears are usually volume averaging at the meniscocapsular junction.',
      },
    ],
    plates: [
      {
        id: 'fig-sag-overview',
        figureLabel: 'Fig. 1',
        imageSrc: '/guide/sag-notch-overview.png',
        alt: 'Midline sagittal 3T qDESS MRI of the normal right knee showing patella, extensor tendons, Hoffa fat pad, and cruciate ligaments.',
        annotations: [
          {
            kind: 'caliper',
            x1: 18,
            y1: 12,
            x2: 22,
            y2: 46,
            tone: 'cyan',
            label: 'Patella (LP)',
            lx: 16,
            ly: 8,
          },
          {
            kind: 'caliper',
            x1: 23,
            y1: 48,
            x2: 28,
            y2: 88,
            tone: 'emerald',
            label: 'Patellar Tendon (LT)',
            lx: 28,
            ly: 92,
          },
          {
            kind: 'line',
            x1: 62,
            y1: 35,
            x2: 46,
            y2: 55,
            tone: 'amber',
            dashed: true,
            label: 'Blumensaat Roof',
            lx: 68,
            ly: 28,
          },
          {
            kind: 'arrow',
            x1: 74,
            y1: 58,
            x2: 63,
            y2: 57,
            tone: 'cyan',
            label: 'PCL Arc',
            lx: 82,
            ly: 58,
          },
        ],
        caption:
          'Midline sagittal 3T qDESS reference plate. Marrow fat is suppressed dark so smooth white hyaline cartilage stands out cleanly. Measure Insall–Salvati (LT / LP; normal 0.8–1.2) from the patellar tendon relative to patellar length.',
        link: {
          label: 'Explore Normal Knee in 3D + MRI',
          mode: 'anatomy',
          structureId: 'Femur',
        },
      },
    ],
  },
  {
    id: 'menisci-roots',
    number: '2',
    title: 'Menisci, Tear Planes & Posterior Roots',
    lead: 'Compare normal asymmetric horn geometry systematically before characterizing tear orientation and root integrity.',
    subsections: [
      {
        heading: 'Medial C-Ring vs. Lateral O-Ring Symmetry',
        paragraphs: [
          'The medial meniscus forms a wider C-shape tightly tethered to the deep MCL capsule, making it less mobile and more vulnerable to tearing. On every sagittal slice medial to the notch, the medial posterior horn must measure roughly twice the height of the anterior horn. If the medial posterior horn looks smaller than or equal to the anterior horn, assume part of it has been resected or displaced into the intercondylar notch.',
          'The lateral meniscus forms a tighter O-ring with symmetric anterior and posterior horns that sit higher on a mildly convex tibial plateau. Each meniscus body should form at least two consecutive uninterrupted bow-tie segments on peripheral sagittal slices.',
        ],
      },
      {
        heading: 'Three Tear Planes & What Surgeons Need to Know',
        bullets: [
          {
            lead: 'Longitudinal (Vertical):',
            text: 'Runs parallel to the outer meniscal margin, sparing circumferential hoop fibers. Peripheral red-zone vertical tears heal well with surgical repair; propagating them inward creates a locked bucket-handle tear.',
          },
          {
            lead: 'Radial (Transverse):',
            text: 'Cuts perpendicularly across the inner free edge like slicing a suspension cable, destroying hoop tension and shifting across consecutive slices ("marching cleft" or truncated triangle).',
          },
          {
            lead: 'Horizontal (Cleavage):',
            text: 'Splits superior and inferior leaflets parallel to the tibial plateau and commonly pumps joint fluid peripherally into a lobulated parameniscal cyst at the capsule.',
          },
        ],
      },
      {
        heading: 'Bucket-Handle Displacement & Posterior Roots',
        paragraphs: [
          'Whenever fewer than two bow-tie body slices remain, inspect the intercondylar notch for a displaced dark band lying anteroinferior and parallel to the native PCL (the Double PCL sign) or anteriorly beside the anterior horn.',
          'Equally critical is the posterior medial meniscal root just medial to the PCL footprint. A focal interruption ("Ghost Sign") or radial meniscal extrusion exceeding 3 mm beyond the medial tibial margin on the mid-coronal MCL slice destroys hoop stress identically to a total meniscectomy and rapidly triggers weight-bearing cartilage loss and subchondral insufficiency fracture (SIFK).',
        ],
        pitfall:
          'Do not confuse the normal transverse intermeniscal ligament anteriorly or the oblique popliteus tendon passing through the posterolateral hiatus for peripheral anterior or lateral posterior horn tears—follow each hypointense band onto adjacent slices.',
      },
    ],
    plates: [
      {
        id: 'fig-med-vs-lat',
        figureLabel: 'Fig. 2',
        imageSrc: '/guide/sag-medial-meniscus.png',
        alt: 'Sagittal 3T MRI through the medial meniscus showing small anterior horn and larger posterior horn.',
        annotations: [
          {
            kind: 'arrow',
            x1: 20,
            y1: 36,
            x2: 28,
            y2: 45,
            tone: 'cyan',
            label: 'Smaller Ant. Horn',
            lx: 24,
            ly: 28,
          },
          {
            kind: 'arrow',
            x1: 80,
            y1: 35,
            x2: 72,
            y2: 44,
            tone: 'emerald',
            label: 'Larger Post. Horn (~2x)',
            lx: 72,
            ly: 26,
          },
        ],
        caption:
          'Medial meniscus normal proportion ("Big Back"): posterior horn wedge is roughly twice the size of the anterior horn on sagittal images.',
        link: {
          label: 'Inspect Meniscal Tear Geometry in 3D',
          mode: 'pathology',
          moduleId: 'meniscal-tears-3d',
        },
      },
      {
        id: 'fig-lat-meniscus',
        figureLabel: 'Fig. 3',
        imageSrc: '/guide/sag-lateral-meniscus.png',
        alt: 'Sagittal 3T MRI through the lateral compartment showing symmetric anterior and posterior horns over the convex lateral plateau.',
        annotations: [
          {
            kind: 'arrow',
            x1: 26,
            y1: 36,
            x2: 33,
            y2: 44,
            tone: 'cyan',
            label: 'Ant. Horn',
            lx: 24,
            ly: 29,
          },
          {
            kind: 'arrow',
            x1: 72,
            y1: 34,
            x2: 66,
            y2: 43,
            tone: 'cyan',
            label: 'Equal Post. Horn',
            lx: 73,
            ly: 27,
          },
        ],
        caption:
          'Lateral compartment ("Equal Twins"): anterior and posterior triangles match in size over the gently convex lateral tibial plateau. Compare directly against the asymmetric medial horns in Fig. 2.',
      },
      {
        id: 'fig-cor-extrusion',
        figureLabel: 'Fig. 4',
        imageSrc: '/guide/cor-mcl-menisci.png',
        alt: 'True orthonormal coronal 3T MRI showing medial and lateral meniscal bodies aligned within the tibial margins beneath the taut MCL.',
        annotations: [
          {
            kind: 'line',
            x1: 86,
            y1: 42,
            x2: 86,
            y2: 68,
            tone: 'amber',
            dashed: true,
            label: 'Tibial Edge (< 3 mm)',
            lx: 68,
            ly: 72,
          },
          {
            kind: 'arrow',
            x1: 74,
            y1: 68,
            x2: 79,
            y2: 57,
            tone: 'cyan',
            label: 'Med. Body',
            lx: 64,
            ly: 63,
          },
          {
            kind: 'arrow',
            x1: 78,
            y1: 34,
            x2: 90,
            y2: 41,
            tone: 'emerald',
            label: 'Taut MCL',
            lx: 70,
            ly: 31,
          },
        ],
        caption:
          'Coronal plane at the MCL body: drop a vertical line along the medial tibial plateau margin (excluding osteophytes). Meniscal protrusion past this line exceeding 3 mm strongly predicts a posterior root tear.',
        link: {
          label: 'Inspect Root Tear & > 3 mm Extrusion',
          mode: 'pathology',
          moduleId: 'posterior-root',
        },
      },
    ],
  },
  {
    id: 'cruciates',
    number: '3',
    title: 'Cruciate Ligaments (ACL & PCL)',
    lead: 'Evaluate primary fiber slope and continuity against Blumensaat’s line first, then corroborate instability with secondary tibial translation.',
    subsections: [
      {
        heading: 'Anterior Cruciate Ligament (ACL)',
        paragraphs: [
          'Follow the ACL on oblique/sagittal slices through the lateral wall of the intercondylar notch. Intact ACL fascicles stay taut and straight at an angle steeper than or parallel to Blumensaat’s intercondylar roof line all the way to the tibial footprint.',
          'Primary signs of complete disruption include focal discontinuity at the proximal third, replacement by a cloud of high-signal edema, or flattened horizontal distal fibers draped near the notch floor (empty notch sign on coronal cuts).',
        ],
        bullets: [
          {
            lead: 'Anterior Tibial Translation:',
            text: 'Wait for a lateral sagittal slice through the mid-lateral femoral condyle: > 5–7 mm anterior shift of the tibia uncovers the posterior horn of the lateral meniscus ("uncovered posterior horn sign").',
          },
          {
            lead: 'Question-Mark PCL & Segond:',
            text: 'Hyperbuckling of the intact PCL and a tiny lateral tibial capsular avulsion flake (Segond fracture) carry near-100% specificity for ACL failure.',
          },
          {
            lead: 'Mandatory Ramp Check:',
            text: 'Inspect the posteromedial meniscocapsular junction closely on every acute ACL tear—hidden ramp tears destabilize reconstruction grafts if left unfixed.',
          },
        ],
      },
      {
        heading: 'Posterior Cruciate Ligament (PCL)',
        paragraphs: [
          'The normal PCL traces a thick, uniformly black, gently curved arc from the medial femoral condyle to the posterior tibial fossa and measures 6 mm or less in anteroposterior thickness.',
          'Unlike the ACL, acute PCL tears frequently keep a preserved tubular synovium or look falsely intact thanks to intact meniscofemoral ligaments of Humphry or Wrisberg. Whenever anteroposterior sagittal PCL thickness reaches 7 mm or more with diffuse internal bright signal, call a PCL tear—and immediately clear the Posterolateral Corner.',
        ],
      },
    ],
    plates: [
      {
        id: 'fig-notch-cruciates',
        figureLabel: 'Fig. 5',
        imageSrc: '/guide/sag-notch-overview.png',
        alt: 'Zoomed sagittal 3T MRI of the intercondylar notch showing Blumensaat roof slope, ACL, and dark PCL curve.',
        viewBox: '24 26 52 50',
        annotations: [
          {
            kind: 'line',
            x1: 60,
            y1: 35,
            x2: 45,
            y2: 54,
            tone: 'amber',
            dashed: true,
            label: 'Blumensaat Line',
            lx: 56,
            ly: 33,
          },
          {
            kind: 'arrow',
            x1: 38,
            y1: 50,
            x2: 53,
            y2: 52,
            tone: 'cyan',
            label: 'Normal Parallel ACL',
            lx: 36,
            ly: 46,
          },
          {
            kind: 'arrow',
            x1: 68,
            y1: 58,
            x2: 63,
            y2: 56,
            tone: 'emerald',
            label: 'Uniform Black PCL (<= 6 mm)',
            lx: 65,
            ly: 66,
          },
        ],
        caption:
          'Magnified intercondylar notch view: normal ACL fascicles parallel Blumensaat’s dashed roof line while the thicker PCL forms a smooth jet-black arc behind it. Check AP PCL caliber (< 7 mm) on fluid-sensitive slices.',
        link: {
          label: 'Inspect ACL Pivot-Shift & PCL Sag in 3D',
          mode: 'pathology',
          moduleId: 'acl-rupture',
        },
      },
    ],
  },
  {
    id: 'bone-bruises',
    number: '4',
    title: 'Bone Marrow Contusion Footprints',
    lead: 'Subchondral marrow edema maps function as forensic footprints—telling you the exact mechanism of injury at a glance.',
    subsections: [
      {
        heading: 'How Contusion Locations Differentiate Injuries',
        paragraphs: [
          'Fat-suppressed fluid-sensitive sequences reveal trabecular microfractures immediately. Comparing the anatomical location of paired "kissing" bruises prevents confusion between ACL pivot-shift trauma and transient lateral patellar dislocation, even though both frequently follow non-contact rotational knee injuries.',
        ],
        table: {
          columns: ['Injury Mechanism', 'Characteristic Bone Marrow Edema Pattern'],
          rows: [
            [
              'ACL Pivot-Shift',
              'Mid-lateral femoral condyle at the terminal sulcus (> 1.5 mm "deep sulcus sign") paired with the posterolateral tibial plateau rim.',
            ],
            [
              'Patellar Dislocation',
              'Inferomedial patellar facet + non-weight-bearing anterolateral lateral femoral condyle margin (relocation impaction).',
            ],
            [
              'PCL Dashboard Blow',
              'Isolated anterior proximal tibia and fibular head/posterior tibial margin without femoral sulcus impaction.',
            ],
            [
              'Valgus Clip (MCL + ACL)',
              'Medial tensile MCL disruption paired paradoxically with lateral femoral/tibial compression contusions.',
            ],
          ],
        },
      },
    ],
    plates: [
      {
        id: 'fig-bruise-footprints',
        figureLabel: 'Fig. 6',
        imageSrc: '/guide/sag-lateral-meniscus.png',
        alt: 'Sagittal lateral knee MRI annotated with characteristic ACL pivot-shift kissing bone bruise locations.',
        annotations: [
          {
            kind: 'zone',
            cx: 24,
            cy: 34,
            rx: 9,
            ry: 7,
            rotate: -25,
            tone: 'crimson',
            label: 'Lat. Sulcus Impaction',
            lx: 28,
            ly: 21,
          },
          {
            kind: 'zone',
            cx: 67,
            cy: 55,
            rx: 9,
            ry: 6.5,
            rotate: 10,
            tone: 'crimson',
            label: 'Posterolateral Tibia',
            lx: 69,
            ly: 70,
          },
          {
            kind: 'arrow',
            x1: 31,
            y1: 39,
            x2: 60,
            y2: 52,
            tone: 'amber',
            label: 'Pivot-Shift Impact',
            lx: 48,
            ly: 41,
          },
        ],
        caption:
          'Typical ACL pivot-shift contusion sites overlaid on the lateral sagittal compartment: anterior tibial subluxation bangs the posterolateral tibial plateau directly against the lateral condylopatellar sulcus.',
        link: {
          label: 'Explore Bruise Zones in 3D (ACL)',
          mode: 'pathology',
          moduleId: 'acl-rupture',
        },
      },
    ],
  },
  {
    id: 'collaterals-plc',
    number: '5',
    title: 'Collateral Ligaments & Posterolateral Corner',
    lead: 'Always grade medial sprains in three structural tiers and examine the fibular styloid carefully whenever either cruciate ligament is torn.',
    subsections: [
      {
        heading: 'Medial Collateral Ligament (MCL) Grading',
        paragraphs: [
          'The superficial MCL bridges ~5 cm below the joint line onto the tibia while the deep meniscofemoral and meniscotibial bands tether the medial meniscus. High-grade valgus ("clip") injuries often tear both ACL and MCL alongside peripheral medial or acute lateral meniscal tears (O’Donoghue triad).',
        ],
        table: {
          columns: ['MCL Grade', 'Coronal & Axial MRI Findings'],
          rows: [
            ['Grade I (Mild)', 'Intact taut low-signal fibers surrounded by bright superficial edema.'],
            ['Grade II (Partial)', 'Thickened partially disrupted fibers with focal periligamentous fluid (< 5 mm opening).'],
            [
              'Grade III (Complete)',
              'Full disruption of superficial and deep bands. Check distally for retracted Stener-like wave over the pes anserinus.',
            ],
          ],
        },
      },
      {
        heading: 'Posterolateral Corner (PLC) & Fibular Head',
        paragraphs: [
          'Up to 60% of acute PCL tears and severe hyperextension varus injuries involve the Posterolateral Corner—specifically the fibular collateral ligament (LCL), biceps femoris conjoint tendon, and popliteus tendon.',
          'Trace the cord-like LCL onto the lateral fibular head on posterior coronal slices and check the fibular styloid tip for edema or an arcuate avulsion fracture. Undiagnosed PLC laxity causes isolated cruciate reconstructions to fail.',
        ],
      },
    ],
    plates: [
      {
        id: 'fig-cor-plc',
        figureLabel: 'Fig. 7',
        imageSrc: '/guide/cor-plc-lcl.png',
        alt: 'Posterior coronal 3T MRI centered over the fibular head and posterolateral corner landmarks.',
        annotations: [
          {
            kind: 'arrow',
            x1: 30,
            y1: 58,
            x2: 20,
            y2: 72,
            tone: 'amber',
            label: 'Fibular Head (PLC Check)',
            lx: 36,
            ly: 80,
          },
          {
            kind: 'arrow',
            x1: 25,
            y1: 27,
            x2: 18,
            y2: 44,
            tone: 'cyan',
            label: 'Lateral Collateral Course',
            lx: 34,
            ly: 21,
          },
        ],
        caption:
          'Posterior coronal view highlighting the proximal fibular head and posterolateral corner. Inspect the styloid apex for edema or arcuate avulsion and trace the LCL and biceps femoris conjoint insertion.',
        link: {
          label: 'Inspect MCL & Unhappy Triad in 3D + MRI',
          mode: 'pathology',
          moduleId: 'unhappy-triad',
        },
      },
    ],
  },
  {
    id: 'patellofemoral-cartilage',
    number: '6',
    title: 'Patellofemoral Tracking & Hyaline Cartilage',
    lead: 'Axial fluid-sensitive slices catch relocated patellar dislocations by their medial retinacular tears and reciprocal osteochondral footprints.',
    subsections: [
      {
        heading: 'Transient Lateral Patellar Dislocation & MPFL',
        paragraphs: [
          'Most lateral patellar dislocations relocate spontaneously before arrival in the emergency department, leaving three unmistakable diagnostic footprints on axial MRI: disruption of the medial patellofemoral ligament (MPFL) with elevation of the VMO muscle, marrow edema along the inferomedial patellar facet, and matching contusion on the anterolateral trochlear rim.',
          'Measure patellar height (Insall–Salvati > 1.3 defines patella alta), inspect the trochlear sulcus 3 cm above the joint line for dysplasia, and search every joint recess for a displaced osteochondral loose fragment sheared off during relocation.',
        ],
      },
      {
        heading: 'Modified Outerbridge / ICRS Cartilage Grading',
        table: {
          columns: ['Grade', 'Articular Surface & Subchondral Appearance'],
          rows: [
            ['Grade I', 'Focal signal heterogeneity or cartilage blistering with intact smooth surface.'],
            ['Grade II', 'Superficial fissuring or defect involving < 50% of hyaline thickness.'],
            ['Grade III', 'Deep fissuring > 50% depth approaching bone without bare cortical exposure.'],
            [
              'Grade IV',
              'Full-thickness cartilage denudation exposing dark subchondral bone with underlying marrow edema or cyst.',
            ],
          ],
        },
        pitfall:
          'Curved hyaline cartilage near 55° orientation demonstrates magic-angle signal blur; always confirm suspected Grade I–II chondral wear in a second orthogonal plane before calling a focal defect.',
      },
    ],
    plates: [
      {
        id: 'fig-ax-patella',
        figureLabel: 'Fig. 8',
        imageSrc: '/guide/ax-patellofemoral.png',
        alt: 'True axial 3T qDESS MRI of the patellofemoral joint showing symmetric facets, hyaline cartilage, trochlear groove, and MPFL.',
        annotations: [
          {
            kind: 'zone',
            cx: 54,
            cy: 20,
            rx: 5.5,
            ry: 4,
            tone: 'crimson',
            label: 'Med. Patella Bruise Zone',
            lx: 74,
            ly: 12,
          },
          {
            kind: 'zone',
            cx: 22,
            cy: 29,
            rx: 6,
            ry: 4.5,
            tone: 'crimson',
            label: 'Ant-Lat Condyle Zone',
            lx: 23,
            ly: 42,
          },
          {
            kind: 'arrow',
            x1: 78,
            y1: 24,
            x2: 62,
            y2: 17,
            tone: 'cyan',
            label: 'MPFL / Med. Retinaculum',
            lx: 78,
            ly: 31,
          },
        ],
        caption:
          'Axial patellofemoral view: medial patellar facet sits opposite the medial retinaculum / MPFL (right), while the wider lateral facet tracks along the steeper lateral trochlear wall (left). Crimson zones mark typical patellar dislocation kissing bruises.',
        link: {
          label: 'Simulate Patellar Dislocation & MPFL Tear',
          mode: 'pathology',
          moduleId: 'patellar-dislocation',
        },
      },
    ],
  },
];

export const SIX_BLIND_SPOTS: Array<{ title: string; check: string }> = [
  {
    title: 'Posterior Medial Meniscal Root',
    check: 'Confirm continuous black root anchoring medial to PCL; extrusion > 3 mm signals a hidden root tear.',
  },
  {
    title: 'Posteromedial Ramp Lesion',
    check: 'Inspect the capsular junction behind the medial posterior horn on every acute ACL rupture.',
  },
  {
    title: 'Posterolateral Corner & Fibular Styloid',
    check: 'Never diagnose an isolated PCL tear without clearing LCL, biceps femoris, popliteus, and fibular head.',
  },
  {
    title: 'Segond Lateral Capsular Flake',
    check: 'A tiny cortical avulsion off the lateral tibial rim carries near-100% specificity for ACL disruption.',
  },
  {
    title: 'Displaced Osteochondral Loose Body',
    check: 'After lateral patellar dislocation, search the lateral gutter, notch, and suprapatellar pouch for sheared fragments.',
  },
  {
    title: 'Superolateral Hoffa Fat Pad Edema',
    check: 'Focal bright fluid wedged between lateral femoral condyle and patellar tendon indicates fat pad impingement.',
  },
];
