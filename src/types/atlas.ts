export type JointId = 'ankle' | 'knee' | 'shoulder' | 'wrist' | 'elbow' | 'hip';

export type StructureId = string;

export type TissueGroup = string;

export type MriContrastPreset =
  | 'qdess-clinical'
  | 'meniscus-cruciate'
  | 'chondral'
  | 'trabecular'
  | (string & {});

export type MriOverlayMode = 'none' | 'atlas' | 'subregions';

export type MriPlaneMode = 'sagittal' | 'coronal' | 'axial' | 'multiplanar';

export type ModuleCategory = 'normal' | 'approach' | 'pathology';

export type ModuleId = string;
export type KneeModuleId = ModuleId;
export type KneeChapterId = ModuleId;

export type SpecimenViewMode =
  | 'solid'
  | 'joint-interior'
  | 'plateau-topdown'
  | 'cartilage-map';

export type CameraPresetKey =
  | 'anterior'
  | 'notch'
  | 'medial'
  | 'lateral'
  | 'plateau'
  | 'posterior';

export type MeniscalTearMorphology =
  | 'none'
  | 'longitudinal'
  | 'radial'
  | 'horizontal';

export type ThemeMode = 'darkroom' | 'monograph';

export type LayerSelectMode = 'multiple' | 'single';

export type AppWorkspaceMode =
  | 'landing'
  | 'anatomy'
  | 'fullscreen-3d'
  | 'pathology'
  | 'report-guide'
  | 'quiz';

export type MriAnnotationTone = 'cyan' | 'crimson' | 'amber' | 'emerald';

export type MriAnnotation =
  | {
      kind: 'arrow';
      fromRas: [number, number, number];
      toRas: [number, number, number];
      label?: string;
      tone?: MriAnnotationTone;
      curved?: number;
      dashed?: boolean;
    }
  | {
      kind: 'edema';
      centerRas: [number, number, number];
      radiusMm: number;
      label?: string;
      tone?: MriAnnotationTone;
    }
  | {
      kind: 'cleft';
      pointsRas: Array<[number, number, number]>;
      label?: string;
      tone?: MriAnnotationTone;
      widthPx?: number;
      dashed?: boolean;
    }
  | {
      kind: 'region';
      pointsRas: Array<[number, number, number]>;
      label?: string;
      tone?: MriAnnotationTone;
      dashed?: boolean;
      fillOpacity?: number;
    }
  | {
      kind: 'caliper';
      aRas: [number, number, number];
      bRas: [number, number, number];
      label: string;
      tone?: MriAnnotationTone;
    };

export interface StructureLandmark {
  labelIndex: number;
  centroidRas: [number, number, number];
  centroidThree: [number, number, number];
  bboxThreeMin: [number, number, number];
  bboxThreeMax: [number, number, number];
  triangles: number;
  segVoxels: number;
}

export interface KneeLandmarks {
  specimen: string;
  laterality: 'Left' | 'Right';
  demographics: string;
  alignmentDetected: string;
  bScore?: number;
  chondralMetrics?: Record<string, number>;
  wlPresets?: Record<MriContrastPreset, { min: number; max: number }>;
  jointCenterRas: [number, number, number];
  threeScale: number;
  transepicondylarPivot: [number, number, number];
  transepicondylarAxis: [number, number, number];
  fatsatShape: [number, number, number];
  fatsatRasBounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
  structures: Record<string, StructureLandmark>;
}

export type Oks003Landmarks = KneeLandmarks;

export interface StructureClinicalInfo {
  id: StructureId;
  labelIndex: number;
  name: string;
  shortLabel: string;
  group: TissueGroup;
  mriSignal: string;
  clinicalPearl: string;
  attachmentSummary: string;
}

export interface ModuleSubStep {
  id: string;
  label: string;
  focusStructure: StructureId;
  targetRasOverride?: [number, number, number];
  targetBadge: string;
  viewMode3D: SpecimenViewMode;
  cameraPreset: CameraPresetKey;
  cameraDistanceScale?: number;
  mriPlane: MriPlaneMode;
  mriContrast: MriContrastPreset;
  mriZoom: number;
  flexionDeg: number;
  meniscalTearMorphology?: MeniscalTearMorphology;
  patellaSubluxation?: number;
  mriAnnotations?: MriAnnotation[];
  whatToLookFor: string;
  diagnosticRules: string[];
  pitfallAndHook: string;
}

