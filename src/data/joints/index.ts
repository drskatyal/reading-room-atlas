import type { JointAtlasDefinition, JointId } from '../../types/atlas';
import { ANKLE_ATLAS } from './ankleAtlasDef';
import { ELBOW_ATLAS } from './elbowAtlasDef';
import { HIP_ATLAS } from './hipAtlasDef';
import { KNEE_ATLAS } from './kneeAtlasDef';
import { SHOULDER_ATLAS } from './shoulderAtlasDef';
import { WRIST_ATLAS } from './wristAtlasDef';

export {
  ANKLE_ATLAS,
  KNEE_ATLAS,
  SHOULDER_ATLAS,
  WRIST_ATLAS,
  ELBOW_ATLAS,
  HIP_ATLAS,
};

export const ALL_JOINT_ATLASES: JointAtlasDefinition[] = [
  ANKLE_ATLAS,
  KNEE_ATLAS,
  SHOULDER_ATLAS,
  WRIST_ATLAS,
  ELBOW_ATLAS,
  HIP_ATLAS,
];

export const JOINT_ATLAS_MAP: Record<JointId, JointAtlasDefinition> = {
  ankle: ANKLE_ATLAS,
  knee: KNEE_ATLAS,
  shoulder: SHOULDER_ATLAS,
  wrist: WRIST_ATLAS,
  elbow: ELBOW_ATLAS,
  hip: HIP_ATLAS,
};

export function getJointAtlas(id: JointId): JointAtlasDefinition {
  return JOINT_ATLAS_MAP[id] ?? ANKLE_ATLAS;
}
