import type {
  AnatomySystemGroup,
  AppWorkspaceMode,
  PatientDemoPreset,
  ReportingGuideSection,
} from '../types/atlas';

export function modeToPath(mode: AppWorkspaceMode): string {
  switch (mode) {
    case 'fullscreen-3d':
      return '/3d';
    case 'pathology':
      return '/pathology';
    case 'report-guide':
      return '/report-guide';
    case 'quiz':
      return '/quiz';
    case 'anatomy':
    default:
      return '/anatomy';
  }
}

export function pathToMode(pathname: string): AppWorkspaceMode {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (clean === '/3d' || clean === '/fullscreen-3d') return 'fullscreen-3d';
  if (clean === '/pathology' || clean === '/pathologies') return 'pathology';
  if (clean === '/report-guide' || clean === '/how-to-read' || clean === '/reporting') {
    return 'report-guide';
  }
  if (clean === '/quiz') return 'quiz';
  return 'anatomy';
}

export const ANATOMY_SYSTEM_GROUPS: AnatomySystemGroup[] = [
  {
    id: 'bone',
    title: 'Bones & Osseous Landmarks',
    visibilityKey: 'bones',
    entries: [
      {
        structureId: 'Femur',
        label: 'Distal Femur',
        shortMeta: 'Condyles · Trochlea · Notch',
        defaultLandmark: {
          id: 'anat-femur',
          label: 'Distal Femur (Overview)',
          structureId: 'Femur',
          targetRas: [110.9, 27.6, 19.4],
          cameraPreset: 'anterior',
          cameraDistanceScale: 1.05,
          viewMode3D: 'solid',
          mriPlane: 'coronal',
          mriContrast: 'trabecular',
          mriZoom: 1.15,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [148.0, 27.6, 38.0],
              toRas: [122.0, 27.6, 20.0],
              tone: 'cyan',
              label: 'Distal Femoral Shaft',
            },
          ],
          keyFact:
            'Dark low-signal cortical rim enclosing fat-suppressed trabecular marrow on 3T qDESS.',
        },
        subLandmarks: [
          {
            id: 'anat-femur-med-condyle',
            label: 'Medial Femoral Condyle',
            structureId: 'Femur',
            targetRas: [90.5, 18.0, -4.0],
            cameraPreset: 'medial',
            cameraDistanceScale: 1.04,
            viewMode3D: 'solid',
            mriPlane: 'coronal',
            mriContrast: 'trabecular',
            mriZoom: 1.35,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [62.0, 18.0, 16.0],
                toRas: [88.0, 18.0, -2.0],
                tone: 'cyan',
                label: 'Medial Condyle',
              },
            ],
            keyFact:
              'Larger, more symmetric weight-bearing condyle (~60% axial knee load); donor/recipient check site for osteochondral lesions.',
          },
          {
            id: 'anat-femur-lat-condyle',
            label: 'Lateral Femoral Condyle',
            structureId: 'Femur',
            targetRas: [134.0, 22.0, -2.0],
            cameraPreset: 'lateral',
            cameraDistanceScale: 1.04,
            viewMode3D: 'solid',
            mriPlane: 'sagittal',
            mriContrast: 'trabecular',
            mriZoom: 1.35,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [134.0, 48.0, 20.0],
                toRas: [134.0, 28.0, 2.0],
                tone: 'cyan',
                label: 'Condylopatellar Sulcus',
              },
            ],
            keyFact:
              'Contains the shallow terminal sulcus anteriorly — focal depression > 1.5 mm ("deep sulcus sign") indicates ACL impaction.',
          },
          {
            id: 'anat-femur-trochlea',
            label: 'Trochlear Groove',
            structureId: 'Femur',
            targetRas: [116.0, 52.0, 18.0],
            cameraPreset: 'anterior',
            cameraDistanceScale: 1.04,
            viewMode3D: 'solid',
            mriPlane: 'axial',
            mriContrast: 'chondral',
            mriZoom: 1.4,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [84.0, 72.0, 18.0],
                toRas: [116.0, 50.0, 18.0],
                tone: 'cyan',
                label: 'Trochlear Sulcus',
              },
            ],
            keyFact:
              'Steeper lateral trochlear wall prevents lateral patellar subluxation; assess trochlear dysplasia 3 cm above joint line.',
          },
          {
            id: 'anat-femur-notch',
            label: 'Intercondylar Notch (Blumensaat)',
            structureId: 'Femur',
            targetRas: [113.0, 24.0, 4.0],
            cameraPreset: 'notch',
            cameraDistanceScale: 1.02,
            viewMode3D: 'joint-interior',
            mriPlane: 'sagittal',
            mriContrast: 'meniscus-cruciate',
            mriZoom: 1.4,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [113.0, 48.0, 26.0],
                toRas: [113.0, 28.0, 8.0],
                tone: 'cyan',
                label: 'Intercondylar Roof',
              },
            ],
            keyFact:
              'Blumensaat roof line forms an oblique ~40° slope; native ACL runs directly parallel beneath it.',
          },
        ],
      },
      {
        structureId: 'Tibia',
        label: 'Proximal Tibia',
        shortMeta: 'Plateaus · Spine · Tubercle',
        defaultLandmark: {
          id: 'anat-tibia',
          label: 'Proximal Tibia (Overview)',
          structureId: 'Tibia',
          targetRas: [115.3, 23.2, -39.0],
          cameraPreset: 'anterior',
          cameraDistanceScale: 1.05,
          viewMode3D: 'solid',
          mriPlane: 'coronal',
          mriContrast: 'trabecular',
          mriZoom: 1.15,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [152.0, 23.2, -52.0],
              toRas: [122.0, 23.2, -36.0],
              tone: 'cyan',
              label: 'Proximal Tibia',
            },
          ],
          keyFact:
            'Medial tibial plateau is mildly concave while lateral plateau is slightly convex with steeper posterior slope.',
        },
        subLandmarks: [
          {
            id: 'anat-tibia-med-plateau',
            label: 'Medial Tibial Plateau',
            structureId: 'Tibia',
            targetRas: [91.0, 20.0, -20.5],
            cameraPreset: 'plateau',
            cameraDistanceScale: 1.02,
            viewMode3D: 'plateau-topdown',
            mriPlane: 'coronal',
            mriContrast: 'trabecular',
            mriZoom: 1.35,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [60.0, 20.0, -34.0],
                toRas: [88.0, 20.0, -20.5],
                tone: 'cyan',
                label: 'Concave Med. Plateau',
              },
            ],
            keyFact:
              'Subchondral insufficiency fractures (SIFK) and osteophytes localize early along the weight-bearing medial rim.',
          },
          {
            id: 'anat-tibia-lat-plateau',
            label: 'Lateral Tibial Plateau',
            structureId: 'Tibia',
            targetRas: [135.0, 20.0, -20.0],
            cameraPreset: 'lateral',
            cameraDistanceScale: 1.04,
            viewMode3D: 'solid',
            mriPlane: 'sagittal',
            mriContrast: 'trabecular',
            mriZoom: 1.35,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [135.0, -8.0, -40.0],
                toRas: [135.0, 8.0, -20.0],
                tone: 'cyan',
                label: 'Posterolat. Plateau',
              },
            ],
            keyFact:
              'Posterolateral rim is the classic anvil site for pivot-shift bone marrow edema during ACL rupture.',
          },
          {
            id: 'anat-tibia-spine',
            label: 'Intercondylar Eminence (Spine)',
            structureId: 'Tibia',
            targetRas: [113.0, 23.0, -15.5],
            cameraPreset: 'anterior',
            cameraDistanceScale: 1.04,
            viewMode3D: 'joint-interior',
            mriPlane: 'coronal',
            mriContrast: 'trabecular',
            mriZoom: 1.4,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [113.0, 23.0, 12.0],
                toRas: [113.0, 23.0, -13.0],
                tone: 'cyan',
                label: 'Tibial Spine',
              },
            ],
            keyFact:
              'Anchors both the ACL footprint and medial/lateral meniscal roots; pediatric equivalent of ACL tear is tibial spine avulsion.',
          },
          {
            id: 'anat-tibia-tubercle',
            label: 'Tibial Tubercle',
            structureId: 'Tibia',
            targetRas: [120.0, 56.0, -46.0],
            cameraPreset: 'lateral',
            cameraDistanceScale: 1.04,
            viewMode3D: 'solid',
            mriPlane: 'sagittal',
            mriContrast: 'qdess-clinical',
            mriZoom: 1.3,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [120.0, 74.0, -64.0],
                toRas: [120.0, 58.0, -46.0],
                tone: 'cyan',
                label: 'Tibial Tubercle',
              },
            ],
            keyFact:
              'Distal bony insertion of the patellar tendon; lateralized offset (TT-TG > 20 mm) predisposes to patellar instability.',
          },
        ],
      },
      {
        structureId: 'Patella',
        label: 'Patella',
        shortMeta: 'Medial & Lat. Facets · Apex',
        defaultLandmark: {
          id: 'anat-patella',
          label: 'Patella (Overview)',
          structureId: 'Patella',
          targetRas: [123.6, 69.9, 24.9],
          cameraPreset: 'anterior',
          cameraDistanceScale: 1.04,
          viewMode3D: 'solid',
          mriPlane: 'axial',
          mriContrast: 'chondral',
          mriZoom: 1.35,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [94.0, 84.0, 24.9],
              toRas: [118.0, 72.0, 24.9],
              tone: 'cyan',
              label: 'Patella',
            },
          ],
          keyFact:
            'Largest sesamoid bone; wider flatter lateral facet vs steeper shorter medial facet (Wiberg type II morphology).',
        },
        subLandmarks: [
          {
            id: 'anat-patella-med-facet',
            label: 'Medial Facet & Odd Facet',
            structureId: 'Patella',
            targetRas: [111.0, 65.0, 24.5],
            cameraPreset: 'medial',
            cameraDistanceScale: 1.04,
            viewMode3D: 'solid',
            mriPlane: 'axial',
            mriContrast: 'chondral',
            mriZoom: 1.45,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [82.0, 78.0, 24.5],
                toRas: [108.0, 65.0, 24.5],
                tone: 'cyan',
                label: 'Medial Patellar Facet',
              },
            ],
            keyFact:
              'Impacts the lateral femoral condyle during transient lateral patellar dislocation, leaving classic inferomedial contusion/osteochondral injury.',
          },
          {
            id: 'anat-patella-lat-facet',
            label: 'Lateral Facet',
            structureId: 'Patella',
            targetRas: [131.0, 66.0, 24.5],
            cameraPreset: 'lateral',
            cameraDistanceScale: 1.04,
            viewMode3D: 'solid',
            mriPlane: 'axial',
            mriContrast: 'chondral',
            mriZoom: 1.45,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [158.0, 78.0, 24.5],
                toRas: [134.0, 66.0, 24.5],
                tone: 'cyan',
                label: 'Lateral Patellar Facet',
              },
            ],
            keyFact:
              'Primary weight-bearing patellofemoral facet in extension and early flexion; susceptible to lateral hyperpressure.',
          },
        ],
      },
      {
        structureId: 'Fibula',
        label: 'Proximal Fibula',
        shortMeta: 'Head · Styloid Process',
        defaultLandmark: {
          id: 'anat-fibula',
          label: 'Fibular Head & Styloid',
          structureId: 'Fibula',
          targetRas: [154.0, 1.8, -51.3],
          cameraPreset: 'lateral',
          cameraDistanceScale: 1.05,
          viewMode3D: 'solid',
          mriPlane: 'coronal',
          mriContrast: 'trabecular',
          mriZoom: 1.25,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [176.0, 1.8, -28.0],
              toRas: [156.0, 1.8, -46.0],
              tone: 'cyan',
              label: 'Fibular Head',
            },
          ],
          keyFact:
            'Posterolateral anchor for the LCL and biceps femoris conjoint tendon; styloid avulsion ("arcuate sign") flags PLC injury.',
        },
      },
    ],
  },
  {
    id: 'cartilage',
    title: 'Hyaline Articular Cartilage',
    visibilityKey: 'cartilage',
    entries: [
      {
        structureId: 'FemoralCartilage',
        label: 'Femoral Condylar & Trochlear Cartilage',
        shortMeta: '1.7–2.3 mm hyaline arc',
        defaultLandmark: {
          id: 'anat-fem-cart',
          label: 'Femoral Articular Cartilage',
          structureId: 'FemoralCartilage',
          targetRas: [112.8, 25.2, -0.7],
          cameraPreset: 'anterior',
          cameraDistanceScale: 1.02,
          viewMode3D: 'cartilage-map',
          mriPlane: 'sagittal',
          mriContrast: 'chondral',
          mriZoom: 1.35,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [112.8, 52.0, -2.0],
              toRas: [112.8, 28.0, -2.0],
              tone: 'cyan',
              label: 'Femoral Hyaline Layer',
            },
          ],
          keyFact:
            'Bright intermediate-to-high signal ribbon on 3T qDESS; confirm focal chondral defects on two orthogonal planes.',
        },
      },
      {
        structureId: 'PatellarCartilage',
        label: 'Retropatellar Cartilage',
        shortMeta: 'Thickest (~2.4–3.7 mm)',
        defaultLandmark: {
          id: 'anat-pat-cart',
          label: 'Retropatellar Hyaline Cartilage',
          structureId: 'PatellarCartilage',
          targetRas: [120.9, 62.2, 26.8],
          cameraPreset: 'lateral',
          cameraDistanceScale: 1.02,
          viewMode3D: 'cartilage-map',
          mriPlane: 'axial',
          mriContrast: 'chondral',
          mriZoom: 1.45,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [88.0, 50.0, 26.8],
              toRas: [118.0, 60.0, 26.8],
              tone: 'cyan',
              label: 'Patellar Median Ridge',
            },
          ],
          keyFact:
            'Thickest articular cartilage in the human body; inspect median ridge & odd facet closely on axial chondral window.',
        },
      },
      {
        structureId: 'MedialTibialCartilage',
        label: 'Medial Tibial Cartilage',
        shortMeta: 'Mean 1.95 mm',
        defaultLandmark: {
          id: 'anat-med-tib-cart',
          label: 'Medial Tibial Cartilage',
          structureId: 'MedialTibialCartilage',
          targetRas: [89.5, 24.8, -19.2],
          cameraPreset: 'plateau',
          cameraDistanceScale: 1.0,
          viewMode3D: 'cartilage-map',
          mriPlane: 'coronal',
          mriContrast: 'chondral',
          mriZoom: 1.4,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [62.0, 24.8, -4.0],
              toRas: [88.0, 24.8, -17.0],
              tone: 'cyan',
              label: 'Medial Plateau Cartilage',
            },
          ],
          keyFact:
            'Rapidly accelerates OA thinning if medial posterior meniscal root tears eliminate hoop stress.',
        },
      },
      {
        structureId: 'LateralTibialCartilage',
        label: 'Lateral Tibial Cartilage',
        shortMeta: 'Mean 2.20 mm dome',
        defaultLandmark: {
          id: 'anat-lat-tib-cart',
          label: 'Lateral Tibial Cartilage',
          structureId: 'LateralTibialCartilage',
          targetRas: [135.8, 11.8, -15.8],
          cameraPreset: 'plateau',
          cameraDistanceScale: 1.0,
          viewMode3D: 'cartilage-map',
          mriPlane: 'coronal',
          mriContrast: 'chondral',
          mriZoom: 1.4,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [164.0, 11.8, -2.0],
              toRas: [137.0, 11.8, -14.0],
              tone: 'cyan',
              label: 'Lateral Plateau Cartilage',
            },
          ],
          keyFact:
            'Covers convex lateral tibial dome under the mobile O-shaped lateral meniscus.',
        },
      },
    ],
  },
  {
    id: 'meniscus',
    title: 'Menisci & Meniscal Roots',
    visibilityKey: 'menisci',
    entries: [
      {
        structureId: 'MedialMeniscus',
        label: 'Medial Meniscus (C-Shaped)',
        shortMeta: 'PH 2× > AH · Tethered to dMCL',
        defaultLandmark: {
          id: 'anat-med-men',
          label: 'Medial Meniscus (Full C-Ring)',
          structureId: 'MedialMeniscus',
          targetRas: [87.9, 27.0, -17.2],
          cameraPreset: 'plateau',
          cameraDistanceScale: 1.0,
          viewMode3D: 'plateau-topdown',
          mriPlane: 'coronal',
          mriContrast: 'meniscus-cruciate',
          mriZoom: 1.4,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [58.0, 27.0, -4.0],
              toRas: [81.0, 27.0, -16.5],
              tone: 'cyan',
              label: 'Medial Meniscal Body',
            },
          ],
          keyFact:
            'Uniformly black fibrocartilage triangle in cross-section; body extrusion beyond tibial rim must stay <= 3 mm.',
        },
        subLandmarks: [
          {
            id: 'anat-mm-ant-horn',
            label: 'Anterior Horn (Small)',
            structureId: 'MedialMeniscus',
            targetRas: [95.0, 44.0, -16.5],
            cameraPreset: 'anterior',
            cameraDistanceScale: 1.02,
            viewMode3D: 'plateau-topdown',
            mriPlane: 'sagittal',
            mriContrast: 'meniscus-cruciate',
            mriZoom: 1.45,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [95.0, 62.0, 2.0],
                toRas: [95.0, 45.0, -14.5],
                tone: 'cyan',
                label: 'Medial Anterior Horn',
              },
            ],
            keyFact:
              'Half the size of the posterior horn; beware normal transverse intermeniscal ligament mimic anteriorly.',
          },
          {
            id: 'anat-mm-post-horn',
            label: 'Posterior Horn (2× Larger)',
            structureId: 'MedialMeniscus',
            targetRas: [91.0, 4.0, -16.5],
            cameraPreset: 'posterior',
            cameraDistanceScale: 1.02,
            viewMode3D: 'plateau-topdown',
            mriPlane: 'sagittal',
            mriContrast: 'meniscus-cruciate',
            mriZoom: 1.45,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [91.0, -16.0, 2.0],
                toRas: [91.0, 2.5, -14.5],
                tone: 'cyan',
                label: 'Medial Posterior Horn',
              },
            ],
            keyFact:
              'Most frequent location of meniscal tears (~60%); posterior triangle should be ~2× larger than anterior horn.',
          },
          {
            id: 'anat-mm-post-root',
            label: 'Posterior Medial Root',
            structureId: 'MedialMeniscus',
            targetRas: [105.5, 8.5, -16.5],
            cameraPreset: 'posterior',
            cameraDistanceScale: 1.02,
            viewMode3D: 'joint-interior',
            mriPlane: 'coronal',
            mriContrast: 'meniscus-cruciate',
            mriZoom: 1.45,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [82.0, 8.5, 4.0],
                toRas: [104.5, 8.5, -15.0],
                tone: 'cyan',
                label: 'Posterior Root Anchor',
              },
            ],
            keyFact:
              'Must remain continuously dark up to the tibial plateau just anterior to PCL — interruption = "Ghost Sign".',
          },
        ],
      },
      {
        structureId: 'LateralMeniscus',
        label: 'Lateral Meniscus (O-Shaped)',
        shortMeta: 'Symmetric Bow-Tie · Popliteal Hiatus',
        defaultLandmark: {
          id: 'anat-lat-men',
          label: 'Lateral Meniscus (Full O-Ring)',
          structureId: 'LateralMeniscus',
          targetRas: [137.2, 14.2, -11.6],
          cameraPreset: 'plateau',
          cameraDistanceScale: 1.0,
          viewMode3D: 'plateau-topdown',
          mriPlane: 'sagittal',
          mriContrast: 'meniscus-cruciate',
          mriZoom: 1.4,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [137.2, -8.0, 6.0],
              toRas: [137.2, 8.0, -11.6],
              tone: 'cyan',
              label: 'Lateral Bow-Tie Horns',
            },
          ],
          keyFact:
            'Anterior & posterior horns are nearly equal in size; symmetric bow-tie should not exceed 2–3 sagittal slices (> 3 = discoid meniscus).',
        },
        subLandmarks: [
          {
            id: 'anat-lm-post-hiatus',
            label: 'Posterior Horn & Popliteal Hiatus',
            structureId: 'LateralMeniscus',
            targetRas: [132.0, 6.0, -15.5],
            cameraPreset: 'lateral',
            cameraDistanceScale: 1.02,
            viewMode3D: 'plateau-topdown',
            mriPlane: 'sagittal',
            mriContrast: 'meniscus-cruciate',
            mriZoom: 1.45,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [132.0, -18.0, -2.0],
                toRas: [132.0, 3.0, -14.5],
                tone: 'cyan',
                label: 'Popliteal Hiatus Zone',
              },
            ],
            keyFact:
              'Popliteus tendon passes through the normal posterolateral hiatus — do not mistake superior/inferior fascicles for a peripheral tear.',
          },
        ],
      },
    ],
  },
  {
    id: 'cruciate',
    title: 'Cruciate Ligaments',
    visibilityKey: 'cruciates',
    entries: [
      {
        structureId: 'ACL',
        label: 'Anterior Cruciate Ligament (ACL)',
        shortMeta: 'PM Lat. Condyle -> AM Tibia',
        defaultLandmark: {
          id: 'anat-acl',
          label: 'ACL (Midsubstance)',
          structureId: 'ACL',
          targetRas: [112.5, 26.9, 1.1],
          cameraPreset: 'notch',
          cameraDistanceScale: 1.02,
          viewMode3D: 'joint-interior',
          mriPlane: 'sagittal',
          mriContrast: 'meniscus-cruciate',
          mriZoom: 1.45,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [112.5, 48.0, 12.0],
              toRas: [112.5, 29.0, 2.5],
              tone: 'cyan',
              label: 'Native ACL (|| Blumensaat)',
            },
          ],
          keyFact:
            'Taut striated band parallel to Blumensaat intercondylar roof; slight distal gray striations on PD from synovium/fat are normal.',
        },
        subLandmarks: [
          {
            id: 'anat-acl-femoral',
            label: 'Femoral Origin (Lat. Condyle Wall)',
            structureId: 'ACL',
            targetRas: [119.0, 18.5, 8.0],
            cameraPreset: 'notch',
            cameraDistanceScale: 1.0,
            viewMode3D: 'joint-interior',
            mriPlane: 'coronal',
            mriContrast: 'meniscus-cruciate',
            mriZoom: 1.5,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [96.0, 18.5, 26.0],
                toRas: [117.5, 18.5, 9.5],
                tone: 'cyan',
                label: 'Proximal ACL Origin',
              },
            ],
            keyFact:
              'Proximal third fibers at the posteromedial wall of the lateral femoral condyle are the most common tear site ("empty notch sign").',
          },
          {
            id: 'anat-acl-tibial',
            label: 'Tibial Footprint (Anteromedial)',
            structureId: 'ACL',
            targetRas: [110.5, 34.0, -12.5],
            cameraPreset: 'anterior',
            cameraDistanceScale: 1.02,
            viewMode3D: 'joint-interior',
            mriPlane: 'sagittal',
            mriContrast: 'meniscus-cruciate',
            mriZoom: 1.45,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [110.5, 56.0, -2.0],
                toRas: [110.5, 36.0, -11.5],
                tone: 'cyan',
                label: 'Tibial ACL Footprint',
              },
            ],
            keyFact:
              'Inserts immediately anterior to the medial tibial spine; check for anterior tibial translocation > 5–7 mm relative to femoral condyle.',
          },
        ],
      },
      {
        structureId: 'PCL',
        label: 'Posterior Cruciate Ligament (PCL)',
        shortMeta: 'Uniform 3–4 mm black arc',
        defaultLandmark: {
          id: 'anat-pcl',
          label: 'PCL (Full Arch)',
          structureId: 'PCL',
          targetRas: [113.8, 20.1, -10.2],
          cameraPreset: 'medial',
          cameraDistanceScale: 1.02,
          viewMode3D: 'joint-interior',
          mriPlane: 'sagittal',
          mriContrast: 'meniscus-cruciate',
          mriZoom: 1.45,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [113.8, -6.0, 8.0],
              toRas: [113.8, 17.5, -7.5],
              tone: 'cyan',
              label: 'Native Dark PCL Arc',
            },
          ],
          keyFact:
            'Uniformly black low-signal arc ~2× thicker than ACL; any parallel dark ribbon beneath it = Double PCL bucket-handle fragment.',
        },
        subLandmarks: [
          {
            id: 'anat-pcl-fossa',
            label: 'Posterior Tibial Fossa Insertion',
            structureId: 'PCL',
            targetRas: [114.5, 10.5, -20.5],
            cameraPreset: 'posterior',
            cameraDistanceScale: 1.02,
            viewMode3D: 'joint-interior',
            mriPlane: 'sagittal',
            mriContrast: 'meniscus-cruciate',
            mriZoom: 1.45,
            mriAnnotations: [
              {
                kind: 'arrow',
                fromRas: [114.5, -14.0, -10.0],
                toRas: [114.5, 8.5, -19.5],
                tone: 'cyan',
                label: 'Tibial PCL Insertion',
              },
            ],
            keyFact:
              'Inserts 1 cm below the posterior articular surface; inspect here for PCL avulsion fractures after dashboard impact.',
          },
        ],
      },
    ],
  },
  {
    id: 'collateral',
    title: 'Collateral Ligaments',
    visibilityKey: 'collaterals',
    entries: [
      {
        structureId: 'MCL',
        label: 'Medial Collateral Ligament (MCL)',
        shortMeta: '3-layer valgus stabilizer',
        defaultLandmark: {
          id: 'anat-mcl',
          label: 'MCL (Superficial & Deep Bands)',
          structureId: 'MCL',
          targetRas: [68.3, 15.2, -16.4],
          cameraPreset: 'medial',
          cameraDistanceScale: 1.04,
          viewMode3D: 'solid',
          mriPlane: 'coronal',
          mriContrast: 'meniscus-cruciate',
          mriZoom: 1.35,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [46.0, 15.2, -4.0],
              toRas: [66.5, 15.2, -14.0],
              tone: 'cyan',
              label: 'Taut Black MCL Band',
            },
          ],
          keyFact:
            'Taut low-signal band on coronal slices spanning medial femoral epicondyle to proximal medial tibia; deep band tethers medial meniscus.',
        },
      },
      {
        structureId: 'LCL',
        label: 'Lateral Collateral Ligament (LCL)',
        shortMeta: 'Cord-like -> Fibular Head',
        defaultLandmark: {
          id: 'anat-lcl',
          label: 'LCL (Fibular Collateral)',
          structureId: 'LCL',
          targetRas: [158.8, 9.2, -13.2],
          cameraPreset: 'lateral',
          cameraDistanceScale: 1.04,
          viewMode3D: 'solid',
          mriPlane: 'coronal',
          mriContrast: 'meniscus-cruciate',
          mriZoom: 1.35,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [179.0, 9.2, 2.0],
              toRas: [160.0, 9.2, -11.0],
              tone: 'cyan',
              label: 'Cord-like LCL',
            },
          ],
          keyFact:
            'Round cord-like dark band running obliquely posteriorly to join biceps femoris on fibular head; always evaluate with popliteus (PLC).',
        },
      },
    ],
  },
  {
    id: 'extensor',
    title: 'Extensor Mechanism',
    visibilityKey: 'extensor',
    entries: [
      {
        structureId: 'QuadricepsTendon',
        label: 'Quadriceps Tendon',
        shortMeta: 'Trilaminar superior insertion',
        defaultLandmark: {
          id: 'anat-quad',
          label: 'Quadriceps Tendon',
          structureId: 'QuadricepsTendon',
          targetRas: [123.1, 71.4, 48.0],
          cameraPreset: 'anterior',
          cameraDistanceScale: 1.05,
          viewMode3D: 'solid',
          mriPlane: 'sagittal',
          mriContrast: 'meniscus-cruciate',
          mriZoom: 1.3,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [123.1, 92.0, 56.0],
              toRas: [123.1, 73.5, 48.0],
              tone: 'cyan',
              label: 'Trilaminar Quad Tendon',
            },
          ],
          keyFact:
            'Layered confluence of rectus femoris, vastus intermedius, VMO, and vastus lateralis inserting on superior patellar pole.',
        },
      },
      {
        structureId: 'PatellarTendon',
        label: 'Patellar Tendon (Ligament)',
        shortMeta: '3–5 mm thick · Insall-Salvati',
        defaultLandmark: {
          id: 'anat-pat-tendon',
          label: 'Patellar Tendon',
          structureId: 'PatellarTendon',
          targetRas: [121.2, 62.9, -22.4],
          cameraPreset: 'lateral',
          cameraDistanceScale: 1.05,
          viewMode3D: 'solid',
          mriPlane: 'sagittal',
          mriContrast: 'meniscus-cruciate',
          mriZoom: 1.3,
          mriAnnotations: [
            {
              kind: 'arrow',
              fromRas: [121.2, 84.0, -14.0],
              toRas: [121.2, 65.0, -21.0],
              tone: 'cyan',
              label: 'Patellar Tendon',
            },
          ],
          keyFact:
            'Uniformly black band (3–5 mm) from inferior patellar pole to tibial tubercle; proximal posterior thickening = Jumper knee.',
        },
      },
    ],
  },
];