export interface KneeModule {
  id: KneeModuleId;
  order: number;
  category: ModuleCategory;
  title: string;
  shortTitle: string;
  tag: string;
  diagnosticSign: string;
  summary: string;
  biomechControl?: 'flexion' | 'patella-reduction';
  subSteps: ModuleSubStep[];
  mriChecklist: string[];
  boardPearls: Array<{ exam: string; pearl: string }>;
}

export interface ResidentQuizQuestion {
  id: string;
  kind: 'locate' | 'vignette';
  prompt: string;
  hint: string;
  moduleId: KneeModuleId;
  viewMode3D: SpecimenViewMode;
  cameraPreset: CameraPresetKey;
  cameraDistanceScale?: number;
  mriPlane: MriPlaneMode;
  mriContrast: MriContrastPreset;
  mriZoom: number;
  flexionDeg: number;
  meniscalTearMorphology?: MeniscalTearMorphology;
  patellaSubluxation?: number;
  mriAnnotations?: MriAnnotation[];
  targetStructure?: StructureId;
  targetRasOverride?: [number, number, number];
  targetBadge?: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
  explanation: string;
}

export interface KneeKinematics {
  flexionDeg: number;
  flexionRad: number;
  screwHomeDeg: number;
  anteriorDrawerMm: number;
  anteriorTranslationThree: number;
  meniscalExtrusionMm: number;
  medialMeniscusShiftX: number;
  meniscusPosteriorShiftZ: number;
  patellaDropY: number;
  patellaShiftZ: number;
  patellaTiltRad: number;
  patellaLateralShiftX: number;
  patellaLateralTiltRad: number;
}

export interface TissueVisibility {
  bones: boolean;
  xrayBones: boolean;
  extensor: boolean;
  cartilage: boolean;
  thicknessMap: boolean;
  menisci: boolean;
  cruciates: boolean;
  collaterals: boolean;
  callouts: boolean;
  crossSection: boolean;
}

export interface FellowshipReport {
  examHeader: string;
  clinicalIndication: string;
  technique: string;
  findings: Array<{ compartment: string; text: string; abnormal?: boolean }>;
  impression: string[];
  recommendation: string;
  dictationText: string;
}

export type KneeChapter = KneeModule;

export interface AnatomyLandmarkItem {
  id: string;
  label: string;
  structureId: StructureId;
  targetRas?: [number, number, number];
  cameraPreset: CameraPresetKey;
  cameraDistanceScale?: number;
  viewMode3D: SpecimenViewMode;
  mriPlane: MriPlaneMode;
  mriContrast: MriContrastPreset;
  mriZoom: number;
  mriAnnotations?: MriAnnotation[];
  keyFact: string;
}

export interface AnatomyStructureEntry {
  structureId: StructureId;
  label: string;
  shortMeta: string;
  defaultLandmark: AnatomyLandmarkItem;
  subLandmarks?: AnatomyLandmarkItem[];
}

export interface AnatomySystemGroup {
  id: TissueGroup;
  title: string;
  visibilityKey: keyof TissueVisibility;
  entries: AnatomyStructureEntry[];
}

export interface ReportingChecklistCard {
  id: string;
  title: string;
  bestPlanes: string;
  normalLook: string;
  pathologySigns: string[];
  gradingOrRule: string;
  linkedMode?: 'anatomy' | 'pathology';
  linkedModuleId?: KneeModuleId;
  linkedStructureId?: StructureId;
}

export interface ReportingGuideSection {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  takeaway: string;
  diagramKind?:
    | 'sequence-matrix'
    | 'meniscal-tears'
    | 'bruise-footprints'
    | 'chondral-grades';
  cards: ReportingChecklistCard[];
}

export interface PatientDemoPreset {
  id: string;
  label: string;
  group: 'healthy' | 'pathology';
  moduleId: KneeModuleId;
  subStepIndex: number;
  patientTitle: string;
  patientSummary: string;
  clinicalSummary: string;
}

export interface PathologyReportingDetail {
  mechanism: string;
  sequencesAndPlanes: string;
  gradingTitle: string;
  grades: Array<{ label: string; detail: string }>;
  howToReport: string[];
  surgicalNote: string;
}

export type GuideTone = 'cyan' | 'amber' | 'crimson' | 'emerald';

export type GuidePlateAnnotation =
  | {
      kind: 'arrow';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      tone: GuideTone;
      label?: string;
      lx?: number;
      ly?: number;
    }
  | {
      kind: 'line';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      tone: GuideTone;
      dashed?: boolean;
      label?: string;
      lx?: number;
      ly?: number;
    }
  | {
      kind: 'zone';
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      rotate?: number;
      tone: GuideTone;
      label?: string;
      lx?: number;
      ly?: number;
    }
  | {
      kind: 'caliper';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      tone: GuideTone;
      label: string;
      lx?: number;
      ly?: number;
    };

