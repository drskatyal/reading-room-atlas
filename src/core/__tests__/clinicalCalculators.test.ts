import { describe, expect, it } from 'vitest';
import {
  buildCarotidReport,
  buildKneeReport,
  buildLiradsReport,
  buildTemporalReport,
  buildTiradsReport,
  calculateAcrLirads,
  calculateAcrTirads,
  classifySruDirect,
  computeSpencerHemodynamics,
} from '../clinicalCalculators';

describe('Clinical Calculators & Report Engines', () => {
  it('computes SRU 2003 Carotid thresholds and Spencer near-occlusion drop-off accurately', () => {
    const mod = computeSpencerHemodynamics(60, 80);
    expect(mod.sruCategory).toBe('50–69% Stenosis');
    expect(mod.psv).toBeGreaterThanOrEqual(125);
    expect(mod.psv).toBeLessThan(230);

    const sev = computeSpencerHemodynamics(82, 85);
    expect(sev.sruCategory).toBe('≥ 70% to Near-Occlusion');
    expect(sev.psv).toBeGreaterThanOrEqual(230);
    expect(sev.edv).toBeGreaterThanOrEqual(100);

    const nearOcc = computeSpencerHemodynamics(96, 85);
    expect(nearOcc.sruCategory).toBe('Near-Occlusion (String Sign)');
    expect(nearOcc.spencerFlowIndex).toBeLessThan(30);

    const direct = classifySruDirect(260, 115, 60);
    expect(direct.category).toBe('≥ 70% to Near-Occlusion');
    expect(direct.ratio).toBe(4.33);

    const report = buildCarotidReport(
      {
        side: 'Left',
        stenosisPct: 82,
        ccaPsv: 85,
        plaqueType: 'Calcified',
        vertebralFlow: 'Antegrade',
      },
      sev
    );
    expect(report.impression[0]).toContain('Left ICA: ≥ 70% to Near-Occlusion');
  });

  it('scores ACR TI-RADS 2017 points and FNA/Follow-up thresholds accurately', () => {
    // Spongiform should always be 0 pts / TR1
    const spongy = calculateAcrTirads({
      lobe: 'Right',
      pole: 'Lower',
      sizeMm: 32,
      composition: 'spongiform',
      echogenicity: 'hypoechoic',
      shape: 'taller',
      margin: 'lobulated',
      foci: 'punctate',
    });
    expect(spongy.points).toBe(0);
    expect(spongy.category).toBe('TR1');
    expect(spongy.action).toBe('No FNA or Follow-up');

    // Classic TR5 (solid 2 + very hypoechoic 3 + taller 3 + punctate 3 = 11)
    const tr5 = calculateAcrTirads({
      lobe: 'Right',
      pole: 'Mid',
      sizeMm: 11,
      composition: 'solid',
      echogenicity: 'very-hypoechoic',
      shape: 'taller',
      margin: 'smooth',
      foci: 'punctate',
    });
    expect(tr5.points).toBe(11);
    expect(tr5.category).toBe('TR5');
    expect(tr5.action).toBe('FNA Recommended');

    const tr5Small = calculateAcrTirads({
      lobe: 'Left',
      pole: 'Upper',
      sizeMm: 7,
      composition: 'solid',
      echogenicity: 'hypoechoic',
      shape: 'taller',
      margin: 'smooth',
      foci: 'none',
    });
    expect(tr5Small.points).toBe(7);
    expect(tr5Small.category).toBe('TR5');
    expect(tr5Small.action).toBe('Follow-up US Recommended');

    const report = buildTiradsReport(
      {
        lobe: 'Right',
        pole: 'Mid',
        sizeMm: 11,
        composition: 'solid',
        echogenicity: 'very-hypoechoic',
        shape: 'taller',
        margin: 'smooth',
        foci: 'punctate',
      },
      tr5
    );
    expect(report.categoryBadge).toContain('ACR TR5 (11 pts)');
  });

  it('classifies ACR LI-RADS v2018 categories and ancillary rule (cannot upgrade LR-4 to LR-5)', () => {
    // 14mm with APHE + capsule only => LR-4 even with ancillary malignancy
    const lr4 = calculateAcrLirads({
      segment: 'VIII',
      sizeMm: 14,
      aphe: true,
      washout: false,
      capsule: true,
      thresholdGrowth: false,
      isBenignCystOrHemangioma: false,
      isTargetoidLrm: false,
      isTumorInVein: false,
      ancillaryMalignancy: true,
      ancillaryBenign: false,
    });
    expect(lr4.category).toBe('LR-4');

    // 14mm with APHE + washout => LR-5
    const lr5Small = calculateAcrLirads({
      segment: 'VIII',
      sizeMm: 14,
      aphe: true,
      washout: true,
      capsule: false,
      thresholdGrowth: false,
      isBenignCystOrHemangioma: false,
      isTargetoidLrm: false,
      isTumorInVein: false,
      ancillaryMalignancy: false,
      ancillaryBenign: false,
    });
    expect(lr5Small.category).toBe('LR-5');

    // Targetoid => LR-M
    const lrm = calculateAcrLirads({
      segment: 'IVa',
      sizeMm: 35,
      aphe: true,
      washout: true,
      capsule: false,
      thresholdGrowth: false,
      isBenignCystOrHemangioma: false,
      isTargetoidLrm: true,
      isTumorInVein: false,
      ancillaryMalignancy: false,
      ancillaryBenign: false,
    });
    expect(lrm.category).toBe('LR-M');

    const report = buildLiradsReport(
      {
        segment: 'VIII',
        sizeMm: 14,
        aphe: true,
        washout: true,
        capsule: false,
        thresholdGrowth: false,
        isBenignCystOrHemangioma: false,
        isTargetoidLrm: false,
        isTumorInVein: false,
        ancillaryMalignancy: false,
        ancillaryBenign: false,
      },
      lr5Small
    );
    expect(report.impression[0]).toContain('LR-5');
  });

  it('builds structured Knee MRI and Temporal Bone reports', () => {
    const knee = buildKneeReport({
      side: 'Right',
      pathology: 'bucket-handle-medial',
      effusion: 'Small',
      boneContusion: false,
      flexionDeg: 15,
    });
    expect(knee.findings.join(' ')).toContain('double PCL sign');

    const temp = buildTemporalReport('Left', 'sscd');
    expect(temp.impression[0]).toContain('superior semicircular canal dehiscence');
  });
});