export const MRI_REPORTING_SECTIONS: ReportingGuideSection[] = [
  {
    id: 'search-pattern',
    stepNumber: '01',
    title: '6-Step Search Pattern & Sequence Roles',
    subtitle: 'Standardize every knee MRI read so high-yield findings are never missed.',
    takeaway:
      'Pick each structure using its strongest orthogonal plane, then always confirm every suspected abnormality in a second plane.',
    diagramKind: 'sequence-matrix',
    cards: [
      {
        id: 'seq-t1-pd',
        title: 'Fluid-Sensitive (PD FS / T2 FS / qDESS) vs T1 Marrow',
        bestPlanes: 'All 3 planes + Sagittal T1 non-FS',
        normalLook:
          'Water-suppressed marrow trabeculae appear uniformly dark gray/black; fluid and smooth hyaline cartilage gleam bright.',
        pathologySigns: [
          'True fracture lines: sharply marginated low-signal T1 band beneath T2 marrow edema.',
          'Bone bruises (contusions): geographic T2 hyperintensity without a sharp T1 cortical break.',
        ],
        gradingOrRule:
          'Never call an occult fracture without checking T1 / non-fat-suppressed images for a discrete cortical/trabecular line.',
        dictationNormal:
          'Marrow signal intensity is normal throughout the distal femur, proximal tibia, fibula, and patella without fracture or marrow contusion.',
        dictationAbnormal:
          'Geographic bone marrow contusion without discrete T1 fracture line involving the lateral femoral condyle and posterolateral tibial plateau.',
        linkedMode: 'anatomy',
        linkedStructureId: 'Femur',
      },
      {
        id: 'seq-plane-order',
        title: 'Systematic Resident Scroll Order',
        bestPlanes: 'Sagittal -> Coronal -> Axial',
        normalLook:
          'Scroll medial-to-lateral on Sagittal (Medial Meniscus -> ACL/PCL -> Lateral Meniscus), anterior-to-posterior on Coronal, superior-to-inferior on Axial.',
        pathologySigns: [
          'Sagittal first: meniscal bow-tie & horns, ACL along Blumensaat line, PCL dark arc, extensor tendons.',
          'Coronal second: MCL, LCL, meniscal extrusion (> 3 mm), root attachment, femoral condyles.',
          'Axial third: patellar tracking/MPFL, trochlear dysplasia, Hoffa fat pad, Baker cyst.',
        ],
        gradingOrRule:
          'Rule of Two: Confirm any meniscal or chondral lesion on >= 2 consecutive slices or 2 orthogonal planes.',
        dictationNormal:
          'Systematic evaluation across sagittal, coronal, and axial 3D sequences demonstrates preserved internal derangement structures.',
        dictationAbnormal:
          'Multisequence correlation confirms full-thickness internal derangement confirmed across two orthogonal planes.',
        linkedMode: 'anatomy',
        linkedStructureId: 'MedialMeniscus',
      },
    ],
  },
  {
    id: 'menisci-roots',
    stepNumber: '02',
    title: 'Menisci, Tear Shapes & Posterior Roots',
    subtitle: 'Separate degenerative intrasubstance signal from true reparable or unstable tears.',
    takeaway:
      'High signal counts as a tear ONLY when it unequivocally contacts the superior or inferior articular surface on 2 slices.',
    diagramKind: 'meniscal-tears',
    cards: [
      {
        id: 'men-tear-types',
        title: 'Longitudinal vs Radial vs Horizontal Tears',
        bestPlanes: 'Sagittal + Coronal + Axial (PD / qDESS)',
        normalLook:
          'Crisp low-signal triangular wedge; medial posterior horn ~2× larger than anterior horn; lateral horns symmetric.',
        pathologySigns: [
          'Longitudinal (vertical): vertical line parallel to outer capsule — ACL trauma association.',
          'Radial (transverse): marches perpendicular into free edge — "Truncated Triangle" or "Marching Cleft".',
          'Horizontal (cleavage): fish-mouth horizontal line connecting to parameniscal cyst at capsule rim.',
        ],
        gradingOrRule:
          'Check peripheral vs central third ("red zone vs white zone") and articular surface contact on >= 2 slices.',
        dictationNormal:
          'Medial and lateral menisci demonstrate normal triangular morphology and homogeneous low signal without surface-extending tear or extrusion.',
        dictationAbnormal:
          'Horizontal cleavage tear of the medial meniscal posterior horn and body extending to the meniscocapsular junction with a lobulated medial parameniscal cyst.',
        linkedMode: 'pathology',
        linkedModuleId: 'meniscal-tears-3d',
      },
      {
        id: 'men-bucket-handle',
        title: 'Displaced Bucket-Handle Tear (Locked Knee)',
        bestPlanes: 'Sagittal midline + Coronal intercondylar notch',
        normalLook:
          'Single thick black PCL curve in midline notch; 2–3 intact sagittal meniscal bow-tie slices.',
        pathologySigns: [
          'Double PCL sign: second parallel dark fibrocartilage fragment anteroinferior to native PCL.',
          'Absent bow-tie sign (< 2 bow-tie slices) + truncated peripheral meniscal remnant.',
          'Flipped anterior horn sign ("double anterior horn").',
        ],
        gradingOrRule:
          'Always measure fragment displacement into the notch — a displaced fragment is an urgent surgical locking finding.',
        dictationNormal:
          'No displaced meniscal fragment within the intercondylar notch; normal bow-tie configuration preserved.',
        dictationAbnormal:
          'Displaced bucket-handle tear of the medial meniscus with a flipped central fragment parallel to the intact PCL ("Double PCL sign") and a truncated peripheral remnant.',
        linkedMode: 'pathology',
        linkedModuleId: 'bucket-handle',
      },
      {
        id: 'men-root-extrusion',
        title: 'Posterior Root Tears & > 3 mm Extrusion',
        bestPlanes: 'Coronal at MCL body + Sagittal at root insertion',
        normalLook:
          'Continuous dark meniscal root bridging onto tibial spine just anterior to PCL; <= 3 mm radial extrusion.',
        pathologySigns: [
          'Ghost sign: sudden disappearance of dark posterior horn on sagittal root slice.',
          'Coronal cleft immediately medial to PCL tibial attachment ("truncation sign").',
          'Medial extrusion > 3 mm beyond medial tibial cortex -> rapid chondral loss & subchondral insufficiency fracture (SIFK).',
        ],
        gradingOrRule:
          'Measure extrusion on the coronal slice intersecting the MCL body from the outer meniscal edge to the tibial osteophyte-excluded cortex.',
        dictationNormal:
          'Anterior and posterior meniscal root attachments are intact without meniscal extrusion.',
        dictationAbnormal:
          'Complete radial tear of the posterior medial meniscal root ("Ghost sign") resulting in 4.2 mm medial meniscal extrusion past the tibial plateau margin.',
        linkedMode: 'pathology',
        linkedModuleId: 'posterior-root',
      },
    ],
  },
  {
    id: 'cruciates',
    stepNumber: '03',
    title: 'Cruciate Ligaments (ACL & PCL)',
    subtitle: 'Distinguish primary fiber discontinuity from secondary instability signs.',
    takeaway:
      'True ACL rupture pairs loss of Blumensaat-parallel fibers with > 5–7 mm anterior tibial translation & pivot-shift marrow bruises.',
    diagramKind: 'bruise-footprints',
    cards: [
      {
        id: 'cru-acl',
        title: 'ACL Rupture + Pivot-Shift Triad',
        bestPlanes: 'Sagittal + Coronal + Axial (Proximal notch)',
        normalLook:
          'Taut straight band parallel to Blumensaat line; slight distal striations normal.',
        pathologySigns: [
          'Primary: focal gap, edematous amorphous mass, wavy slack distal fibers, "empty notch sign" on coronal.',
          'Secondary: anterior tibial translation > 5 mm relative to lateral femoral condyle ("uncovered posterior horn").',
          'Kissing bruises: mid-lateral femoral condyle (terminal sulcus) + posterolateral tibial plateau.',
          'Look for Segond avulsion flake on lateral tibial rim (> 90% ACL tear specificity!).',
        ],
        gradingOrRule:
          'Always check for associated Ramp lesion (posterior meniscocapsular separation) and Segond avulsion in acute ACL tears.',
        dictationNormal:
          'Anterior cruciate ligament is intact with normal taut course parallel to the intercondylar roof.',
        dictationAbnormal:
          'Complete proximal tear of the ACL with fiber discontinuity, +7.6 mm anterior tibial translation, and pivot-shift bone marrow contusions of the lateral femoral condyle and posterolateral tibial plateau.',
        linkedMode: 'pathology',
        linkedModuleId: 'acl-rupture',
      },
      {
        id: 'cru-pcl',
        title: 'PCL Tear ("Dashboard" Hyperflexion Injury)',
        bestPlanes: 'Sagittal midline + Axial',
        normalLook:
          'Uniformly black curved arc (3–4 mm thick; AP thickness <= 6 mm).',
        pathologySigns: [
          'Thickened > 7 mm amorphous T2-bright cord or complete discontinuity.',
          'Posterior tibial sag relative to femur + buckling of distal fibers.',
          'Anteromedial/anterior tibial plateau contusion from direct dashboard impact.',
        ],
        gradingOrRule:
          'Always inspect the Posterolateral Corner (LCL + popliteus) — isolated PCL tears are rare in high-energy trauma.',
        dictationNormal:
          'Posterior cruciate ligament demonstrates uniform low signal intensity and smooth curvilinear contour.',
        dictationAbnormal:
          'High-grade intrasubstance tear of the PCL with posterior tibial sag and anterior proximal tibial marrow contusion.',
        linkedMode: 'pathology',
        linkedModuleId: 'pcl-dashboard',
      },
    ],
  },
  {
    id: 'collaterals-plc',
    stepNumber: '04',
    title: 'Collaterals & Posterolateral Corner',
    subtitle: 'Check medial MCL bursa/valgus grading and the posterolateral fibular corner.',
    takeaway:
      'An ACL + MCL tear triggers an immediate check of the Medial Meniscus (O’Donoghue Unhappy Triad).',
    cards: [
      {
        id: 'col-mcl',
        title: 'MCL Sprain Grading & Unhappy Triad',
        bestPlanes: 'Coronal + Axial medial gutter',
        normalLook: 'Thin taut dark band hugging medial femur and tibia (~5 cm below joint line).',
        pathologySigns: [
          'Grade I: periligamentous edema with intact dark fibers.',
          'Grade II: partial disruption + wavy/thickened fibers.',
          'Grade III: complete disruption ("Stener-like" tibial avulsion flipped over pes anserinus).',
        ],
        gradingOrRule:
          'Always pair valgus MCL assessment with ACL and Medial/Lateral Meniscus check.',
        dictationNormal:
          'Superficial and deep bands of the medial collateral ligament are intact without pericapsular edema.',
        dictationAbnormal:
          'Grade II–III proximal MCL disruption with extensive periligamentous edema, accompanying ACL rupture and medial meniscal tear (O’Donoghue triad pattern).',
        linkedMode: 'pathology',
        linkedModuleId: 'unhappy-triad',
      },
      {
        id: 'col-lcl-plc',
        title: 'Lateral Collateral Ligament & Posterolateral Corner',
        bestPlanes: 'Coronal posterior slices + Axial at fibular head',
        normalLook: 'Taut dark LCL cord + biceps femoris conjoint tendon inserting cleanly on fibular head.',
        pathologySigns: [
          'Fibular styloid bone marrow edema or avulsion fracture ("arcuate sign").',
          'Popliteus myotendinous strain/edema + LCL discontinuity at fibular head.',
        ],
        gradingOrRule:
          'Report LCL, biceps femoris, and popliteus together — missed PLC tears cause ACL/PCL graft failure.',
        dictationNormal:
          'LCL, biceps femoris tendon, and popliteus myotendinous unit of the posterolateral corner are intact.',
        dictationAbnormal:
          'Posterolateral corner injury with distal LCL avulsion and fibular styloid marrow edema ("arcuate" pattern).',
        linkedMode: 'anatomy',
        linkedStructureId: 'LCL',
      },
    ],
  },
  {
    id: 'patellofemoral',
    stepNumber: '05',
    title: 'Patellofemoral Tracking, MPFL & Extensor',
    subtitle: 'Spot spontaneous patellar dislocation footprints even when the patella reduced on scene.',
    takeaway:
      'Medial patellar bruise + Anterolateral femoral condyle bruise + Torn MPFL = 100% specific for transient lateral patellar dislocation.',
    cards: [
      {
        id: 'pat-mpfl',
        title: 'Transient Lateral Patellar Dislocation + MPFL',
        bestPlanes: 'Axial from superior patella to tibial tubercle',
        normalLook:
          'Patella centered cleanly inside deep trochlear groove; intact dark thin MPFL bridging medial patella to adductor tubercle.',
        pathologySigns: [
          'Torn MPFL (medial retinaculum disruption + VMO elevation + fluid tracking).',
          'Kissing bruises: inferomedial patella + anterolateral femoral condyle non-weight-bearing rim.',
          'Check for loose intra-articular osteochondral body (often in lateral gutter).',
        ],
        gradingOrRule:
          'Assess TT-TG distance (> 20 mm abnormal), Patella Alta (Insall-Salvati > 1.3), and trochlear sulcus angle (> 145° dysplastic).',
        dictationNormal:
          'Patella is normally centered within the trochlear groove with intact medial patellofemoral ligament and extensor tendons.',
        dictationAbnormal:
          'Signature findings of recent transient lateral patellar dislocation: complete MPFL tear at the femoral origin, lateral patellar tilt, and kissing contusions of the inferomedial patella and anterolateral femoral condyle.',
        linkedMode: 'pathology',
        linkedModuleId: 'patellar-dislocation',
      },
      {
        id: 'pat-extensor',
        title: 'Quadriceps & Patellar Tendons + Hoffa Fat Pad',
        bestPlanes: 'Sagittal midline + Axial',
        normalLook: 'Homogeneously black tendon bands; clean feathery fat inside Hoffa infrapatellar pad.',
        pathologySigns: [
          'Proximal posterior patellar tendon thickening + fluid ("Jumper knee").',
          'Superolateral Hoffa fat pad edema between lateral femoral condyle and patellar tendon (maltracking impingement).',
        ],
        gradingOrRule:
          'Calculate Insall-Salvati ratio on sagittal midline slice (patellar tendon / patellar pole length; normal 0.8–1.2).',
        dictationNormal: 'Quadriceps tendon, patellar tendon, and Hoffa infrapatellar fat pad are unremarkable.',
        dictationAbnormal:
          'Proximal patellar tendinopathy with focal posterior signal hyperintensity and mild superolateral Hoffa fat pad edema.',
        linkedMode: 'anatomy',
        linkedStructureId: 'PatellarTendon',
      },
    ],
  },
  {
    id: 'cartilage-oa',
    stepNumber: '06',
    title: 'Chondral Grading & Bone Bruise Map',
    subtitle: 'Grade hyaline articular cartilage systematically using modified Outerbridge / ICRS criteria.',
    takeaway:
      'Always evaluate subchondral bone marrow beneath every high-grade chondral defect for subchondral edema, cysts, or delamination.',
    diagramKind: 'chondral-grades',
    cards: [
      {
        id: 'cart-outerbridge',
        title: 'Modified Outerbridge Chondral Grading (I–IV)',
        bestPlanes: 'Two orthogonal planes (Chondral Window)',
        normalLook: 'Smooth bright hyaline envelope (1.7–3.7 mm) without fissuring or underlying marrow reaction.',
        pathologySigns: [
          'Grade I: focal blistering / signal heterogeneity with intact surface contour.',
          'Grade II: partial-thickness fissuring < 50% of cartilage depth.',
          'Grade III: deep fissuring > 50% depth without exposed subchondral bone.',
          'Grade IV: full-thickness loss exposing dark subchondral bone +/- marrow edema/cysts.',
        ],
        gradingOrRule:
          'Check every focal defect for unstable peripheral flaps (fluid undermining cartilage–bone interface).',
        dictationNormal:
          'Articular cartilage surfaces are preserved across the medial, lateral, and patellofemoral compartments.',
        dictationAbnormal:
          'Full-thickness (Outerbridge Grade IV) chondral loss over the weight-bearing medial femoral condyle with subchondral marrow edema and marginal osteophyte formation.',
        linkedMode: 'pathology',
        linkedModuleId: 'chondral-oa',
      },
    ],
  },
  {
    id: 'dictation-template',
    stepNumber: '07',
    title: 'Copyable Structured Knee MRI Template',
    subtitle: 'Clean compartment-by-compartment PowerScribe skeleton.',
    takeaway: 'Keep findings grouped strictly by compartment so orthopedic surgeons can scan in 10 seconds.',
    cards: [
      {
        id: 'tmpl-complete',
        title: 'Complete Structured Normal Knee Template',
        bestPlanes: 'Standard 3T Multi-Planar Knee MRI',
        normalLook: 'Ready-to-paste structured report skeleton covering all compartments.',
        pathologySigns: [
          'Edit only involved compartments; leave normal compartments concise and parallel.',
          'Include alignment/tracking measurements (extrusion mm, TT-TG) whenever abnormal.',
        ],
        gradingOrRule: 'Keep Impression numbered by clinical priority (1. Surgical lesion, 2. Secondary/cartilage, 3. Effusion).',
        dictationNormal: `EXAM: MRI RIGHT KNEE WITHOUT IV CONTRAST (3T qDESS)
FINDINGS:
- BONES & MARROW: Normal alignment and marrow signal without fracture, contusion, or osteonecrosis.
- MEDIAL COMPARTMENT: Medial meniscus and posterior root are intact without tear or extrusion. Weight-bearing articular cartilage is preserved.
- LATERAL COMPARTMENT: Lateral meniscus is intact without tear. Lateral compartment articular cartilage is preserved.
- PATELLOFEMORAL: Patella centers cleanly in the trochlear groove; MPFL and retropatellar cartilage are intact.
- LIGAMENTS & TENDONS: ACL, PCL, MCL, LCL, posterolateral corner, quadriceps tendon, and patellar tendon are intact.
- JOINT / SOFT TISSUES: No significant joint effusion or popliteal cyst.

IMPRESSION:
1. Unremarkable 3T MRI of the right knee without internal derangement.`,
        dictationAbnormal: `IMPRESSION EXAMPLES:
1. Complete proximal ACL tear with +7.6 mm anterior tibial drawer and pivot-shift bone bruises; intact PCL.
2. Displaced medial meniscal bucket-handle tear ("Double PCL sign") with truncated peripheral rim.
3. Transient lateral patellar dislocation footprint: torn femoral-origin MPFL with kissing medial patellar and anterolateral condylar bruises.`,
      },
    ],
  },
];

