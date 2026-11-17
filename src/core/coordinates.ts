import type { KneeChapterId, KneeKinematics } from '../types/atlas';

export type Vec3 = [number, number, number];

/**
 * Converts physical NIfTI RAS coordinates (mm: +X=Right, +Y=Anterior, +Z=Superior)
 * into centered Three.js coordinates (+X=Left/Screen-Right, +Y=Superior/Up, +Z=Anterior/Front).
 * Pure proper rotation (det = +1) preserving right-handed triangle winding.
 */
export function rasToThree(ras: Vec3, jointCenterRas: Vec3, scale = 0.04): Vec3 {
  const dx = (ras[0] - jointCenterRas[0]) * scale;
  const dy = (ras[1] - jointCenterRas[1]) * scale;
  const dz = (ras[2] - jointCenterRas[2]) * scale;
  return [-dx, dz, dy];
}

/**
 * Inverse mapping from centered Three.js coordinates back to physical RAS millimeters.
 */
export function threeToRas(three: Vec3, jointCenterRas: Vec3, scale = 0.04): Vec3 {
  return [
    jointCenterRas[0] - three[0] / scale,
    jointCenterRas[1] + three[2] / scale,
    jointCenterRas[2] + three[1] / scale,
  ];
}

/**
 * Computes physiological screw-home kinematics and pathology-specific instability
 * (Lachman anterior drawer in ACL tear, posterior sag in PCL tear, radial extrusion
 * in medial posterior root tear) calibrated for Right or Left laterality.
 */
export function computeKneeKinematics(
  flexionDeg: number,
  chapterId: KneeChapterId,
  threeScale = 0.04,
  laterality: 'Left' | 'Right' = 'Right'
): KneeKinematics {
  const clampedDeg = Math.max(0, Math.min(90, flexionDeg));
  const flexionRad = (clampedDeg * Math.PI) / 180;

  // Terminal extension locking ("screw-home"): ~11.5 deg tibial internal rotation during initial 0-25 deg flexion.
  // Sign convention around +Y (Superior): Right-knee tibial internal rotation rotates anterior tibia (+Z) toward Medial (+X), which is +Y rotation.
  const baseScrewHome = 11.5 * (1 - Math.exp(-clampedDeg / 14)) + 0.03 * clampedDeg;
  const isAclDeficient = chapterId === 'acl-rupture' || chapterId === 'unhappy-triad';
  const isPclDeficient = chapterId === 'pcl-dashboard';

  const screwHomeMag = isAclDeficient ? baseScrewHome * 0.58 : baseScrewHome;
  const screwHomeDeg = laterality === 'Right' ? screwHomeMag : -screwHomeMag;

  // Anterior-Posterior tibial translation (mm):
  // - Normal knee: minimal physiological roll-back (~0.8 mm)
  // - ACL-deficient: peaks around 20-30 deg flexion (Lachman position, ~7.6 mm anterior translation)
  // - PCL-deficient: posterior sag peaks toward 70-90 deg flexion (posterior drawer, ~-8.2 mm)
  let anteriorDrawerMm = 0.8 * Math.sin(flexionRad);
  if (isAclDeficient) {
    const lachmanEnvelope = 0.55 + 0.45 * Math.exp(-Math.pow((clampedDeg - 26) / 24, 2));
    anteriorDrawerMm = 7.6 * lachmanEnvelope;
  } else if (isPclDeficient) {
    const posteriorFactor = 0.25 + 0.75 * Math.sin(flexionRad);
    anteriorDrawerMm = -8.2 * posteriorFactor;
  }

  // Posterior meniscal translation with knee flexion (~3.8 mm total posterior glide at 90 deg)
  const meniscusPosteriorShiftZ = -(3.8 * Math.sin(flexionRad)) * threeScale;

  // Medial meniscal radial extrusion in posterior root tear (> 3 mm medially):
  // On Right knee, Medial is -RAS_X => +X in Three.js (`-dx`).
  const meniscalExtrusionMm = chapterId === 'posterior-root' ? 4.2 : 0.4;
  const medialSign = laterality === 'Right' ? 1 : -1;
  const medialMeniscusShiftX = medialSign * meniscalExtrusionMm * threeScale;

  // Patella descends into trochlear groove and tilts gently with flexion
  const patellaDropY = -(13.5 * Math.sin(flexionRad * 0.72)) * threeScale;
  const patellaShiftZ = -(4.0 * (1 - Math.cos(flexionRad))) * threeScale;
  const patellaTiltRad = -flexionRad * 0.52;

  return {
    flexionDeg: clampedDeg,
    flexionRad,
    screwHomeDeg: Number(screwHomeDeg.toFixed(1)),
    anteriorDrawerMm: Number(anteriorDrawerMm.toFixed(1)),
    anteriorTranslationThree: anteriorDrawerMm * threeScale,
    meniscalExtrusionMm: Number(meniscalExtrusionMm.toFixed(1)),
    medialMeniscusShiftX,
    meniscusPosteriorShiftZ,
    patellaDropY,
    patellaShiftZ,
    patellaTiltRad,
  };
}
