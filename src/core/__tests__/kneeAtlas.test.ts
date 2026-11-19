import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { applyBoneOsteologyShading } from '../anatomyMaterials';
import { computeKneeKinematics, rasToThree, threeToRas } from '../coordinates';
import { buildRoute, parseRoute } from '../routing';
import {
  ALL_STRUCTURE_IDS,
  ANATOMY_SYSTEM_GROUPS,
  LAYER_GROUPS,
  modeToPath,
  MRI_REPORTING_SECTIONS,
  PATIENT_DEMO_PRESETS,
  pathToMode,
} from '../../data/anatomyAndReportingData';
import { ALL_JOINT_ATLASES, ANKLE_ATLAS } from '../../data/joints';
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

const PUBLIC_ROOT = path.resolve(process.cwd(), 'public');
const SRC_ROOT = path.resolve(process.cwd(), 'src');

function collectAllStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') {
    acc.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectAllStrings(item, acc);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectAllStrings(v, acc);
  }
  return acc;
}

describe('ReadingRoom Multi-Joint 3T Atlas & Platform Suite', () => {
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

  it('provides 19 upgraded Knee modules incl. Ramp/Wrisberg & SIFK with MRI annotations & reports', () => {
    const normalModules = KNEE_MODULES.filter((m) => m.category === 'normal');
    const approachModules = KNEE_MODULES.filter((m) => m.category === 'approach');
    const pathModules = KNEE_MODULES.filter((m) => m.category === 'pathology');
    expect(normalModules.length).toBe(4);
    expect(approachModules.length).toBe(5);
    expect(pathModules.length).toBe(10);

    for (const mod of KNEE_MODULES) {
      expect(mod.subSteps.length).toBeGreaterThanOrEqual(2);
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
        expect(detail.howToReport.length).toBeGreaterThanOrEqual(3);
      }
      const kin = computeKneeKinematics(mod.subSteps[0].flexionDeg, mod.id, 0.04, 'Right');
      const rep = buildKneeFellowshipReport(mod.id, mod.subSteps[0].flexionDeg, kin.anteriorDrawerMm);
      expect(rep.findings.length).toBeGreaterThanOrEqual(3);
      expect(rep.impression.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('validates all 8 Knee resident active-recall quiz questions & 16 structures', () => {
    expect(RESIDENT_QUIZ_QUESTIONS.length).toBe(8);
    expect(ALL_STRUCTURE_IDS.length).toBe(16);
    expect(LAYER_GROUPS.length).toBe(6);

    const layerCovered = new Set(LAYER_GROUPS.flatMap((g) => g.structures));
    const treeCovered = new Set<string>();
    for (const sid of ALL_STRUCTURE_IDS) {
      expect(layerCovered.has(sid)).toBe(true);
      expect(sid in STRUCTURES_INFO).toBe(true);
    }
    for (const group of ANATOMY_SYSTEM_GROUPS) {
      for (const entry of group.entries) {
        treeCovered.add(entry.structureId);
        expect(entry.defaultLandmark.structureId).toBe(entry.structureId);
        expect(entry.defaultLandmark.mriAnnotations?.length ?? 0).toBeGreaterThanOrEqual(1);
      }
    }
    for (const sid of ALL_STRUCTURE_IDS) expect(treeCovered.has(sid)).toBe(true);

    expect(MRI_REPORTING_SECTIONS.length).toBe(6);
    expect(PATIENT_DEMO_PRESETS.filter((p) => p.group === 'pathology').length).toBe(8);
    expect(FIVE_PASS_SCROLL_ORDER).toHaveLength(5);
    expect(RA_GUIDE_CHAPTERS).toHaveLength(6);
    expect(SIX_BLIND_SPOTS).toHaveLength(6);
  });

  it('validates Ankle Flagship depth and full structural/referential integrity across all 6 joints', () => {
    expect(ALL_JOINT_ATLASES).toHaveLength(6);

    // Ankle Flagship requirements
    expect(Object.keys(ANKLE_ATLAS.structuresInfo).length).toBeGreaterThanOrEqual(22);
    expect(ANKLE_ATLAS.modules.filter((m) => m.category === 'pathology').length).toBeGreaterThanOrEqual(10);
    expect(ANKLE_ATLAS.reportGuide.chapters.length).toBeGreaterThanOrEqual(8);
    expect(ANKLE_ATLAS.quizQuestions.length).toBeGreaterThanOrEqual(10);

    for (const joint of ALL_JOINT_ATLASES) {
      const structIds = Object.keys(joint.structuresInfo);
      expect(structIds.length).toBeGreaterThanOrEqual(15);

      const layerCovered = new Set(joint.layerGroups.flatMap((g) => g.structures));
      const treeCovered = new Set<string>();
      for (const sid of structIds) {
        expect(layerCovered.has(sid), `${joint.id} missing ${sid} from layerGroups`).toBe(true);
      }
      for (const group of joint.anatomySystemGroups) {
        for (const entry of group.entries) {
          treeCovered.add(entry.structureId);
          expect(entry.defaultLandmark.structureId).toBe(entry.structureId);
          expect(entry.defaultLandmark.mriAnnotations?.length ?? 0).toBeGreaterThanOrEqual(1);
        }
      }
      for (const sid of structIds) {
        expect(treeCovered.has(sid), `${joint.id} missing ${sid} from anatomySystemGroups`).toBe(true);
      }

      const validModuleIds = new Set(joint.modules.map((m) => m.id));
      const pathologyMods = joint.modules.filter((m) => m.category === 'pathology');
      expect(pathologyMods.length).toBeGreaterThanOrEqual(6);

      for (const mod of pathologyMods) {
        expect(mod.subSteps.length).toBeGreaterThanOrEqual(3);
        for (const step of mod.subSteps) {
          expect(step.focusStructure in joint.structuresInfo, `${joint.id}:${mod.id}:${step.id}`).toBe(true);
          expect(step.mriAnnotations?.length ?? 0).toBeGreaterThanOrEqual(1);
        }
        const rep = joint.pathologyReportingDetails[mod.id];
        expect(rep, `${joint.id} missing pathologyReportingDetails for ${mod.id}`).toBeDefined();
        expect(rep.grades.length).toBeGreaterThanOrEqual(2);
        expect(rep.howToReport.length).toBeGreaterThanOrEqual(3);
      }

      for (const spec of joint.pathology3DSpecs) {
        expect(validModuleIds.has(spec.moduleId), `${joint.id} unknown 3D spec module ${spec.moduleId}`).toBe(true);
      }

      for (const preset of joint.patientDemoPresets) {
        const mod = joint.modules.find((m) => m.id === preset.moduleId);
        expect(mod, `${joint.id} preset ${preset.id}`).toBeDefined();
        expect(preset.subStepIndex).toBeLessThan(mod!.subSteps.length);
      }

      for (const q of joint.quizQuestions) {
        expect(validModuleIds.has(q.moduleId), `${joint.id} quiz ${q.id}`).toBe(true);
        expect(q.options.some((o) => o.id === q.correctOptionId)).toBe(true);
        if (q.targetStructure) {
          expect(q.targetStructure in joint.structuresInfo).toBe(true);
        }
      }

      expect(joint.reportGuide.fivePassOrder).toHaveLength(5);
      expect(joint.reportGuide.blindSpots.length).toBeGreaterThanOrEqual(5);
      for (const ch of joint.reportGuide.chapters) {
        for (const plate of ch.plates) {
          if (plate.link?.moduleId) expect(validModuleIds.has(plate.link.moduleId)).toBe(true);
          if (plate.link?.structureId) expect(plate.link.structureId in joint.structuresInfo).toBe(true);
        }
      }
    }
  });

  it('verifies every GLB, NIfTI MRI volume, landmarks JSON, and guide PNG exists on disk and is non-empty', () => {
    const checkPublicAsset = (url: string, minBytes = 100) => {
      const cleanUrl = url.replace(/\?.*$/, '').replace(/^\//, '');
      const fullPath = path.join(PUBLIC_ROOT, cleanUrl);
      expect(fs.existsSync(fullPath), `Missing public asset: ${url}`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size, `Empty public asset: ${url}`).toBeGreaterThan(minBytes);
    };

    for (const joint of ALL_JOINT_ATLASES) {
      checkPublicAsset(joint.glbUrl);
      checkPublicAsset(joint.mriVolumeUrl, 500_000);
      checkPublicAsset(joint.mriSegUrl);
      if (joint.mriSubregionSegUrl) checkPublicAsset(joint.mriSubregionSegUrl);
      checkPublicAsset(joint.landmarksUrl);
      checkPublicAsset(joint.previewPlateSrc);
      for (const ch of joint.reportGuide.chapters) {
        for (const plate of ch.plates) {
          checkPublicAsset(plate.imageSrc);
        }
      }
    }
  });

  it('handles multi-joint SPA routing & legacy Knee paths accurately', () => {
    expect(parseRoute('/')).toEqual({ jointId: 'ankle', mode: 'landing' });
    expect(parseRoute('/ankle/pathology', '?module=atfl-cfl-sprain')).toEqual({
      jointId: 'ankle',
      mode: 'pathology',
      moduleParam: 'atfl-cfl-sprain',
    });
    expect(parseRoute('/shoulder/report-guide')).toEqual({
      jointId: 'shoulder',
      mode: 'report-guide',
      moduleParam: undefined,
    });
    expect(parseRoute('/pathology')).toEqual({
      jointId: 'knee',
      mode: 'pathology',
      moduleParam: undefined,
    });

    expect(buildRoute('ankle', 'landing')).toBe('/');
    expect(buildRoute('ankle', 'pathology', 'atfl-cfl-sprain')).toBe(
      '/ankle/pathology?module=atfl-cfl-sprain'
    );
    expect(buildRoute('hip', 'report-guide')).toBe('/hip/report-guide');

    expect(pathToMode('/3d')).toBe('fullscreen-3d');
    expect(modeToPath('report-guide')).toBe('/report-guide');
  });

  it('contains zero attribution mentions of external websites across all joint data and UI code', () => {
    const forbidden = /radiology\s*assistant|radsource|radiopaedia|\btotalsegmentator\b|\btcia\b/i;

    for (const joint of ALL_JOINT_ATLASES) {
      const strings = collectAllStrings(joint);
      for (const s of strings) {
        expect(s, `Forbidden attribution text in ${joint.id}: ${s.slice(0, 120)}`).not.toMatch(forbidden);
      }
      const lmPath = path.join(PUBLIC_ROOT, joint.landmarksUrl.replace(/\?.*$/, '').replace(/^\//, ''));
      const lmText = fs.readFileSync(lmPath, 'utf8');
      expect(lmText, `Forbidden source attribution in ${joint.landmarksUrl}`).not.toMatch(forbidden);
    }

    const walkFiles = (dir: string, acc: string[] = []): string[] => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) walkFiles(full, acc);
        else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts')) acc.push(full);
      }
      return acc;
    };

    for (const file of walkFiles(SRC_ROOT)) {
      const text = fs.readFileSync(file, 'utf8');
      // Exclude internal ES module import path string only; check all code, comments & JSX
      const stripped = text.replace(/from\s+['"][^'"]*radiologyAssistantGuideData['"]/g, '');
      expect(stripped, `Forbidden source attribution string found in ${file}`).not.toMatch(forbidden);
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

  it('ships de-identified multi-sequence clinical MRI studies for all 6 joints with zero patient metadata', () => {
    const forbiddenPhiKeys = /patient|birth|dob|accession|institution|physician|doctor|mrn|studydate|seriesdate|patientname|patientid/i;

    for (const joint of ALL_JOINT_ATLASES) {
      const manifestPath = path.join(PUBLIC_ROOT, 'studies', joint.id, 'manifest.json');
      expect(fs.existsSync(manifestPath), `Missing clinical study manifest: ${manifestPath}`).toBe(true);
      const raw = fs.readFileSync(manifestPath, 'utf8');
      expect(raw, `Potential PHI key/text in ${manifestPath}`).not.toMatch(forbiddenPhiKeys);

      const parsed = JSON.parse(raw) as {
        jointId: string;
        modality: string;
        sequences: Array<{
          id: string;
          label: string;
          plane: string;
          width: number;
          height: number;
          slices: number;
          file: string;
        }>;
      };
      expect(parsed.jointId).toBe(joint.id);
      expect(parsed.sequences.length).toBeGreaterThanOrEqual(5);

      for (const seq of parsed.sequences) {
        expect(seq.slices).toBeGreaterThanOrEqual(10);
        expect(seq.width).toBeGreaterThanOrEqual(128);
        expect(seq.height).toBeGreaterThanOrEqual(128);
        const binPath = path.join(PUBLIC_ROOT, seq.file.replace(/^\//, ''));
        expect(fs.existsSync(binPath), `Missing sequence stack: ${binPath}`).toBe(true);
        expect(fs.statSync(binPath).size, `Sequence stack too small: ${binPath}`).toBeGreaterThan(50_000);
      }
    }
  });
});
