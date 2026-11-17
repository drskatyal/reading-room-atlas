import { describe, expect, it } from 'vitest';
import { computeKneeKinematics, rasToThree, threeToRas } from '../coordinates';
import { buildKneeFellowshipReport, KNEE_CHAPTERS } from '../../data/kneeClinicalAtlas';

describe('Knee Atlas coordinates & Right-knee kinematics', () => {
  it('round-trips RAS <-> Three.js coordinates accurately', () => {
    const center: [number, number, number] = [112.5, 21.0, -12.0];
    const sampleRas: [number, number, number] = [89.8, 24.5, -19.2];
    const three = rasToThree(sampleRas, center, 0.04);
    const back = threeToRas(three, center, 0.04);
    expect(back[0]).toBeCloseTo(sampleRas[0], 6);
    expect(back[1]).toBeCloseTo(sampleRas[1], 6);
    expect(back[2]).toBeCloseTo(sampleRas[2], 6);
  });

  it('models Right-knee screw-home rotation, ACL/PCL drawer, and outward medial extrusion', () => {
    const ext = computeKneeKinematics(0, 'normal-anatomy', 0.04, 'Right');
    const flex = computeKneeKinematics(45, 'normal-anatomy', 0.04, 'Right');
    expect(ext.screwHomeDeg).toBe(0);
    expect(flex.screwHomeDeg).toBeGreaterThan(10);
    expect(Math.abs(flex.anteriorDrawerMm)).toBeLessThan(1.5);

    const aclLachman = computeKneeKinematics(25, 'acl-rupture', 0.04, 'Right');
    expect(aclLachman.anteriorDrawerMm).toBeGreaterThan(6.0);

    const pclSag = computeKneeKinematics(80, 'pcl-dashboard', 0.04, 'Right');
    expect(pclSag.anteriorDrawerMm).toBeLessThan(-6.0);

    const rootTearRight = computeKneeKinematics(10, 'posterior-root', 0.04, 'Right');
    expect(rootTearRight.meniscalExtrusionMm).toBeGreaterThan(3.0);
    // In RAS, Right-knee Medial is smaller X => Three.js +X => extrusion shifts +X
    expect(rootTearRight.medialMeniscusShiftX).toBeGreaterThan(0.12);
  });

  it('generates valid structured PowerScribe dictation for all 6 chapters', () => {
    for (const ch of KNEE_CHAPTERS) {
      const kin = computeKneeKinematics(ch.defaultFlexionDeg, ch.id, 0.04, 'Right');
      const rep = buildKneeFellowshipReport(ch.id, ch.defaultFlexionDeg, kin.anteriorDrawerMm);
      expect(rep.findings.length).toBeGreaterThanOrEqual(4);
      expect(rep.impression.length).toBeGreaterThanOrEqual(1);
      expect(rep.dictationText).toContain('FINDINGS:');
      expect(rep.dictationText).toContain('IMPRESSION:');
    }
  });
});
