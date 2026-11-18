export type StructureId =
  | 'Femur'
  | 'Tibia'
  | 'Fibula'
  | 'Patella'
  | 'FemoralCartilage'
  | 'MedialTibialCartilage'
  | 'LateralTibialCartilage'
  | 'PatellarCartilage'
  | 'MedialMeniscus'
  | 'LateralMeniscus'
  | 'ACL'
  | 'PCL'
  | 'MCL'
  | 'LCL'
  | 'PatellarTendon'
  | 'QuadricepsTendon';

export type TissueGroup =
  | 'bone'
  | 'cartilage'
  | 'meniscus'
  | 'cruciate'
  | 'collateral'
  | 'extensor';

export type MriContrastPreset =
  | 'qdess-clinical'
  | 'meniscus-cruciate'
  | 'chondral'
  | 'trabecular';

export type MriOverlayMode = 'none' | 'atlas' | 'subregions';

export type MriPlaneMode = 'sagittal' | 'coronal' | 'axial' | 'multiplanar';

export type ModuleCategory = 'normal' | 'approach' | 'pathology';

export type KneeModuleId =
  | 'normal-overview'
  | 'normal-menisci'
  | 'normal-cruciates'
  | 'normal-collaterals-extensor'
  | 'approach-sequences'
  | 'approach-sag-menisci'
  | 'approach-sag-cruciates'
  | 'approach-coronal'
  | 'approach-axial'
  | 'meniscal-tears-3d'
  | 'bucket-handle'
  | 'posterior-root'
  | 'acl-rupture'
  | 'pcl-dashboard'
  | 'unhappy-triad'
  | 'patellar-dislocation'
  | 'chondral-oa';

export type KneeChapterId = KneeModuleId;

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
