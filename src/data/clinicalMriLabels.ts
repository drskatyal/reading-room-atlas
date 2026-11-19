import type { JointId, StructureId } from '../types/atlas';

export type ClinicalPlane = 'coronal' | 'sagittal' | 'axial';

export interface ClinicalMriPin {
  structureId: StructureId;
  label: string;
  /** 0..100 horizontal percentage across the drawn MRI image */
  xPct: number;
  /** 0..100 vertical percentage down the drawn MRI image */
  yPct: number;
  /** 0..1 optimal slice fraction in this plane */
  sliceFrac: number;
  /** +/- slice fraction window where this structure remains visible */
  sliceSpan: number;
}

export const CLINICAL_MRI_LABELS: Record<
  JointId,
  Record<ClinicalPlane, ClinicalMriPin[]>
> = {
  ankle: {
    coronal: [
      { structureId: 'Tibia', label: 'Distal Tibia', xPct: 51, yPct: 46, sliceFrac: 0.48, sliceSpan: 0.22 },
      { structureId: 'Fibula', label: 'Lateral Malleolus', xPct: 41, yPct: 56, sliceFrac: 0.50, sliceSpan: 0.22 },
      { structureId: 'TibiotalarCartilage', label: 'Plafond Cartilage', xPct: 50, yPct: 55, sliceFrac: 0.46, sliceSpan: 0.16 },
      { structureId: 'TalarDomeCartilage', label: 'Talar Dome', xPct: 50, yPct: 58, sliceFrac: 0.46, sliceSpan: 0.16 },
      { structureId: 'Talus', label: 'Talus', xPct: 50, yPct: 62, sliceFrac: 0.48, sliceSpan: 0.22 },
      { structureId: 'SubtalarCartilage', label: 'Subtalar Joint', xPct: 50, yPct: 68, sliceFrac: 0.50, sliceSpan: 0.16 },
      { structureId: 'Calcaneus', label: 'Calcaneus', xPct: 49, yPct: 75, sliceFrac: 0.52, sliceSpan: 0.24 },
      { structureId: 'DeltoidLigament', label: 'Deltoid Lig.', xPct: 60, yPct: 60, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'SpringLigament', label: 'Spring Lig.', xPct: 60, yPct: 67, sliceFrac: 0.40, sliceSpan: 0.16 },
      { structureId: 'CFL', label: 'CFL', xPct: 40, yPct: 66, sliceFrac: 0.54, sliceSpan: 0.16 },
      { structureId: 'PosteriorTibialTendon', label: 'PTT', xPct: 63, yPct: 62, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'FHLTendon', label: 'FHL', xPct: 58, yPct: 69, sliceFrac: 0.54, sliceSpan: 0.18 },
      { structureId: 'TibialNerve', label: 'Tibial Nerve', xPct: 62, yPct: 68, sliceFrac: 0.52, sliceSpan: 0.18 },
      { structureId: 'PeroneusBrevis', label: 'Peroneus Brevis', xPct: 39, yPct: 62, sliceFrac: 0.54, sliceSpan: 0.18 },
      { structureId: 'PeroneusLongus', label: 'Peroneus Longus', xPct: 38, yPct: 68, sliceFrac: 0.54, sliceSpan: 0.18 },
      { structureId: 'PlantarFascia', label: 'Plantar Fascia', xPct: 50, yPct: 84, sliceFrac: 0.48, sliceSpan: 0.20 },
    ],
    sagittal: [
      { structureId: 'Tibia', label: 'Distal Tibia', xPct: 50, yPct: 44, sliceFrac: 0.50, sliceSpan: 0.22 },
      { structureId: 'TibiotalarCartilage', label: 'Plafond Cartilage', xPct: 49, yPct: 50, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'TalarDomeCartilage', label: 'Talar Dome', xPct: 50, yPct: 52, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'Talus', label: 'Talus', xPct: 50, yPct: 56, sliceFrac: 0.50, sliceSpan: 0.22 },
      { structureId: 'SubtalarCartilage', label: 'Subtalar Joint', xPct: 54, yPct: 62, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'Calcaneus', label: 'Calcaneus', xPct: 62, yPct: 69, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'Navicular', label: 'Navicular', xPct: 36, yPct: 61, sliceFrac: 0.46, sliceSpan: 0.18 },
      { structureId: 'Cuneiforms', label: 'Cuneiforms', xPct: 26, yPct: 66, sliceFrac: 0.45, sliceSpan: 0.18 },
      { structureId: 'Cuboid', label: 'Cuboid', xPct: 38, yPct: 70, sliceFrac: 0.60, sliceSpan: 0.18 },
      { structureId: 'AchillesTendon', label: 'Achilles Tendon', xPct: 75, yPct: 52, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'PlantarFascia', label: 'Plantar Fascia', xPct: 52, yPct: 79, sliceFrac: 0.48, sliceSpan: 0.20 },
      { structureId: 'FHLTendon', label: 'FHL Tendon', xPct: 63, yPct: 56, sliceFrac: 0.44, sliceSpan: 0.16 },
      { structureId: 'Fibula', label: 'Distal Fibula', xPct: 57, yPct: 47, sliceFrac: 0.66, sliceSpan: 0.16 },
    ],
    axial: [
      { structureId: 'Tibia', label: 'Distal Tibia', xPct: 47, yPct: 43, sliceFrac: 0.65, sliceSpan: 0.20 },
      { structureId: 'Talus', label: 'Talus', xPct: 48, yPct: 43, sliceFrac: 0.50, sliceSpan: 0.16 },
      { structureId: 'Fibula', label: 'Lateral Malleolus', xPct: 36, yPct: 48, sliceFrac: 0.55, sliceSpan: 0.20 },
      { structureId: 'Calcaneus', label: 'Calcaneus', xPct: 52, yPct: 58, sliceFrac: 0.35, sliceSpan: 0.18 },
      { structureId: 'Navicular', label: 'Navicular', xPct: 45, yPct: 22, sliceFrac: 0.35, sliceSpan: 0.16 },
      { structureId: 'Cuboid', label: 'Cuboid', xPct: 36, yPct: 36, sliceFrac: 0.35, sliceSpan: 0.16 },
      { structureId: 'ATFL', label: 'ATFL', xPct: 34, yPct: 38, sliceFrac: 0.50, sliceSpan: 0.14 },
      { structureId: 'PTFL', label: 'PTFL', xPct: 41, yPct: 53, sliceFrac: 0.50, sliceSpan: 0.14 },
      { structureId: 'AITFL', label: 'AITFL (Syndesmosis)', xPct: 36, yPct: 36, sliceFrac: 0.62, sliceSpan: 0.14 },
      { structureId: 'CFL', label: 'CFL', xPct: 34, yPct: 54, sliceFrac: 0.45, sliceSpan: 0.14 },
      { structureId: 'DeltoidLigament', label: 'Deltoid Lig.', xPct: 61, yPct: 43, sliceFrac: 0.52, sliceSpan: 0.16 },
      { structureId: 'SpringLigament', label: 'Spring Lig.', xPct: 58, yPct: 34, sliceFrac: 0.40, sliceSpan: 0.14 },
      { structureId: 'AchillesTendon', label: 'Achilles Tendon', xPct: 66, yPct: 72, sliceFrac: 0.52, sliceSpan: 0.22 },
      { structureId: 'PosteriorTibialTendon', label: 'PTT', xPct: 62, yPct: 52, sliceFrac: 0.52, sliceSpan: 0.18 },
      { structureId: 'FHLTendon', label: 'FHL', xPct: 56, yPct: 59, sliceFrac: 0.52, sliceSpan: 0.18 },
      { structureId: 'TibialNerve', label: 'Tibial Nerve', xPct: 61, yPct: 59, sliceFrac: 0.52, sliceSpan: 0.18 },
      { structureId: 'PeroneusBrevis', label: 'Peroneus Brevis', xPct: 38, yPct: 59, sliceFrac: 0.52, sliceSpan: 0.18 },
      { structureId: 'PeroneusLongus', label: 'Peroneus Longus', xPct: 35, yPct: 63, sliceFrac: 0.52, sliceSpan: 0.18 },
    ],
  },

  knee: {
    coronal: [
      { structureId: 'Femur', label: 'Distal Femur', xPct: 50, yPct: 38, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'Tibia', label: 'Proximal Tibia', xPct: 50, yPct: 72, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'Fibula', label: 'Fibular Head', xPct: 72, yPct: 76, sliceFrac: 0.65, sliceSpan: 0.20 },
      { structureId: 'FemoralCartilage', label: 'Femoral Cartilage', xPct: 42, yPct: 55, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'MedialTibialCartilage', label: 'Med. Tibial Cartilage', xPct: 38, yPct: 60, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'LateralTibialCartilage', label: 'Lat. Tibial Cartilage', xPct: 63, yPct: 59, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'MedialMeniscus', label: 'Medial Meniscus', xPct: 32, yPct: 57, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'LateralMeniscus', label: 'Lateral Meniscus', xPct: 69, yPct: 56, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'ACL', label: 'ACL', xPct: 52, yPct: 51, sliceFrac: 0.52, sliceSpan: 0.16 },
      { structureId: 'PCL', label: 'PCL', xPct: 47, yPct: 50, sliceFrac: 0.62, sliceSpan: 0.16 },
      { structureId: 'MCL', label: 'MCL', xPct: 26, yPct: 54, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'LCL', label: 'LCL', xPct: 74, yPct: 54, sliceFrac: 0.60, sliceSpan: 0.18 },
    ],
    sagittal: [
      { structureId: 'Femur', label: 'Distal Femur', xPct: 44, yPct: 34, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'Tibia', label: 'Proximal Tibia', xPct: 52, yPct: 70, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'Patella', label: 'Patella', xPct: 24, yPct: 39, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'QuadricepsTendon', label: 'Quadriceps Tendon', xPct: 27, yPct: 22, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'PatellarTendon', label: 'Patellar Tendon', xPct: 28, yPct: 58, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'PatellarCartilage', label: 'Patellar Cartilage', xPct: 28, yPct: 40, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'FemoralCartilage', label: 'Femoral Cartilage', xPct: 46, yPct: 53, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'MedialTibialCartilage', label: 'Med. Tibial Cartilage', xPct: 49, yPct: 57, sliceFrac: 0.35, sliceSpan: 0.16 },
      { structureId: 'LateralTibialCartilage', label: 'Lat. Tibial Cartilage', xPct: 49, yPct: 57, sliceFrac: 0.65, sliceSpan: 0.16 },
      { structureId: 'MedialMeniscus', label: 'Medial Meniscus', xPct: 56, yPct: 55, sliceFrac: 0.35, sliceSpan: 0.16 },
      { structureId: 'LateralMeniscus', label: 'Lateral Meniscus', xPct: 56, yPct: 55, sliceFrac: 0.65, sliceSpan: 0.16 },
      { structureId: 'ACL', label: 'ACL', xPct: 48, yPct: 52, sliceFrac: 0.50, sliceSpan: 0.14 },
      { structureId: 'PCL', label: 'PCL', xPct: 58, yPct: 51, sliceFrac: 0.48, sliceSpan: 0.14 },
      { structureId: 'Fibula', label: 'Fibular Head', xPct: 65, yPct: 69, sliceFrac: 0.72, sliceSpan: 0.16 },
    ],
    axial: [
      { structureId: 'Patella', label: 'Patella', xPct: 49, yPct: 24, sliceFrac: 0.62, sliceSpan: 0.22 },
      { structureId: 'PatellarCartilage', label: 'Patellar Cartilage', xPct: 49, yPct: 31, sliceFrac: 0.62, sliceSpan: 0.20 },
      { structureId: 'Femur', label: 'Femoral Condyles', xPct: 49, yPct: 46, sliceFrac: 0.55, sliceSpan: 0.22 },
      { structureId: 'FemoralCartilage', label: 'Trochlear Cartilage', xPct: 49, yPct: 34, sliceFrac: 0.55, sliceSpan: 0.20 },
      { structureId: 'Tibia', label: 'Tibial Plateau', xPct: 49, yPct: 46, sliceFrac: 0.32, sliceSpan: 0.18 },
      { structureId: 'MCL', label: 'MCL', xPct: 25, yPct: 48, sliceFrac: 0.48, sliceSpan: 0.20 },
      { structureId: 'LCL', label: 'LCL', xPct: 74, yPct: 50, sliceFrac: 0.48, sliceSpan: 0.20 },
      { structureId: 'ACL', label: 'ACL', xPct: 51, yPct: 52, sliceFrac: 0.46, sliceSpan: 0.16 },
      { structureId: 'PCL', label: 'PCL', xPct: 49, yPct: 58, sliceFrac: 0.46, sliceSpan: 0.16 },
      { structureId: 'PatellarTendon', label: 'Patellar Tendon', xPct: 48, yPct: 22, sliceFrac: 0.35, sliceSpan: 0.16 },
    ],
  },

  shoulder: {
    coronal: [
      { structureId: 'Humerus', label: 'Humeral Head', xPct: 35, yPct: 50, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'Scapula', label: 'Glenoid & Scapula', xPct: 61, yPct: 52, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'Clavicle', label: 'Distal Clavicle', xPct: 54, yPct: 24, sliceFrac: 0.40, sliceSpan: 0.18 },
      { structureId: 'HumeralCartilage', label: 'Humeral Cartilage', xPct: 48, yPct: 44, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'GlenoidCartilage', label: 'Glenoid Cartilage', xPct: 52, yPct: 46, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'GlenoidLabrum', label: 'Superior Labrum', xPct: 52, yPct: 36, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'Supraspinatus', label: 'Supraspinatus', xPct: 54, yPct: 30, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'SubacromialBursa', label: 'Subacromial Bursa', xPct: 42, yPct: 24, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'IGHL', label: 'Axillary Pouch / IGHL', xPct: 50, yPct: 62, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'LongHeadBiceps', label: 'Biceps Anchor (LHB)', xPct: 46, yPct: 34, sliceFrac: 0.42, sliceSpan: 0.16 },
      { structureId: 'CoracoclavicularLigament', label: 'CC Ligaments', xPct: 58, yPct: 30, sliceFrac: 0.38, sliceSpan: 0.16 },
      { structureId: 'CoracoacromialLigament', label: 'CA Arch', xPct: 44, yPct: 22, sliceFrac: 0.40, sliceSpan: 0.16 },
    ],
    sagittal: [
      { structureId: 'Humerus', label: 'Humeral Head', xPct: 52, yPct: 49, sliceFrac: 0.52, sliceSpan: 0.22 },
      { structureId: 'Scapula', label: 'Scapular Y / Glenoid', xPct: 44, yPct: 54, sliceFrac: 0.35, sliceSpan: 0.20 },
      { structureId: 'Clavicle', label: 'Clavicle', xPct: 44, yPct: 24, sliceFrac: 0.38, sliceSpan: 0.18 },
      { structureId: 'Supraspinatus', label: 'Supraspinatus', xPct: 48, yPct: 28, sliceFrac: 0.45, sliceSpan: 0.20 },
      { structureId: 'Infraspinatus', label: 'Infraspinatus', xPct: 68, yPct: 38, sliceFrac: 0.48, sliceSpan: 0.20 },
      { structureId: 'TeresMinor', label: 'Teres Minor', xPct: 70, yPct: 56, sliceFrac: 0.48, sliceSpan: 0.20 },
      { structureId: 'Subscapularis', label: 'Subscapularis', xPct: 34, yPct: 46, sliceFrac: 0.45, sliceSpan: 0.20 },
      { structureId: 'LongHeadBiceps', label: 'LHB Tendon', xPct: 43, yPct: 33, sliceFrac: 0.52, sliceSpan: 0.18 },
      { structureId: 'GlenoidLabrum', label: 'Glenoid Labrum', xPct: 46, yPct: 48, sliceFrac: 0.40, sliceSpan: 0.16 },
      { structureId: 'SubacromialBursa', label: 'Subacromial Space', xPct: 54, yPct: 23, sliceFrac: 0.52, sliceSpan: 0.18 },
      { structureId: 'CoracoacromialLigament', label: 'CA Ligament', xPct: 34, yPct: 28, sliceFrac: 0.40, sliceSpan: 0.16 },
    ],
    axial: [
      { structureId: 'Humerus', label: 'Humeral Head', xPct: 39, yPct: 44, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'Scapula', label: 'Glenoid', xPct: 64, yPct: 58, sliceFrac: 0.50, sliceSpan: 0.22 },
      { structureId: 'HumeralCartilage', label: 'Humeral Cartilage', xPct: 49, yPct: 48, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'GlenoidCartilage', label: 'Glenoid Cartilage', xPct: 52, yPct: 50, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'GlenoidLabrum', label: 'Anterior Labrum', xPct: 48, yPct: 39, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'Subscapularis', label: 'Subscapularis', xPct: 54, yPct: 31, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'LongHeadBiceps', label: 'Biceps Groove (LHB)', xPct: 37, yPct: 29, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'Infraspinatus', label: 'Infraspinatus', xPct: 42, yPct: 65, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'TeresMinor', label: 'Teres Minor', xPct: 46, yPct: 68, sliceFrac: 0.38, sliceSpan: 0.16 },
      { structureId: 'MGHL_SGHL', label: 'MGHL / Interval', xPct: 53, yPct: 36, sliceFrac: 0.52, sliceSpan: 0.16 },
      { structureId: 'IGHL', label: 'IGHL', xPct: 50, yPct: 58, sliceFrac: 0.40, sliceSpan: 0.16 },
    ],
  },

  wrist: {
    coronal: [
      { structureId: 'Radius', label: 'Distal Radius', xPct: 48, yPct: 33, sliceFrac: 0.42, sliceSpan: 0.22 },
      { structureId: 'Ulna', label: 'Distal Ulna', xPct: 28, yPct: 34, sliceFrac: 0.44, sliceSpan: 0.22 },
      { structureId: 'Scaphoid', label: 'Scaphoid', xPct: 55, yPct: 51, sliceFrac: 0.42, sliceSpan: 0.18 },
      { structureId: 'Lunate', label: 'Lunate', xPct: 42, yPct: 48, sliceFrac: 0.42, sliceSpan: 0.18 },
      { structureId: 'Triquetrum', label: 'Triquetrum', xPct: 31, yPct: 52, sliceFrac: 0.42, sliceSpan: 0.18 },
      { structureId: 'Pisiform', label: 'Pisiform', xPct: 32, yPct: 58, sliceFrac: 0.56, sliceSpan: 0.16 },
      { structureId: 'DistalCarpalRow', label: 'Capitate / Hamate', xPct: 45, yPct: 62, sliceFrac: 0.42, sliceSpan: 0.18 },
      { structureId: 'MetacarpalBases', label: 'Metacarpal Bases', xPct: 48, yPct: 79, sliceFrac: 0.42, sliceSpan: 0.20 },
      { structureId: 'RadiocarpalCartilage', label: 'Radiocarpal Joint', xPct: 46, yPct: 43, sliceFrac: 0.42, sliceSpan: 0.16 },
      { structureId: 'TFCC', label: 'TFCC Disk', xPct: 31, yPct: 44, sliceFrac: 0.44, sliceSpan: 0.16 },
      { structureId: 'ScapholunateLigament', label: 'SL Ligament', xPct: 49, yPct: 48, sliceFrac: 0.42, sliceSpan: 0.16 },
      { structureId: 'LunotriquetralLigament', label: 'LT Ligament', xPct: 36, yPct: 50, sliceFrac: 0.42, sliceSpan: 0.16 },
      { structureId: 'ECU_Tendon', label: 'ECU Tendon', xPct: 22, yPct: 38, sliceFrac: 0.35, sliceSpan: 0.16 },
      { structureId: 'FCR_FCU', label: 'FCR / FCU', xPct: 62, yPct: 42, sliceFrac: 0.56, sliceSpan: 0.16 },
    ],
    sagittal: [
      { structureId: 'Radius', label: 'Distal Radius', xPct: 47, yPct: 24, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'Lunate', label: 'Lunate', xPct: 45, yPct: 37, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'DistalCarpalRow', label: 'Capitate', xPct: 47, yPct: 50, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'MetacarpalBases', label: '3rd Metacarpal', xPct: 49, yPct: 70, sliceFrac: 0.50, sliceSpan: 0.22 },
      { structureId: 'RadiocarpalCartilage', label: 'Radiolunate Joint', xPct: 46, yPct: 32, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'FlexorTendons', label: 'Flexor Tendons', xPct: 60, yPct: 48, sliceFrac: 0.50, sliceSpan: 0.22 },
      { structureId: 'MedianNerve', label: 'Median Nerve', xPct: 64, yPct: 42, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'FlexorRetinaculum', label: 'Flexor Retinaculum', xPct: 66, yPct: 46, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'EPL_Extensors', label: 'Extensor Tendons', xPct: 36, yPct: 42, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'Scaphoid', label: 'Scaphoid', xPct: 48, yPct: 42, sliceFrac: 0.62, sliceSpan: 0.16 },
    ],
    axial: [
      { structureId: 'Radius', label: 'Distal Radius', xPct: 52, yPct: 48, sliceFrac: 0.65, sliceSpan: 0.20 },
      { structureId: 'Ulna', label: 'Distal Ulna', xPct: 33, yPct: 47, sliceFrac: 0.65, sliceSpan: 0.20 },
      { structureId: 'Scaphoid', label: 'Scaphoid', xPct: 62, yPct: 48, sliceFrac: 0.46, sliceSpan: 0.16 },
      { structureId: 'Lunate', label: 'Lunate', xPct: 49, yPct: 46, sliceFrac: 0.48, sliceSpan: 0.16 },
      { structureId: 'Triquetrum', label: 'Triquetrum', xPct: 35, yPct: 47, sliceFrac: 0.48, sliceSpan: 0.16 },
      { structureId: 'Pisiform', label: 'Pisiform', xPct: 34, yPct: 58, sliceFrac: 0.44, sliceSpan: 0.14 },
      { structureId: 'DistalCarpalRow', label: 'Capitate / Hamate', xPct: 50, yPct: 46, sliceFrac: 0.35, sliceSpan: 0.16 },
      { structureId: 'FlexorTendons', label: 'Flexor Tendons', xPct: 51, yPct: 61, sliceFrac: 0.46, sliceSpan: 0.22 },
      { structureId: 'MedianNerve', label: 'Median Nerve', xPct: 52, yPct: 56, sliceFrac: 0.46, sliceSpan: 0.20 },
      { structureId: 'FlexorRetinaculum', label: 'Flexor Retinaculum', xPct: 52, yPct: 66, sliceFrac: 0.46, sliceSpan: 0.20 },
      { structureId: 'FCR_FCU', label: 'FCR / FCU', xPct: 66, yPct: 61, sliceFrac: 0.48, sliceSpan: 0.18 },
      { structureId: 'ECU_Tendon', label: 'ECU Tendon', xPct: 30, yPct: 39, sliceFrac: 0.55, sliceSpan: 0.18 },
      { structureId: 'EPL_Extensors', label: 'Dorsal Extensors', xPct: 54, yPct: 34, sliceFrac: 0.55, sliceSpan: 0.18 },
      { structureId: 'TFCC', label: 'TFCC', xPct: 36, yPct: 46, sliceFrac: 0.56, sliceSpan: 0.14 },
      { structureId: 'ScapholunateLigament', label: 'SL Ligament', xPct: 56, yPct: 46, sliceFrac: 0.48, sliceSpan: 0.14 },
      { structureId: 'LunotriquetralLigament', label: 'LT Ligament', xPct: 41, yPct: 46, sliceFrac: 0.48, sliceSpan: 0.14 },
    ],
  },

  elbow: {
    coronal: [
      { structureId: 'Humerus', label: 'Distal Humerus', xPct: 56, yPct: 52, sliceFrac: 0.58, sliceSpan: 0.24 },
      { structureId: 'Radius', label: 'Radial Head', xPct: 63, yPct: 70, sliceFrac: 0.55, sliceSpan: 0.22 },
      { structureId: 'Ulna', label: 'Proximal Ulna', xPct: 50, yPct: 68, sliceFrac: 0.60, sliceSpan: 0.22 },
      { structureId: 'CapitellarTrochlearCartilage', label: 'Capitellum / Trochlea', xPct: 56, yPct: 60, sliceFrac: 0.58, sliceSpan: 0.18 },
      { structureId: 'RadialUlnarCartilage', label: 'Radiocapitellar Joint', xPct: 61, yPct: 64, sliceFrac: 0.55, sliceSpan: 0.18 },
      { structureId: 'UCL_AnteriorBundle', label: 'UCL (Medial)', xPct: 44, yPct: 62, sliceFrac: 0.58, sliceSpan: 0.18 },
      { structureId: 'LUCL', label: 'LUCL (Lateral)', xPct: 68, yPct: 62, sliceFrac: 0.58, sliceSpan: 0.18 },
      { structureId: 'CommonFlexorOrigin', label: 'Common Flexor Origin', xPct: 43, yPct: 57, sliceFrac: 0.55, sliceSpan: 0.18 },
      { structureId: 'CommonExtensorOrigin', label: 'Common Extensor Origin', xPct: 68, yPct: 57, sliceFrac: 0.55, sliceSpan: 0.18 },
      { structureId: 'AnnularLigament', label: 'Annular Ligament', xPct: 64, yPct: 67, sliceFrac: 0.55, sliceSpan: 0.18 },
      { structureId: 'UlnarNerve', label: 'Ulnar Nerve', xPct: 42, yPct: 56, sliceFrac: 0.65, sliceSpan: 0.16 },
    ],
    sagittal: [
      { structureId: 'Humerus', label: 'Distal Humerus', xPct: 53, yPct: 46, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'Ulna', label: 'Olecranon / Ulna', xPct: 57, yPct: 65, sliceFrac: 0.52, sliceSpan: 0.22 },
      { structureId: 'Radius', label: 'Radial Head', xPct: 50, yPct: 67, sliceFrac: 0.38, sliceSpan: 0.20 },
      { structureId: 'CapitellarTrochlearCartilage', label: 'Capitellum / Trochlea', xPct: 52, yPct: 57, sliceFrac: 0.46, sliceSpan: 0.20 },
      { structureId: 'RadialUlnarCartilage', label: 'Radiocapitellar Joint', xPct: 50, yPct: 62, sliceFrac: 0.38, sliceSpan: 0.18 },
      { structureId: 'DistalBicepsTendon', label: 'Distal Biceps', xPct: 43, yPct: 62, sliceFrac: 0.45, sliceSpan: 0.20 },
      { structureId: 'BrachialisTendon', label: 'Brachialis', xPct: 46, yPct: 54, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'TricepsTendon', label: 'Triceps Tendon', xPct: 62, yPct: 54, sliceFrac: 0.52, sliceSpan: 0.20 },
      { structureId: 'BicipitoradialBursa', label: 'Bicipitoradial Bursa', xPct: 44, yPct: 66, sliceFrac: 0.42, sliceSpan: 0.18 },
    ],
    axial: [
      { structureId: 'Humerus', label: 'Distal Humerus', xPct: 52, yPct: 39, sliceFrac: 0.52, sliceSpan: 0.26 },
      { structureId: 'Radius', label: 'Radial Head', xPct: 56, yPct: 44, sliceFrac: 0.35, sliceSpan: 0.22 },
      { structureId: 'Ulna', label: 'Proximal Ulna', xPct: 48, yPct: 54, sliceFrac: 0.45, sliceSpan: 0.24 },
      { structureId: 'UlnarNerve', label: 'Cubital Tunnel / Ulnar N.', xPct: 42, yPct: 52, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'DistalBicepsTendon', label: 'Distal Biceps', xPct: 58, yPct: 34, sliceFrac: 0.35, sliceSpan: 0.22 },
      { structureId: 'BicipitoradialBursa', label: 'Bicipitoradial Bursa', xPct: 56, yPct: 38, sliceFrac: 0.35, sliceSpan: 0.22 },
      { structureId: 'TricepsTendon', label: 'Triceps Tendon', xPct: 44, yPct: 58, sliceFrac: 0.58, sliceSpan: 0.22 },
      { structureId: 'CommonExtensorOrigin', label: 'Extensor Origin', xPct: 64, yPct: 42, sliceFrac: 0.50, sliceSpan: 0.22 },
      { structureId: 'CommonFlexorOrigin', label: 'Flexor Origin', xPct: 38, yPct: 42, sliceFrac: 0.50, sliceSpan: 0.22 },
    ],
  },

  hip: {
    coronal: [
      { structureId: 'Pelvis', label: 'Acetabulum / Ilium', xPct: 29, yPct: 28, sliceFrac: 0.48, sliceSpan: 0.24 },
      { structureId: 'Femur', label: 'Femoral Head & Neck', xPct: 25, yPct: 50, sliceFrac: 0.48, sliceSpan: 0.24 },
      { structureId: 'FemoralHeadCartilage', label: 'Femoral Head Cartilage', xPct: 27, yPct: 37, sliceFrac: 0.44, sliceSpan: 0.20 },
      { structureId: 'AcetabularCartilage', label: 'Acetabular Dome', xPct: 28, yPct: 34, sliceFrac: 0.44, sliceSpan: 0.20 },
      { structureId: 'AcetabularLabrum', label: 'Acetabular Labrum', xPct: 22, yPct: 34, sliceFrac: 0.44, sliceSpan: 0.20 },
      { structureId: 'LigamentumTeres', label: 'Ligamentum Teres', xPct: 31, yPct: 42, sliceFrac: 0.42, sliceSpan: 0.18 },
      { structureId: 'GluteusMediusTendon', label: 'Gluteus Medius', xPct: 16, yPct: 45, sliceFrac: 0.50, sliceSpan: 0.22 },
      { structureId: 'GluteusMinimusTendon', label: 'Gluteus Minimus', xPct: 19, yPct: 39, sliceFrac: 0.44, sliceSpan: 0.20 },
      { structureId: 'TrochantericBursa', label: 'Trochanteric Bursa', xPct: 14, yPct: 52, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'IliopsoasTendon', label: 'Iliopsoas Tendon', xPct: 34, yPct: 52, sliceFrac: 0.44, sliceSpan: 0.20 },
      { structureId: 'IliofemoralLigament', label: 'Iliofemoral Lig.', xPct: 23, yPct: 41, sliceFrac: 0.40, sliceSpan: 0.18 },
      { structureId: 'IschiofemoralLigament', label: 'Ischiofemoral Space', xPct: 34, yPct: 54, sliceFrac: 0.62, sliceSpan: 0.18 },
      { structureId: 'ProximalHamstringOrigin', label: 'Hamstring Origin', xPct: 37, yPct: 60, sliceFrac: 0.65, sliceSpan: 0.18 },
      { structureId: 'SciaticNerve', label: 'Sciatic Nerve', xPct: 32, yPct: 56, sliceFrac: 0.65, sliceSpan: 0.18 },
      { structureId: 'RectusFemorisOrigin', label: 'Rectus Femoris / AIIS', xPct: 21, yPct: 29, sliceFrac: 0.38, sliceSpan: 0.18 },
    ],
    sagittal: [
      { structureId: 'Pelvis', label: 'Acetabulum', xPct: 48, yPct: 30, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'Femur', label: 'Femoral Head', xPct: 45, yPct: 45, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'FemoralHeadCartilage', label: 'Femoral Cartilage', xPct: 44, yPct: 37, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'AcetabularCartilage', label: 'Acetabular Cartilage', xPct: 45, yPct: 34, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'AcetabularLabrum', label: 'Anterior Labrum', xPct: 35, yPct: 37, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'IliopsoasTendon', label: 'Iliopsoas Tendon', xPct: 31, yPct: 44, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'RectusFemorisOrigin', label: 'Rectus Femoris / AIIS', xPct: 33, yPct: 30, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'IliofemoralLigament', label: 'Iliofemoral Lig.', xPct: 34, yPct: 42, sliceFrac: 0.50, sliceSpan: 0.20 },
      { structureId: 'IschiofemoralLigament', label: 'Ischiofemoral Lig.', xPct: 58, yPct: 46, sliceFrac: 0.55, sliceSpan: 0.20 },
      { structureId: 'GluteusMediusTendon', label: 'Gluteus Medius', xPct: 52, yPct: 24, sliceFrac: 0.42, sliceSpan: 0.20 },
      { structureId: 'GluteusMinimusTendon', label: 'Gluteus Minimus', xPct: 42, yPct: 26, sliceFrac: 0.45, sliceSpan: 0.20 },
      { structureId: 'ProximalHamstringOrigin', label: 'Hamstring Origin', xPct: 61, yPct: 60, sliceFrac: 0.62, sliceSpan: 0.18 },
      { structureId: 'SciaticNerve', label: 'Sciatic Nerve', xPct: 62, yPct: 50, sliceFrac: 0.55, sliceSpan: 0.18 },
    ],
    axial: [
      { structureId: 'Pelvis', label: 'Acetabulum', xPct: 38, yPct: 44, sliceFrac: 0.52, sliceSpan: 0.24 },
      { structureId: 'Femur', label: 'Femoral Head / Neck', xPct: 26, yPct: 48, sliceFrac: 0.50, sliceSpan: 0.24 },
      { structureId: 'FemoralHeadCartilage', label: 'Femoral Cartilage', xPct: 28, yPct: 43, sliceFrac: 0.52, sliceSpan: 0.18 },
      { structureId: 'AcetabularCartilage', label: 'Acetabular Cartilage', xPct: 32, yPct: 44, sliceFrac: 0.52, sliceSpan: 0.18 },
      { structureId: 'AcetabularLabrum', label: 'Anterior Labrum', xPct: 23, yPct: 38, sliceFrac: 0.52, sliceSpan: 0.18 },
      { structureId: 'LigamentumTeres', label: 'Ligamentum Teres', xPct: 31, yPct: 46, sliceFrac: 0.52, sliceSpan: 0.16 },
      { structureId: 'IliopsoasTendon', label: 'Iliopsoas Tendon', xPct: 27, yPct: 32, sliceFrac: 0.52, sliceSpan: 0.20 },
      { structureId: 'IliofemoralLigament', label: 'Iliofemoral Lig.', xPct: 23, yPct: 36, sliceFrac: 0.50, sliceSpan: 0.18 },
      { structureId: 'IschiofemoralLigament', label: 'Ischiofemoral Space', xPct: 34, yPct: 54, sliceFrac: 0.44, sliceSpan: 0.18 },
      { structureId: 'GluteusMediusTendon', label: 'Gluteus Medius', xPct: 14, yPct: 48, sliceFrac: 0.48, sliceSpan: 0.20 },
      { structureId: 'GluteusMinimusTendon', label: 'Gluteus Minimus', xPct: 16, yPct: 40, sliceFrac: 0.52, sliceSpan: 0.20 },
      { structureId: 'TrochantericBursa', label: 'Trochanteric Bursa', xPct: 12, yPct: 52, sliceFrac: 0.46, sliceSpan: 0.18 },
      { structureId: 'ProximalHamstringOrigin', label: 'Hamstring Origin', xPct: 36, yPct: 58, sliceFrac: 0.38, sliceSpan: 0.18 },
      { structureId: 'SciaticNerve', label: 'Sciatic Nerve', xPct: 32, yPct: 58, sliceFrac: 0.42, sliceSpan: 0.18 },
      { structureId: 'RectusFemorisOrigin', label: 'Rectus Femoris', xPct: 21, yPct: 31, sliceFrac: 0.58, sliceSpan: 0.18 },
    ],
  },
};

export function findPinForStructure(
  jointId: JointId,
  structureId: StructureId | undefined,
  preferredPlane?: ClinicalPlane
): { plane: ClinicalPlane; pin: ClinicalMriPin } | null {
  if (!structureId) return null;
  const byPlane = CLINICAL_MRI_LABELS[jointId];
  if (!byPlane) return null;
  if (preferredPlane) {
    const hit = byPlane[preferredPlane].find((p) => p.structureId === structureId);
    if (hit) return { plane: preferredPlane, pin: hit };
  }
  for (const plane of ['coronal', 'sagittal', 'axial'] as ClinicalPlane[]) {
    const hit = byPlane[plane].find((p) => p.structureId === structureId);
    if (hit) return { plane, pin: hit };
  }
  return null;
}
