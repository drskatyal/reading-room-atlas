import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { applyBoneOsteologyShading } from '../anatomyMaterials';
import { computeKneeKinematics, rasToThree, threeToRas } from '../coordinates';
import {
  ALL_STRUCTURE_IDS,
  ANATOMY_SYSTEM_GROUPS,
  LAYER_GROUPS,
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
import { PATHOLOGY_REPORTING_DETAILS } from '../../data/pathologyReportingData';
import {
  FIVE_PASS_SCROLL_ORDER,
  RA_GUIDE_CHAPTERS,
  SIX_BLIND_SPOTS,
} from '../../data/radiologyAssistantGuideData';

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

  it('provides 17 modules, MRI annotations, valid sub-steps & reports', () => {
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
        const detail = PATHOLOGY_REPORTING_DETAILS[mod.id];
        expect(detail).toBeDefined();
        expect(detail.grades.length).toBeGreaterThanOrEqual(3);
        expect(detail.howToReport.length).toBeGreaterThanOrEqual(4);
      }
      const kin = computeKneeKinematics(mod.subSteps[0].flexionDeg, mod.id, 0.04, 'Right');
      const rep = buildKneeFellowshipReport(mod.id, mod.subSteps[0].flexionDeg, kin.anteriorDrawerMm);
      expect(rep.findings.length).toBeGreaterThanOrEqual(3);
      expect(rep.impression.length).toBeGreaterThanOrEqual(1);
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

  it('covers all 16 structures across LAYER_GROUPS and ANATOMY_SYSTEM_GROUPS with MRI overlays', () => {
    expect(ALL_STRUCTURE_IDS.length).toBe(16);
    expect(LAYER_GROUPS.length).toBe(6);

    const layerCovered = new Set(LAYER_GROUPS.flatMap((g) => g.structures));
    for (const sid of ALL_STRUCTURE_IDS) {
      expect(layerCovered.has(sid)).toBe(true);
      expect(sid in STRUCTURES_INFO).toBe(true);
    }

    const treeCovered = new Set<string>();
    let totalLandmarks = 0;

    for (const group of ANATOMY_SYSTEM_GROUPS) {
      for (const entry of group.entries) {
        treeCovered.add(entry.structureId);
        expect(entry.defaultLandmark.structureId).toBe(entry.structureId);
        expect(entry.defaultLandmark.mriAnnotations?.length ?? 0).toBeGreaterThanOrEqual(1);
        totalLandmarks += 1;

        for (const sub of entry.subLandmarks ?? []) {
          expect(sub.structureId).toBe(entry.structureId);
          expect(sub.targetRas?.length).toBe(3);
          expect(sub.mriAnnotations?.length ?? 0).toBeGreaterThanOrEqual(1);
          totalLandmarks += 1;
        }
      }
    }

    for (const sid of ALL_STRUCTURE_IDS) {
      expect(treeCovered.has(sid)).toBe(true);
    }
    expect(totalLandmarks).toBeGreaterThanOrEqual(30);
  });

  it('validates 6 dictation-free reporting sections, patient presets, and SPA path routing', () => {
    expect(MRI_REPORTING_SECTIONS.length).toBe(6);
    const validModuleIds = new Set(KNEE_MODULES.map((m) => m.id));
    for (const sec of MRI_REPORTING_SECTIONS) {
      expect(sec.cards.length).toBeGreaterThanOrEqual(1);
      for (const card of sec.cards) {
        expect(card.normalLook.length).toBeGreaterThan(10);
        expect(card.pathologySigns.length).toBeGreaterThanOrEqual(1);
        expect('dictationNormal' in card).toBe(false);
        expect('dictationAbnormal' in card).toBe(false);
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

    expect(FIVE_PASS_SCROLL_ORDER).toHaveLength(5);
    expect(RA_GUIDE_CHAPTERS).toHaveLength(6);
    expect(SIX_BLIND_SPOTS).toHaveLength(6);
    for (const chapter of RA_GUIDE_CHAPTERS) {
      for (const plate of chapter.plates) {
        expect(plate.imageSrc.startsWith('/guide/')).toBe(true);
        expect(plate.imageSrc.endsWith('.png')).toBe(true);
        if (plate.link?.moduleId) {
          expect(KNEE_MODULES.some((m) => m.id === plate.link?.moduleId)).toBe(true);
        }
        if (plate.link?.structureId) {
          expect(STRUCTURES_INFO[plate.link.structureId]).toBeDefined();
        }
      }
    }
  });

  it('welds UV-seam vertices and writes valid osteology RGB vertex shading', () => {
    const sphere = new THREE.SphereGeometry(1.2, 24, 16);
    applyBoneOsteologyShading(sphere, 'Femur');

    const pos = sphere.getAttribute('position');
    const col = sphere.getAttribute('color');
    expect(col).toBeDefined();
    expect(col.count).toBe(pos.count);
    expect(col.itemSize).toBe(3);

    const byPos = new Map<string, [number, number, number]>();
    let seamPairsChecked = 0;

    for (let i = 0; i < pos.count; i++) {
      const r = col.getX(i);
      const g = col.getY(i);
      const b = col.getZ(i);
      expect(Number.isFinite(r) && r >= 0.25 && r <= 1.0).toBe(true);
      expect(Number.isFinite(g) && g >= 0.25 && g <= 1.0).toBe(true);
      expect(Number.isFinite(b) && b >= 0.25 && b <= 1.0).toBe(true);

      const key = `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
      const existing = byPos.get(key);
      if (existing) {
        expect(Math.abs(existing[0] - r)).toBeLessThan(1e-6);
        expect(Math.abs(existing[1] - g)).toBeLessThan(1e-6);
        expect(Math.abs(existing[2] - b)).toBeLessThan(1e-6);
        seamPairsChecked++;
      } else {
        byPos.set(key, [r, g, b]);
      }
    }

    expect(seamPairsChecked).toBeGreaterThan(0);
    sphere.dispose();
  });
});