export interface GuideFigurePlate {
  id: string;
  figureLabel: string;
  imageSrc: string;
  alt: string;
  viewBox?: string;
  annotations: GuidePlateAnnotation[];
  caption: string;
  link?: {
    label: string;
    mode: 'anatomy' | 'pathology';
    moduleId?: KneeModuleId;
    structureId?: StructureId;
  };
}

export interface GuideSubSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: Array<{ lead: string; text: string }>;
  table?: {
    columns: [string, string];
    rows: Array<[string, string]>;
  };
  pitfall?: string;
}

export interface RaGuideChapter {
  id: string;
  number: string;
  title: string;
  lead: string;
  subsections: GuideSubSection[];
  plates: GuideFigurePlate[];
}

export type Pathology3DPrimitive =
  | {
      kind: 'bruise';
      centerRas: [number, number, number];
      radiiMm: [number, number, number];
      tone?: 'crimson' | 'amber';
      parent?: 'proximal' | 'distal';
    }
  | {
      kind: 'tear-cleft';
      pointsRas: Array<[number, number, number]>;
      radiusMm?: number;
      tone?: 'crimson' | 'amber';
      parent?: 'proximal' | 'distal';
    }
  | {
      kind: 'cyst-effusion';
      centerRas: [number, number, number];
      radiiMm: [number, number, number];
      tone?: 'cyan' | 'amber' | 'crimson';
      parent?: 'proximal' | 'distal';
    }
  | {
      kind: 'fragment';
      centerRas: [number, number, number];
      radiiMm: [number, number, number];
      tone?: 'amber' | 'crimson';
      parent?: 'proximal' | 'distal';
    };

export interface JointPathology3DSpec {
  moduleId: string;
  subStepId?: string;
  damagedStructures?: string[];
  primitives: Pathology3DPrimitive[];
}

export interface JointCameraPreset {
  label: string;
  pos: [number, number, number];
  target: [number, number, number];
}

export interface LayerGroupConfig {
  id: TissueGroup;
  label: string;
  structures: StructureId[];
}

export interface ContrastPresetConfig {
  id: MriContrastPreset;
  label: string;
  shortLabel: string;
  spec: string;
  defaultMin: number;
  defaultMax: number;
}

export interface JointKinematicConfig {
  sliderLabel: string;
  minDeg: number;
  maxDeg: number;
  defaultDeg: number;
  pivotFallback: [number, number, number];
  axisFallback: [number, number, number];
  movingStructures: string[];
  patellaStructures?: string[];
  medialMeniscusStructures?: string[];
  motionModules?: string[];
}

export interface JointReportGuideConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  fivePassOrder: Array<{ step: string; title: string; detail: string }>;
  chapters: RaGuideChapter[];
  blindSpotsTitle: string;
  blindSpotsLead: string;
  blindSpots: Array<{ title: string; check: string }>;
}

export interface JointAtlasDefinition {
  id: JointId;
  name: string;
  shortName: string;
  scannerBadge: string;
  featuredBadge?: string;
  tagline: string;
  heroSummary: string;
  clinicalHighlights: string[];
  previewPlateSrc: string;
  glbUrl: string;
  mriVolumeUrl: string;
  mriSegUrl: string;
  mriSubregionSegUrl?: string;
  landmarksUrl: string;
  mriSpecLabel: string;
  mriSliceTitle: string;
  supportsSubregionOverlay?: boolean;
  supportsPlateauView?: boolean;
  supportsCartilageMap?: boolean;
  cartilageMaxMmLabel?: string;
  defaultMriSliceRas: [number, number, number];
  cameraPresets: Record<CameraPresetKey, JointCameraPreset>;
  allPinStructures: StructureId[];
  boneNames: string[];
  cartilageNames: string[];
  fibrocartilageNames: string[];
  ligamentNames: string[];
  tendonNames: string[];
  nerveBursaNames?: string[];
  xrayHiddenStructures?: string[];
  kinematicConfig: JointKinematicConfig;
  layerGroups: LayerGroupConfig[];
  anatomySystemGroups: AnatomySystemGroup[];
  structuresInfo: Record<string, StructureClinicalInfo>;
  mriContrastPresets: ContrastPresetConfig[];
  modules: KneeModule[];
  pathologyReportingDetails: Record<string, PathologyReportingDetail>;
  patientDemoPresets: PatientDemoPreset[];
  quizQuestions: ResidentQuizQuestion[];
  reportGuide: JointReportGuideConfig;
  pathology3DSpecs: JointPathology3DSpec[];
}