export const PATIENT_DEMO_PRESETS: PatientDemoPreset[] = [
  {
    id: 'demo-healthy',
    label: 'Healthy Normal Knee',
    group: 'healthy',
    moduleId: 'normal-overview',
    subStepIndex: 0,
    patientTitle: 'Healthy Right Knee Joint',
    patientSummary:
      'Smooth pearly cartilage cushions the ends of the femur and tibia, two shock-absorbing menisci sit cleanly between them, and four taut ligaments stabilize every bend.',
    clinicalSummary:
      'All compartments intact: congruent patellofemoral tracking, smooth 2–3 mm hyaline envelope, normal C/O menisci, and intact cruciates & collaterals.',
  },
  {
    id: 'demo-acl',
    label: 'ACL Tear + Instability',
    group: 'pathology',
    moduleId: 'acl-rupture',
    subStepIndex: 0,
    patientTitle: 'Torn Anterior Cruciate Ligament (ACL)',
    patientSummary:
      'The central front stabilizer (ACL) has ruptured, allowing the shin bone (tibia) to slide abnormally forward when the knee bends.',
    clinicalSummary:
      'Complete ACL fiber disruption with pivot-shift kissing marrow contusions and +7.6 mm Lachman anterior tibial drawer.',
  },
  {
    id: 'demo-bucket',
    label: 'Bucket-Handle Tear',
    group: 'pathology',
    moduleId: 'bucket-handle',
    subStepIndex: 0,
    patientTitle: 'Locked Knee: Flipped Bucket-Handle Tear',
    patientSummary:
      'A large strip of the inner shock absorber (medial meniscus) has torn lengthwise and flipped into the center notch, mechanically blocking full straightening.',
    clinicalSummary:
      'Displaced longitudinal medial meniscal tear with fragment flipped anteroinferior to PCL ("Double PCL sign").',
  },
  {
    id: 'demo-meniscus',
    label: 'Meniscal Tear + Cyst',
    group: 'pathology',
    moduleId: 'meniscal-tears-3d',
    subStepIndex: 2,
    patientTitle: 'Horizontal Meniscal Tear & Joint Cyst',
    patientSummary:
      'Joint fluid squeezes through a horizontal split in the meniscus and collects into a small fluid-filled sac (parameniscal cyst) along the inner edge of the knee.',
    clinicalSummary:
      'Horizontal cleavage tear extending to the meniscocapsular rim decompressing into a lobulated medial parameniscal cyst.',
  },
  {
    id: 'demo-root',
    label: 'Root Tear + Extrusion',
    group: 'pathology',
    moduleId: 'posterior-root',
    subStepIndex: 0,
    patientTitle: 'Meniscal Root Avulsion ("Bulging Cushion")',
    patientSummary:
      'When the back anchor (root) detaches from the bone, the meniscus loses tension and squeezes outward (+4.2 mm), leaving cartilage bone-on-bone.',
    clinicalSummary:
      'Complete posterior medial meniscal root tear ("Ghost sign") causing > 3 mm radial extrusion and accelerated medial compartment overload.',
  },
  {
    id: 'demo-pcl',
    label: 'PCL Tear (Sag)',
    group: 'pathology',
    moduleId: 'pcl-dashboard',
    subStepIndex: 0,
    patientTitle: 'Torn Posterior Cruciate Ligament (PCL)',
    patientSummary:
      'A direct impact to the bent shin pushes the lower leg backward and tears the sturdy rear stabilizer (PCL), causing a visible posterior sag.',
    clinicalSummary:
      'High-grade PCL tear with -8.2 mm posterior tibial sag and anterior proximal tibial "dashboard" contusion.',
  },
  {
    id: 'demo-triad',
    label: 'Unhappy Triad (ACL+MCL)',
    group: 'pathology',
    moduleId: 'unhappy-triad',
    subStepIndex: 0,
    patientTitle: 'Combined Sports Injury (Unhappy Triad)',
    patientSummary:
      'A forceful sideways twist injures three structures together: the central ACL, the inner side strap (MCL), and the cushion (meniscus).',
    clinicalSummary:
      'O’Donoghue valgus + external rotation injury combining ACL rupture, Grade II–III MCL tear, and meniscal pathology.',
  },
  {
    id: 'demo-patella',
    label: 'Patella Dislocation + MPFL',
    group: 'pathology',
    moduleId: 'patellar-dislocation',
    subStepIndex: 0,
    patientTitle: 'Kneecap Dislocation & Torn Side Restraint',
    patientSummary:
      'When the kneecap slips out toward the outer side, it stretches or tears the inner restraining strap (MPFL) and bruises the bone surfaces as it snaps back.',
    clinicalSummary:
      'Lateral patellar subluxation tearing the MPFL with kissing inferomedial patella and anterolateral condyle bruises.',
  },
  {
    id: 'demo-oa',
    label: 'Chondral Loss / OA',
    group: 'pathology',
    moduleId: 'chondral-oa',
    subStepIndex: 0,
    patientTitle: 'Focal Cartilage Wear (Osteoarthritis)',
    patientSummary:
      'Wearing down of the smooth white cartilage cushion exposes raw underlying bone on the weight-bearing inner condyle.',
    clinicalSummary:
      'Focal high-grade Outerbridge III–IV medial femoral condylar cartilage defect with subchondral stress reaction.',
  },
];
