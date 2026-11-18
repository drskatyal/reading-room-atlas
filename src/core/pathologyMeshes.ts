import * as THREE from 'three';
import type {
  KneeKinematics,
  KneeModuleId,
  MeniscalTearMorphology,
  TissueVisibility,
} from '../types/atlas';

export interface PathologyOverlayContext {
  femurGroup: THREE.Group;
  tibiaBodyGroup: THREE.Group;
  medialMeniscusGroup: THREE.Group;
  patellaGroup: THREE.Group;
  meshes: Map<string, THREE.Mesh>;
  threeScale: number;
  laterality: 'Left' | 'Right';
}

export interface PathologyUpdateState {
  moduleId: KneeModuleId;
  subStepId: string;
  meniscalTearMorphology?: MeniscalTearMorphology;
  kinematics: KneeKinematics;
  visibility: TissueVisibility;
  elapsedSec: number;
}

export interface PathologyOverlaySystem {
  update: (state: PathologyUpdateState) => void;
  dispose: () => void;
}

function getMeshBounds(
  meshes: Map<string, THREE.Mesh>,
  name: string,
  fallbackCenter: [number, number, number],
  fallbackSize: [number, number, number]
): { center: THREE.Vector3; min: THREE.Vector3; max: THREE.Vector3 } {
  const mesh = meshes.get(name);
  if (mesh) {
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    if (box) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      return { center, min: box.min.clone(), max: box.max.clone() };
    }
  }
  const c = new THREE.Vector3(...fallbackCenter);
  const half = new THREE.Vector3(fallbackSize[0] * 0.5, fallbackSize[1] * 0.5, fallbackSize[2] * 0.5);
  return { center: c, min: c.clone().sub(half), max: c.clone().add(half) };
}

function makeGlowMaterial(
  colorHex: number,
  emissiveHex: number,
  opacity = 0.88,
  doubleSided = false
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    emissive: emissiveHex,
    emissiveIntensity: 0.48,
    roughness: 0.34,
    metalness: 0.04,
    clearcoat: 0.45,
    clearcoatRoughness: 0.24,
    transparent: opacity < 1,
    opacity,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: opacity >= 0.85,
  });
}

function makeSoftBruiseSphere(
  radius: number,
  scaleVec: [number, number, number],
  pos: THREE.Vector3,
  mat: THREE.MeshPhysicalMaterial
): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 24, 18);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  mesh.scale.set(...scaleVec);
  return mesh;
}

/**
 * Builds anatomically registered 3D pathology overlays derived directly from the
 * loaded GLB bone/meniscus/cartilage bounding geometry so every Radiology Assistant
 * pathology module exhibits crisp, interactive 3D structure + lesions.
 */
