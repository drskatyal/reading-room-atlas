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

export type KneeChapterId =
  | 'normal-anatomy'
  | 'bucket-handle'
  | 'acl-rupture'
  | 'posterior-root'
  | 'pcl-dashboard'
  | 'unhappy-triad';

export type ThemeMode = 'darkroom' | 'monograph';

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

export interface KneeChapter {
  id: KneeChapterId;
  title: string;
  shortTitle: string;
  diagnosticSign: string;
  summary: string;
  defaultFlexionDeg: number;
  defaultContrast: MriContrastPreset;
  defaultPlane: MriPlaneMode;
  focusStructure: StructureId;
  cameraPreset: 'anterior' | 'notch' | 'medial' | 'lateral' | 'plateau' | 'posterior';
  mriChecklist: string[];
  boardPearls: Array<{ exam: string; pearl: string }>;
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
