export interface PathologyReportingDetail {
  mechanism: string;
  sequencesAndPlanes: string;
  gradingTitle: string;
  grades: Array<{ label: string; detail: string }>;
  howToReport: string[];
  surgicalNote: string;
}

export const PATHOLOGY_REPORTING_DETAILS: Record<string, PathologyReportingDetail> = {
  'meniscal-tears-3d': {
    mechanism:
      'Traumatic longitudinal/radial tears typically follow acute rotational knee loading in younger patients, whereas horizontal cleavage tears arise from mucoid degeneration and shear stress in older knees.',
    sequencesAndPlanes: 'Sagittal & Coronal PD / Fat-Sat qDESS (Meniscus Window)',
    gradingTitle: 'ISAKOS Tear Plane & Zone Classification',
    grades: [
      {
        label: 'Longitudinal',
        detail: 'Vertical tear parallel to outer capsular rim; spares circumferential hoop fibers.',
      },
      {
        label: 'Radial',
        detail: 'Perpendicular cleft cutting inward-out from free edge; severs hoop stress.',
      },
      {
        label: 'Horizontal',
        detail: 'Splits superior vs inferior leaflets parallel to plateau; feeds parameniscal cysts.',
      },
      {
        label: 'Red vs White Zone',
        detail: 'Outer vascular 1/3 (red-red) heals with repair; inner 2/3 (white) usually resected.',
      },
    ],
    howToReport: [
      'Specify compartment (medial vs lateral) and segment (anterior horn, body, posterior horn).',
      'Apply Two-Slice Articular Rule: state morphology (longitudinal, radial, horizontal, complex).',
      'Report vascular zone depth (red-red, red-white, white-white) to guide repair vs debridement.',
      'Document associated parameniscal cyst or overlying weight-bearing cartilage loss.',
    ],
    surgicalNote:
      'Peripheral longitudinal tears in the outer vascular red-red zone are prime candidates for all-inside or inside-out surgical repair.',
  },
  'bucket-handle': {
    mechanism:
      'Unchecked vertical longitudinal tear propagates longitudinally and flips the inner meniscal rim ("handle") into the intercondylar notch, mechanically blocking terminal knee extension.',
    sequencesAndPlanes: 'Sagittal Notch + Coronal Mid-Body PD / qDESS',
    gradingTitle: 'Classic MRI Signs of Bucket-Handle Displacement',
    grades: [
      {
        label: 'Double PCL Sign',
        detail: 'Flipped medial rim lies parallel & anteroinferior to native PCL in the notch.',
      },
      {
        label: 'Absent Bow-Tie',
        detail: 'Fewer than 2 normal peripheral sagittal body slices remain on donor side.',
      },
      {
        label: 'Coronal Truncation',
        detail: 'Stunted small residual rim peripherally + orphaned triangle sitting in fossa.',
      },
      {
        label: 'Flipped Anterior',
        detail: 'Anteriorly displaced fragment stacks above native AH ("Double Anterior Horn").',
      },
    ],
    howToReport: [
      'Identify donor meniscus (medial > lateral) and confirm donor rim truncation (< 2 bow-ties).',
      'Trace exact location of displaced handle (intercondylar notch, anterior horn, or posterior gutter).',
      'Assess integrity of anterior and posterior root anchors and width of remaining peripheral rim.',
      'Screen ACL explicitly — chronic or acute ACL insufficiency frequently accompanies medial bucket-handle tears.',
    ],
    surgicalNote:
      'Locked displaced bucket-handle tears in vascular tissue require urgent orthopedic arthroscopic reduction and suturing.',
  },
  'posterior-root': {
    mechanism:
      'Radial avulsion within 9 mm of the tibial posterior root insertion interrupts circumferential collagen hoop fibers, causing immediate meniscal extrusion and ~25% higher medial compartment contact pressure.',
    sequencesAndPlanes: 'Coronal at MCL Body + Sagittal Slice Medial to PCL',
    gradingTitle: 'LaPrade Posterior Meniscal Root Types',
    grades: [
      {
        label: 'Type 1',
        detail: 'Partial stable root tear within 9 mm of bony tibial attachment.',
      },
      {
        label: 'Type 2',
        detail: 'Complete radial tear within 9 mm of root attachment (2A–2C by distance; most common).',
      },
      {
        label: 'Type 3–4',
        detail: 'Bucket-handle + complete root tear (3) or complex oblique extension into root (4).',
      },
      {
        label: 'Type 5',
        detail: 'Bony root avulsion fracture off the tibial plateau insertion.',
      },
    ],
    howToReport: [
      'Confirm sagittal "Ghost Sign" (absent black triangle just medial to PCL) and coronal root gap <= 9 mm from insertion.',
      'Measure radial extrusion at the mid-coronal MCL slice (> 3.0 mm outside tibial margin is abnormal).',
      'Grade medial femoral condyle & tibial plateau cartilage (Outerbridge III–IV precludes isolated repair).',
      'Inspect subchondral bone for SIFK (subchondral insufficiency fracture / crescentic collapse).',
    ],
    surgicalNote:
      'Transtibial pull-out root repair is urgent before advanced medial OA (Outerbridge III/IV) or subchondral collapse develops.',
  },
  'acl-rupture': {
    mechanism:
      'Non-contact valgus + internal tibial rotation pivoting injury ruptures the ACL, driving the lateral femoral condyle into the posterolateral tibial plateau as the tibia translates anteriorly.',
    sequencesAndPlanes: 'Sagittal Oblique / Notch + Coronal & Axial Fluid-Sensitive qDESS',
    gradingTitle: 'ACL Injury Pattern & Secondary Instability Markers',
    grades: [
      {
        label: 'Direct Tear',
        detail: 'Focal fiber discontinuity, flattened slope (< Blumensaat roof), or fluid gap.',
      },
      {
        label: 'Pivot-Shift Bruise',
        detail: 'Kissing marrow edema at lateral femoral condylopatellar sulcus + posterolateral tibia.',
      },
      {
        label: 'Lachman Subluxation',
        detail: '>= 5–7 mm anterior tibial translation uncovers the posterior horn of lateral meniscus.',
      },
      {
        label: 'Segond & Ramp',
        detail: 'Lateral capsular avulsion (Segond) or posteromedial meniscocapsular separation.',
      },
    ],
    howToReport: [
      'State location of ACL disruption (proximal femoral footprint, midsubstance, or distal tibial) and complete vs partial.',
      'Document pivot-shift kissing bone contusions, Segond fracture, or deep lateral femoral sulcus (> 1.5 mm).',
      'Explicitly check ALL secondary stabilizers: posteromedial ramp lesion, lateral meniscus root, and MCL.',
      'Measure anterior tibial translation (>= 7 mm strongly supports complete tear) & Question-Mark PCL.',
    ],
    surgicalNote:
      'Active pivoting athletes or combined meniscal/collateral instability typically undergo anatomical ACL reconstruction after swelling subsides.',
  },
  'pcl-dashboard': {
    mechanism:
      'Posteriorly directed force against the proximal anterior tibia in a flexed knee ("dashboard injury") or hyperflexion avulses or thickens the PCL midsubstance.',
    sequencesAndPlanes: 'Sagittal Midline Notch + Coronal Posterolateral Corner (Fibular Head)',
    gradingTitle: 'PCL Tear Morphology & Multiligament Risk',
    grades: [
      {
        label: 'Grade 1–2',
        detail: 'Intrasubstance high signal & focal AP thickening (>= 7 mm) with wavy continuous sheath.',
      },
      {
        label: 'Grade 3 Complete',
        detail: 'Full-thickness fiber disruption or posterior tibial facet osseous avulsion.',
      },
      {
        label: 'Posterior Sag',
        detail: 'Tibia drops posteriorly relative to femur (peaks 70°–90° flexion) + anterior bruise.',
      },
      {
        label: 'PLC Partner Injury',
        detail: 'Up to 60% combine with LCL, popliteus tendon, or arcuate fibular styloid fracture.',
      },
    ],
    howToReport: [
      'Measure sagittal PCL AP thickness (>= 7.0 mm is diagnostic even if tubular meniscofemoral fibers mimic continuity).',
      'Distinguish intrasubstance/femoral tear from acute osseous tibial facet avulsion (fixable with screws).',
      'Report anterior tibial plateau "dashboard" bone bruise and posterior tibial sag step-off.',
      'Mandatorily clear the Posterolateral Corner (LCL, biceps femoris, popliteus, fibular head/arcuate).',
    ],
    surgicalNote:
      'Isolated low-grade PCL sprains are braced in extension; Grade 3 with PLC injury or tibial bony avulsion requires early surgery.',
  },
  'unhappy-triad': {
    mechanism:
      'Lateral valgus blow to a planted externally rotated knee ("clip injury") applies tension to fail medial stabilizers (MCL, capsule) while compressing the lateral compartment.',
    sequencesAndPlanes: 'Coronal Fluid-Sensitive (MCL + Lateral Condyle) & Sagittal Notch (ACL)',
    gradingTitle: 'MCL Sprain Grading & Medial-Lateral Triad Injury',
    grades: [
      {
        label: 'Grade 1 MCL',
        detail: 'Intact taut dark fibers with bright superficial periligamentous edema.',
      },
      {
        label: 'Grade 2 MCL',
        detail: 'Partial fiber thickening/disruption; joint opening < 5 mm on valgus stress.',
      },
      {
        label: 'Grade 3 MCL',
        detail: 'Complete rupture of superficial & deep capsular bands (associated ACL in ~80%).',
      },
      {
        label: 'Stener-like / Floating',
        detail: 'Retracted distal superficial MCL torn over pes anserinus or peripheral meniscus lift.',
      },
    ],
    howToReport: [
      'Grade superficial and deep MCL (proximal, mid-joint, or distal wave sign) and state whether Stener-like entrapment exists.',
      'Confirm concurrent ACL tear and paradoxical valgus lateral femoral/tibial compression bone bruises.',
      'Inspect BOTH menisci closely: posteromedial capsular ramp tear AND acute lateral posterior horn tear.',
      'Evaluate posteromedial corner (posterior oblique ligament & semimembranosus corner).',
    ],
    surgicalNote:
      'Distal retracted Grade 3 MCL tears (wave sign over pes) often need acute repair; proximal Grade 3 frequently heals in bracing before ACL reconstruction.',
  },
  'patellar-dislocation': {
    mechanism:
      'Sudden quadriceps contraction during valgus internal rotation subluxes or dislocates the patella laterally out of a shallow trochlea, tearing medial restraints before spontaneous relocation slams the bones together.',
    sequencesAndPlanes: 'Axial Fluid-Sensitive (Patellofemoral) + Sagittal Insall-Salvati',
    gradingTitle: 'Patellar Dislocation MRI Diagnostic Complex',
    grades: [
      {
        label: 'Kissing Contusions',
        detail: 'Inferomedial patella + anterolateral trochlear rim (pathognomonic relocation footprint).',
      },
      {
        label: 'MPFL Tear (> 90%)',
        detail: 'Disruption/avulsion of medial patellofemoral ligament +/- elevated distal VMO muscle.',
      },
      {
        label: 'Osteochondral Fragment',
        detail: 'Sheared cartilage/subchondral loose body off inferomedial patella or lateral condyle.',
      },
      {
        label: 'Anatomic Predisposers',
        detail: 'Trochlear dysplasia, patella alta (Insall-Salvati > 1.3), or TT-TG > 20 mm.',
      },
    ],
    howToReport: [
      'Identify the pathognomonic kissing bruise pair (inferomedial patella + anterolateral non-weight-bearing condyle).',
      'Localize MPFL/medial retinaculum tear site (patellar avulsion, midsubstance, or femoral adductor tubercle) + VMO edema.',
      'Explicitly search recesses (suprapatellar pouch, gutters, notch) for a displaced osteochondral loose body.',
      'Quantify anatomical risk factors: lateral patellar tilt, patella alta (Insall-Salvati), trochlear depth, & TT-TG (> 20 mm).',
    ],
    surgicalNote:
      'Presence of an osteochondral loose body with bony donor defect is an indication for acute arthroscopic fixation or removal.',
  },
  'chondral-oa': {
    mechanism:
      'Progressive proteoglycan matrix breakdown and mechanical overload erode hyaline articular cartilage, exposing subchondral bone to focal stress, cyst formation, and marginal osteophytes.',
    sequencesAndPlanes: '3D qDESS Chondral Window + Orthogonal Coronal & Sagittal Verification',
    gradingTitle: 'Modified Outerbridge / ICRS MRI Cartilage Grading',
    grades: [
      {
        label: 'Grade I (Softening)',
        detail: 'Focal heterogeneous signal swelling/blistering with intact articular surface.',
      },
      {
        label: 'Grade II (< 50%)',
        detail: 'Superficial fissuring or fraying involving less than half of cartilage depth.',
      },
      {
        label: 'Grade III (> 50%)',
        detail: 'Deep crater or defect > 50% thickness extending close to subchondral bone plate.',
      },
      {
        label: 'Grade IV (Full Depth)',
        detail: 'Full-thickness cartilage denudation exposing bare bone + subchondral BML/cyst.',
      },
    ],
    howToReport: [
      'Localize defect by compartment (medial, lateral, patellar median ridge, trochlea) and weight-bearing zone.',
      'Measure defect size (AP × ML mm) and assign Modified Outerbridge / ICRS Grade (I–IV).',
      'Report underlying subchondral marrow edema (BML), subchondral cysts, and marginal osteophytes.',
      'Identify mechanical drivers (meniscal extrusion, ACL deficiency, or patellar maltracking).',
    ],
    surgicalNote:
      'Contained focal Grade III–IV lesions without diffuse tricompartmental OA may qualify for microfracture, OATS, or MACI restoration.',
  },
  'ramp-wrisberg': {
    mechanism:
      'Posteromedial meniscocapsular separation ("ramp lesion") develops from excessive tibial-femoral shear during acute ACL failure; similarly, Wrisberg rip tears pull a vertical longitudinal cleft where the meniscofemoral ligament anchors to the lateral posterior horn.',
    sequencesAndPlanes: 'Fluid-Sensitive Sagittal Posteromedial + Coronal Intercondylar Notch',
    gradingTitle: 'Thaunat Ramp Classification & Wrisberg Features',
    grades: [
      {
        label: 'Type 1–2 Ramp',
        detail: 'Meniscocapsular ligament fluid tear (Type 1) or partial superior cleft (Type 2).',
      },
      {
        label: 'Type 3–4 Ramp',
        detail: 'Hidden inferior meniscotibial tear (Type 3) or complete full-thickness separation (Type 4).',
      },
      {
        label: 'Type 5 Double',
        detail: 'Two parallel longitudinal tears along the posterior medial meniscocapsular periphery.',
      },
      {
        label: 'Wrisberg Rip',
        detail: 'Vertical tear extending along PHLM within <= 14 mm of PCL insertion in ACL injury.',
      },
    ],
    howToReport: [
      'Inspect the posteromedial meniscocapsular junction on every acute ACL tear for thin linear fluid.',
      'Document any posteromedial tibial plateau marginal contrecoup marrow contusion.',
      'Specify whether the tear reaches the inferior meniscotibial ligament or posterior horn.',
      'Clear the posterolateral meniscus within 14 mm of Wrisberg insertion for longitudinal zip tears.',
    ],
    surgicalNote:
      'Ramp lesions left unrepaired during ACL reconstruction significantly increase persistent rotatory laxity and graft overload; notify the surgeon to probe via posteromedial portal.',
  },
  'sifk-hoffa': {
    mechanism:
      'Acute mechanical overloading following medial root avulsion or meniscectomy fractures subchondral trabeculae (SIFK), while superolateral Hoffa fat pad impingement reflects chronic patellofemoral friction between patellar tendon and lateral femoral condyle.',
    sequencesAndPlanes: 'Coronal & Sagittal Trabecular PD / Fluid-Sensitive + Axial Patellofemoral',
    gradingTitle: 'SIFK Prognostic & Impingement Findings',
    grades: [
      {
        label: 'Low-Signal Crescent',
        detail: 'Thin curvilinear hypointense line parallel and < 3 mm deep to articular cortex.',
      },
      {
        label: 'Disproportionate BML',
        detail: 'Extensive trabecular edema extending across weight-bearing femoral condyle.',
      },
      {
        label: 'Articular Collapse',
        detail: 'Focal flattening or depression > 4 mm indicates irreversible subchondral collapse.',
      },
      {
        label: 'SL Hoffa Edema',
        detail: 'Bright fat pad fluid isolated between lateral patellar tendon & lateral condyle.',
      },
    ],
    howToReport: [
      'Differentiate linear subchondral SIFK fracture from geographic serpiginous double-line AVN.',
      'Measure lesion width and note whether the articular cortical plate remains convex vs collapsed.',
      'Explicitly state coexisting posterior medial meniscal root tear or > 3 mm radial extrusion.',
      'In isolated superolateral Hoffa edema, measure Insall-Salvati (> 1.3 alta) and TT-TG distance.',
    ],
    surgicalNote:
      'Pre-collapse SIFK responds to strict protected offloading; articular collapse > 4 mm or advanced tricompartmental OA often progresses to unicompartmental or total arthroplasty.',
  },
};