export function createPathologyOverlaySystem(
  ctx: PathologyOverlayContext
): PathologyOverlaySystem {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const medialSign = ctx.laterality === 'Right' ? 1 : -1;
  const latSign = -medialSign;

  const medMenBounds = getMeshBounds(
    ctx.meshes,
    'MedialMeniscus',
    [0.99 * medialSign, -0.21, 0.26],
    [1.3, 0.38, 1.84]
  );
  const tibBounds = getMeshBounds(
    ctx.meshes,
    'Tibia',
    [-0.1 * medialSign, -1.08, 0.1],
    [3.2, 2.58, 2.47]
  );
  const femBounds = getMeshBounds(
    ctx.meshes,
    'Femur',
    [0.07 * medialSign, 1.25, 0.28],
    [3.56, 2.92, 2.64]
  );
  const patBounds = getMeshBounds(
    ctx.meshes,
    'Patella',
    [-0.44 * medialSign, 1.47, 1.97],
    [1.86, 1.72, 0.94]
  );

  const matLesionCrimson = trackMat(makeGlowMaterial(0xf43f5e, 0x9f1239, 0.95, true));
  const matBruiseAmber = trackMat(makeGlowMaterial(0xe11d48, 0x9f1239, 0.78, false));
  const matSegondBone = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xfef3c7,
      emissive: 0x991b1b,
      emissiveIntensity: 0.44,
      roughness: 0.42,
      clearcoat: 0.2,
    })
  );
  const matCystCyan = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.56,
      roughness: 0.14,
      metalness: 0.0,
      clearcoat: 0.92,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.84,
      depthWrite: true,
    })
  );
  const matChondralRing = trackMat(makeGlowMaterial(0xf59e0b, 0xb91c1c, 0.92, true));

  // ============================================================================
  // 1. Meniscal Tear Morphologies + Parameniscal Cyst + Posterior Root + Ramp
  // ============================================================================
  const topY = medMenBounds.max.y - 0.03;
  const medOuterX = medialSign > 0 ? medMenBounds.max.x - 0.14 : medMenBounds.min.x + 0.14;
  const medInnerX = medialSign > 0 ? medMenBounds.min.x + 0.24 : medMenBounds.max.x - 0.24;
  const medMidX = (medOuterX + medInnerX) * 0.5;

  // Longitudinal tear: circumferential blade breaking cleanly through superior peripheral surface
  const longCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(medOuterX - 0.28 * medialSign, topY - 0.04, -0.52),
    new THREE.Vector3(medOuterX - 0.10 * medialSign, topY - 0.01, -0.18),
    new THREE.Vector3(medOuterX - 0.06 * medialSign, topY, 0.24),
    new THREE.Vector3(medOuterX - 0.20 * medialSign, topY - 0.02, 0.62),
  ]);
  const longMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(longCurve, 32, 0.056, 12, false)),
    matLesionCrimson
  );
  longMesh.scale.set(1, 1.8, 1);
  ctx.medialMeniscusGroup.add(longMesh);

  // Radial tear: wedge/blade cutting perpendicularly from inner free edge outward
  const radialMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.72, 0.34, 0.085)),
    matLesionCrimson
  );
  radialMesh.position.set(medMidX - 0.14 * medialSign, topY - 0.08, 0.18);
  radialMesh.rotation.y = medialSign * -0.18;
  ctx.medialMeniscusGroup.add(radialMesh);

  // Horizontal cleavage tear + bulging translucent cyan Parameniscal Cyst
  const horizGroup = new THREE.Group();
  const horizCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(medInnerX + 0.08 * medialSign, topY - 0.04, -0.26),
    new THREE.Vector3(medMidX + 0.1 * medialSign, topY - 0.02, -0.04),
    new THREE.Vector3(medOuterX + 0.06 * medialSign, topY - 0.02, 0.04),
  ]);
  const horizBlade = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(horizCurve, 24, 0.058, 12, false)),
    matLesionCrimson
  );
  horizBlade.scale.set(1.12, 0.72, 1.45);
  horizGroup.add(horizBlade);

  const cystMain = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.25, 24, 18)),
    matCystCyan
  );
  cystMain.position.set(medOuterX + 0.26 * medialSign, topY - 0.01, 0.04);
  cystMain.scale.set(0.95, 0.88, 1.32);
  const cystLobe = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.17, 20, 14)),
    matCystCyan
  );
  cystLobe.position.set(medOuterX + 0.36 * medialSign, topY - 0.05, 0.24);
  horizGroup.add(cystMain, cystLobe);
  ctx.medialMeniscusGroup.add(horizGroup);

  // Posterior Root Avulsion Cleft (right at posterior tibial anchor medial to PCL)
  const rootGroup = new THREE.Group();
  const rootCleft = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.16, 0.042, 12, 24)),
    matLesionCrimson
  );
  rootCleft.position.set(0.5 * medialSign, topY - 0.03, -0.48);
  rootCleft.rotation.x = Math.PI * 0.48;
  const rootGap = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.09, 0.24, 0.16)),
    matLesionCrimson
  );
  rootGap.position.copy(rootCleft.position);
  rootGroup.add(rootCleft, rootGap);
  ctx.tibiaBodyGroup.add(rootGroup);

  // Posteromedial Ramp / Peripheral Capsular Tear (for Unhappy Triad)
  const rampCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(medOuterX - 0.1 * medialSign, topY - 0.02, -0.22),
    new THREE.Vector3(medOuterX - 0.22 * medialSign, topY - 0.02, -0.45),
    new THREE.Vector3(medInnerX + 0.12 * medialSign, topY - 0.03, -0.56),
  ]);
  const rampMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(rampCurve, 20, 0.052, 10, false)),
    matLesionCrimson
  );
  ctx.medialMeniscusGroup.add(rampMesh);

  // ============================================================================
  // 2. ACL Rupture: Pivot-Shift Kissing Bruises + Segond Cortical Flake
  // ============================================================================
  const aclBruiseFemur = makeSoftBruiseSphere(
    0.25,
    [0.85, 0.72, 1.15],
    new THREE.Vector3(0.9 * latSign, 0.28, 0.22),
    matBruiseAmber
  );
  ctx.femurGroup.add(aclBruiseFemur);

  const aclTibiaOverlays = new THREE.Group();
  const aclBruiseTibia = makeSoftBruiseSphere(
    0.25,
    [0.9, 0.65, 1.0],
    new THREE.Vector3(0.95 * latSign, -0.14, -0.56),
    matBruiseAmber
  );
  // Segond cortical avulsion flake just distal to lateral tibial plateau rim
  const segondEdgeX = (latSign < 0 ? tibBounds.min.x : tibBounds.max.x) + 0.11 * latSign;
  const segondFlake = new THREE.Mesh(
    trackGeo(new THREE.DodecahedronGeometry(0.14, 1)),
    matSegondBone
  );
  segondFlake.position.set(segondEdgeX, -0.42, -0.18);
  segondFlake.scale.set(0.42, 1.4, 0.72);
  aclTibiaOverlays.add(aclBruiseTibia, segondFlake);
  ctx.tibiaBodyGroup.add(aclTibiaOverlays);

  // ============================================================================
  // 3. PCL Dashboard Tear: Anterior Proximal Tibial Contusion
  // ============================================================================
  const pclDashboardBruise = makeSoftBruiseSphere(
    0.28,
    [1.05, 0.85, 0.62],
    new THREE.Vector3(0.08 * latSign, -0.52, 0.78),
    matBruiseAmber
  );
  ctx.tibiaBodyGroup.add(pclDashboardBruise);

  // ============================================================================
  // 4. Unhappy Triad Valgus Contusions (Lateral Compartment Crush)
  // ============================================================================
  const triadFemurBruise = makeSoftBruiseSphere(
    0.25,
    [0.88, 0.75, 1.1],
    new THREE.Vector3(0.94 * latSign, 0.26, -0.06),
    matBruiseAmber
  );
  ctx.femurGroup.add(triadFemurBruise);

  const triadTibiaBruise = makeSoftBruiseSphere(
    0.25,
    [0.92, 0.65, 1.0],
    new THREE.Vector3(0.96 * latSign, -0.14, -0.38),
    matBruiseAmber
  );
  ctx.tibiaBodyGroup.add(triadTibiaBruise);

  // ============================================================================
  // 5. Patellar Dislocation: Torn Crimson MPFL Band + Kissing Contusions
  // ============================================================================
  const mpflPatellaStart = new THREE.Vector3(
    (medialSign > 0 ? patBounds.max.x : patBounds.min.x) - 0.1 * medialSign,
    patBounds.center.y + 0.1,
    patBounds.center.z - 0.12
  );
  const mpflFemurOrigin = new THREE.Vector3(
    (medialSign > 0 ? femBounds.max.x : femBounds.min.x) - 0.05 * medialSign,
    femBounds.center.y + 0.12,
    femBounds.center.z + 0.3
  );

  // Build 2 separated wide MPFL strap stumps so lateral subluxation visibly pulls a central gap
  const mpflStumpFemur = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.11, 0.78, 0.17)),
    matLesionCrimson
  );
  ctx.femurGroup.add(mpflStumpFemur);

  const mpflStumpPatella = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.11, 0.68, 0.17)),
    matLesionCrimson
  );
  ctx.femurGroup.add(mpflStumpPatella);

  const mpflGapCore = new THREE.Mesh(
    trackGeo(new THREE.OctahedronGeometry(0.12, 0)),
    matBruiseAmber
  );
  ctx.femurGroup.add(mpflGapCore);

  // Kissing contusion 1: Inferomedial patellar facet (attached to patellaGroup so it glides with Patella)
  const patellarMedialBruise = makeSoftBruiseSphere(
    0.22,
    [0.85, 0.9, 0.56],
    new THREE.Vector3(0.24 * medialSign, patBounds.center.y - 0.36, patBounds.min.z + 0.14),
    matBruiseAmber
  );
  ctx.patellaGroup.add(patellarMedialBruise);

  // Kissing contusion 2: Anterolateral femoral trochlear rim
  const femoralTrochleaBruise = makeSoftBruiseSphere(
    0.25,
    [0.82, 1.0, 0.75],
    new THREE.Vector3(0.95 * latSign, 1.05, 1.15),
    matBruiseAmber
  );
  ctx.femurGroup.add(femoralTrochleaBruise);

  // ============================================================================
  // 6. Chondral OA: Outerbridge III-IV Weight-Bearing Condyle Marker Ring
  // ============================================================================
  const chondralMarker = new THREE.Group();
  const chondralRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.24, 0.032, 12, 32)),
    matChondralRing
  );
  chondralRing.rotation.x = Math.PI * 0.48;
  chondralRing.rotation.y = medialSign * -0.12;
  const chondralCenter = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.15, 18, 14)),
    matBruiseAmber
  );
  chondralCenter.scale.set(1.1, 0.36, 1.1);
  chondralMarker.position.set(0.86 * medialSign, -0.08, 0.04);
  chondralMarker.add(chondralRing, chondralCenter);
  ctx.femurGroup.add(chondralMarker);

  const upVec = new THREE.Vector3(0, 1, 0);
  const tmpPatStart = new THREE.Vector3();
  const tmpMid = new THREE.Vector3();
  const tmpDir = new THREE.Vector3();

  const positionLimbBetween = (
    mesh: THREE.Mesh,
    a: THREE.Vector3,
    b: THREE.Vector3,
    tStart: number,
    tEnd: number
  ) => {
    const p1 = tmpPatStart.copy(a).lerp(b, tStart);
    const p2 = tmpMid.copy(a).lerp(b, tEnd);
    mesh.position.copy(p1).lerp(p2, 0.5);
    tmpDir.copy(p2).sub(p1);
    const len = tmpDir.length();
    if (len > 0.01) {
      tmpDir.normalize();
      mesh.quaternion.setFromUnitVectors(upVec, tmpDir);
    }
  };

  return {
    update(state: PathologyUpdateState) {
      const { moduleId, subStepId, meniscalTearMorphology, kinematics, visibility, elapsedSec } =
        state;
      const pulse = 0.42 + 0.14 * Math.sin(elapsedSec * 2.6);
      matLesionCrimson.emissiveIntensity = pulse;
      matChondralRing.emissiveIntensity = pulse;

      // Reset visibility
      longMesh.visible = false;
      radialMesh.visible = false;
      horizGroup.visible = false;
      rootGroup.visible = false;
      rampMesh.visible = false;
      aclBruiseFemur.visible = false;
      aclTibiaOverlays.visible = false;
      pclDashboardBruise.visible = false;
      triadFemurBruise.visible = false;
      triadTibiaBruise.visible = false;
      mpflStumpFemur.visible = false;
      mpflStumpPatella.visible = false;
      mpflGapCore.visible = false;
      patellarMedialBruise.visible = false;
      femoralTrochleaBruise.visible = false;
      chondralMarker.visible = false;

      if (moduleId === 'meniscal-tears-3d' && visibility.menisci) {
        longMesh.visible = meniscalTearMorphology === 'longitudinal' || !meniscalTearMorphology;
        radialMesh.visible = meniscalTearMorphology === 'radial';
        horizGroup.visible = meniscalTearMorphology === 'horizontal';
      }

      if (moduleId === 'posterior-root' && visibility.menisci) {
        rootGroup.visible = true;
      }

      if (moduleId === 'acl-rupture') {
        const showBruise = subStepId === 'acl-bruises' || subStepId === 'acl-tear-gap';
        aclBruiseFemur.visible = visibility.bones && showBruise;
        aclTibiaOverlays.visible = visibility.bones && showBruise;
      }

      if (moduleId === 'pcl-dashboard') {
        pclDashboardBruise.visible =
          visibility.bones && (subStepId === 'pcl-sag' || subStepId === 'pcl-midsubstance');
      }

      if (moduleId === 'unhappy-triad') {
        triadFemurBruise.visible = visibility.bones;
        triadTibiaBruise.visible = visibility.bones;
        rampMesh.visible = visibility.menisci && subStepId === 'triad-meniscus';
      }

      if (moduleId === 'patellar-dislocation') {
        const showMpfl = visibility.extensor || visibility.collaterals;
        mpflStumpFemur.visible = showMpfl;
        mpflStumpPatella.visible = showMpfl;
        mpflGapCore.visible = showMpfl;

        patellarMedialBruise.visible = visibility.extensor;
        femoralTrochleaBruise.visible = visibility.bones;

        const worldPatStart = new THREE.Vector3(
          mpflPatellaStart.x + kinematics.patellaLateralShiftX,
          mpflPatellaStart.y + kinematics.patellaDropY,
          mpflPatellaStart.z + kinematics.patellaShiftZ
        );
        // Femoral stump spans 0..42% from femoral adductor tubercle; patellar stump spans 58%..100%
        positionLimbBetween(mpflStumpFemur, mpflFemurOrigin, worldPatStart, 0.0, 0.42);
        positionLimbBetween(mpflStumpPatella, mpflFemurOrigin, worldPatStart, 0.58, 1.0);
        mpflGapCore.position.copy(mpflFemurOrigin).lerp(worldPatStart, 0.5);
        mpflGapCore.rotation.y = elapsedSec * 1.1;
      }

      if (moduleId === 'chondral-oa' && visibility.cartilage && subStepId !== 'oa-map') {
        chondralMarker.visible = true;
      }
    },

    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
    },
  };
}
