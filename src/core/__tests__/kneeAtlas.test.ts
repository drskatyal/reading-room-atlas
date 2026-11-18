import { describe, expect, it } from 'vitest';
import { computeKneeKinematics, rasToThree, threeToRas } from '../coordinates';
import {
  ANATOMY_SYSTEM_GROUPS,
  modeToPath,
  MRI_REPORTING_SECTIONS,
  PATIENT_DEMO_PRESETS,
  pathToMode,
} from '../../data/anatomyAndReportingData';
import {
  buildKneeFellowshipReport,
  KNEE_MODULES,
  RESIDENT_QUIZ_QUESTIONS,
  STRUCTURES_INFO,
} from '../../data/kneeClinicalAtlas';

describe('Knee Atlas coordinates, curriculum & multi-mode navigation', () => {
  it('round-trips RAS <-> Three.js coordinates accurately', () => {
    const center: [number, number, number] = [112.5, 21.0, -12.0];
    const sampleRas: [number, number, number] = [89.8, 24.5, -19.2];
    const three = rasToThree(sampleRas, center, 0.04);
    const back = threeToRas(three, center, 0.04);
    expect(back[0]).toBeCloseTo(sampleRas[0], 6);
    expect(back[1]).toBeCloseTo(sampleRas[1], 6);
    expect(back[2]).toBeCloseTo(sampleRas[2], 6);
  });

  it('models Right-knee screw-home, ACL/PCL drawer, outward medial extrusion, and lateral patellar subluxation', () => {
    const ext = computeKneeKinematics(0, 'approach-sequences', 0.04, 'Right');
    const flex = computeKneeKinematics(45, 'approach-sequences', 0.04, 'Right');
    expect(ext.screwHomeDeg).toBe(0);
    expect(flex.screwHomeDeg).toBeGreaterThan(10);
    expect(Math.abs(flex.anteriorDrawerMm)).toBeLessThan(1.5);

    const aclLachman = computeKneeKinematics(25, 'acl-rupture', 0.04, 'Right');
    expect(aclLachman.anteriorDrawerMm).toBeGreaterThan(6.0);

    const pclSag = computeKneeKinematics(80, 'pcl-dashboard', 0.04, 'Right');
    expect(pclSag.anteriorDrawerMm).toBeLessThan(-6.0);

    const rootTearRight = computeKneeKinematics(10, 'posterior-root', 0.04, 'Right');
    expect(rootTearRight.meniscalExtrusionMm).toBeGreaterThan(3.0);
    expect(rootTearRight.medialMeniscusShiftX).toBeGreaterThan(0.12);

    const patDisloc = computeKneeKinematics(6, 'patellar-dislocation', 0.04, 'Right', 1.0);
    expect(patDisloc.patellaLateralShiftX).toBeLessThan(-0.4);
  });

  it('provides 17 Radiology Assistant modules, MRI annotations, valid sub-steps & PowerScribe reports', () => {
    const normalModules = KNEE_MODULES.filter((m) => m.category === 'normal');
    const approachModules = KNEE_MODULES.filter((m) => m.category === 'approach');
    const pathModules = KNEE_MODULES.filter((m) => m.category === 'pathology');
    expect(normalModules.length).toBe(4);
    expect(approachModules.length).toBe(5);
    expect(pathModules.length).toBe(8);

    for (const mod of KNEE_MODULES) {
      expect(mod.subSteps.length).toBeGreaterThanOrEqual(3);
      for (const step of mod.subSteps) {
        expect(step.focusStructure in STRUCTURES_INFO).toBe(true);
        expect(step.diagnosticRules.length).toBeGreaterThanOrEqual(2);
      }
      if (mod.category === 'pathology') {
        for (const step of mod.subSteps) {
          expect(step.mriAnnotations?.length ?? 0).toBeGreaterThanOrEqual(1);
        }
      }
      const kin = computeKneeKinematics(mod.subSteps[0].flexionDeg, mod.id, 0.04, 'Right');
      const rep = buildKneeFellowshipReport(mod.id, mod.subSteps[0].flexionDeg, kin.anteriorDrawerMm);
      expect(rep.findings.length).toBeGreaterThanOrEqual(3);
      expect(rep.impression.length).toBeGreaterThanOrEqual(1);
      expect(rep.dictationText).toContain('FINDINGS:');
    }
  });

  it('validates all 8 resident active-recall quiz questions', () => {
    expect(RESIDENT_QUIZ_QUESTIONS.length).toBe(8);
    for (const q of RESIDENT_QUIZ_QUESTIONS) {
      expect(q.options.some((o) => o.id === q.correctOptionId)).toBe(true);
      expect(q.explanation.length).toBeGreaterThan(20);
      if (q.targetStructure) {
        expect(q.targetStructure in STRUCTURES_INFO).toBe(true);
      }
    }
  });

  it('covers all 16 anatomical structures + sub-landmarks across 6 groups with MRI overlays', () => {
    const coveredIds = new Set<string>();
    let totalLandmarks = 0;

    for (const group of ANATOMY_SYSTEM_GROUPS) {
      for (const entry of group.entries) {
        coveredIds.add(entry.structureId);
        expect(entry.defaultLandmark.structureId).toBe(entry.structureId);
        expect((entry.defaultLandmark.mriAnnotations?.length ?? 0)).toBeGreaterThanOrEqual(1);
        totalLandmarks += 1;

        for (const sub of entry.subLandmarks ?? []) {
          expect(sub.structureId).toBe(entry.structureId);
          expect(sub.targetRas?.length).toBe(3);
          expect((sub.mriAnnotations?.length ?? 0)).toBeGreaterThanOrEqual(1);
          totalLandmarks += 1;
        }
      }
    }

    for (const sid of Object.keys(STRUCTURES_INFO)) {
      expect(coveredIds.has(sid)).toBe(true);
    }
    expect(totalLandmarks).toBeGreaterThanOrEqual(30);
  });

  it('validates reporting guide sections, patient presets, and SPA path routing', () => {
    expect(MRI_REPORTING_SECTIONS.length).toBe(7);
    const validModuleIds = new Set(KNEE_MODULES.map((m) => m.id));
    for (const sec of MRI_REPORTING_SECTIONS) {
      expect(sec.cards.length).toBeGreaterThanOrEqual(1);
      for (const card of sec.cards) {
        expect(card.dictationNormal.length).toBeGreaterThan(20);
        expect(card.dictationAbnormal.length).toBeGreaterThan(20);
        if (card.linkedModuleId) expect(validModuleIds.has(card.linkedModuleId)).toBe(true);
        if (card.linkedStructureId) expect(card.linkedStructureId in STRUCTURES_INFO).toBe(true);
      }
    }

    expect(PATIENT_DEMO_PRESETS.some((p) => p.group === 'healthy')).toBe(true);
    expect(PATIENT_DEMO_PRESETS.filter((p) => p.group === 'pathology').length).toBe(8);
    for (const preset of PATIENT_DEMO_PRESETS) {
      const mod = KNEE_MODULES.find((m) => m.id === preset.moduleId);
      expect(mod).toBeDefined();
      expect(preset.subStepIndex).toBeLessThan(mod!.subSteps.length);
    }

    expect(pathToMode('/')).toBe('anatomy');
    expect(pathToMode('/anatomy')).toBe('anatomy');
    expect(pathToMode('/3d')).toBe('fullscreen-3d');
    expect(pathToMode('/pathology')).toBe('pathology');
    expect(pathToMode('/report-guide')).toBe('report-guide');
    expect(pathToMode('/quiz')).toBe('quiz');
    expect(modeToPath('fullscreen-3d')).toBe('/3d');
    expect(modeToPath('report-guide')).toBe('/report-guide');
  });
});
