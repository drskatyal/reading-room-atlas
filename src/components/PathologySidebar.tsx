import { useEffect, useRef } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { KNEE_MODULES } from '../data/kneeClinicalAtlas';
import { PATHOLOGY_REPORTING_DETAILS } from '../data/pathologyReportingData';
import type { KneeModuleId } from '../types/atlas';

interface PathologySidebarProps {
  activeModuleId: KneeModuleId;
  subStepIndex: number;
  onSelectModule: (id: KneeModuleId) => void;
  onSelectSubStep: (index: number) => void;
  flexionDeg: number;
  onChangeFlexionDeg: (deg: number) => void;
  patellaSubluxation: number;
  onChangePatellaSubluxation: (val: number) => void;
  onOpenReportGuide: () => void;
}

const PATHOLOGY_MODULES = KNEE_MODULES.filter((m) => m.category === 'pathology');
const MOTION_SLIDER_MODULES = new Set<KneeModuleId>([
  'acl-rupture',
  'pcl-dashboard',
  'patellar-dislocation',
  'unhappy-triad',
  'chondral-oa',
]);

function stripLeadingNumber(label: string): string {
  return label.replace(/^\d+\.\s*/, '');
}

export function PathologySidebar({
  activeModuleId,
  subStepIndex,
  onSelectModule,
  onSelectSubStep,
  flexionDeg,
  onChangeFlexionDeg,
  patellaSubluxation,
  onChangePatellaSubluxation,
  onOpenReportGuide,
}: PathologySidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeIdx = Math.max(
    0,
    PATHOLOGY_MODULES.findIndex((m) => m.id === activeModuleId)
  );
  const activeMod = PATHOLOGY_MODULES[activeIdx] ?? PATHOLOGY_MODULES[0];
  const activeStep = activeMod.subSteps[subStepIndex] ?? activeMod.subSteps[0];
  const detail = PATHOLOGY_REPORTING_DETAILS[activeMod.id];
  const isPatella = activeMod.biomechControl === 'patella-reduction';
  const showMotionSlider = MOTION_SLIDER_MODULES.has(activeMod.id);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeMod.id]);

  return (
    <aside className="mode-sidebar pathology-sidebar" aria-label="Radiology Assistant pathology reference">
      {/* Compact Top Picker + 3-Step Visual Finding Tabs + Optional Motion Slider */}
      <div className="sidebar-sticky-head patho-sticky-head">
        <div className="patho-select-row">
          <select
            className="patho-select"
            value={activeMod.id}
            onChange={(e) => onSelectModule(e.target.value as KneeModuleId)}
            aria-label="Select knee pathology"
          >
            {PATHOLOGY_MODULES.map((mod, idx) => (
              <option key={mod.id} value={mod.id}>
                {idx + 1}. {mod.shortTitle}
              </option>
            ))}
          </select>

          <div className="step-arrows">
            <button
              type="button"
              className="arrow-btn"
              onClick={() => onSelectModule(PATHOLOGY_MODULES[activeIdx - 1].id)}
              disabled={activeIdx <= 0}
              aria-label="Previous pathology"
              title="Previous pathology"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="arrow-btn"
              onClick={() => onSelectModule(PATHOLOGY_MODULES[activeIdx + 1].id)}
              disabled={activeIdx >= PATHOLOGY_MODULES.length - 1}
              aria-label="Next pathology"
              title="Next pathology"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="segmented-pill patho-tabs" role="tablist" aria-label="Visual finding steps">
          {activeMod.subSteps.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={idx === subStepIndex}
              title={step.label}
              className={`pill-btn ${idx === subStepIndex ? 'active' : ''}`}
              onClick={() => onSelectSubStep(idx)}
            >
              {idx + 1} · {stripLeadingNumber(step.label)}
            </button>
          ))}
        </div>

        {showMotionSlider && (
          <label className="fs-motion-row patho-motion-row">
            <span>{isPatella ? 'Patella Slip' : 'Flexion'}</span>
            <input
              type="range"
              min={0}
              max={isPatella ? 1 : 90}
              step={isPatella ? 0.05 : 2}
              value={isPatella ? patellaSubluxation : flexionDeg}
              onChange={(e) =>
                isPatella
                  ? onChangePatellaSubluxation(Number(e.target.value))
                  : onChangeFlexionDeg(Number(e.target.value))
              }
              aria-label={isPatella ? 'Patellar subluxation slider' : 'Knee flexion slider'}
            />
            <span className="slider-val">
              {isPatella ? `${Math.round(patellaSubluxation * 100)}%` : `${flexionDeg}°`}
            </span>
          </label>
        )}
      </div>

      {/* Scrollable Radiology Assistant Editorial Article */}
      <div ref={scrollRef} className="patho-editorial-scroll">
        <div className="patho-plane-tag">{detail?.sequencesAndPlanes ?? '3T qDESS / PD'}</div>
        <h2 className="patho-article-title">{activeMod.title}</h2>
        <div className="patho-hallmark">{activeMod.diagnosticSign}</div>
        <p className="patho-prose">{detail?.mechanism ?? activeMod.summary}</p>

        <section className="patho-sec">
          <h3 className="patho-sec-title">Active View · {activeStep.targetBadge}</h3>
          <p className="patho-prose">{activeStep.whatToLookFor}</p>
          <ul className="patho-bullet-list">
            {activeStep.diagnosticRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        {detail && (
          <section className="patho-sec">
            <h3 className="patho-sec-title">{detail.gradingTitle}</h3>
            <table className="ra-mini-table">
              <tbody>
                {detail.grades.map((g) => (
                  <tr key={g.label}>
                    <th scope="row">{g.label}</th>
                    <td>{g.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {detail && (
          <section className="patho-sec">
            <h3 className="patho-sec-title">What to Include in Your Report</h3>
            <ul className="patho-report-list">
              {detail.howToReport.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="patho-surg-note">
              <strong>Threshold:</strong> {detail.surgicalNote}
            </p>
          </section>
        )}

        <section className="patho-sec">
          <div className="rail-callout">
            <div className="rail-callout-head">
              <Lightbulb size={12} />
              <span>Pitfall &amp; Clinical Pearl</span>
            </div>
            <p className="rail-callout-body">{activeStep.pitfallAndHook}</p>
            {activeMod.boardPearls[0] && (
              <p className="rail-callout-body">
                <strong>{activeMod.boardPearls[0].exam}:</strong> {activeMod.boardPearls[0].pearl}
              </p>
            )}
          </div>

          <button type="button" className="patho-guide-link" onClick={onOpenReportGuide}>
            <BookOpen size={12} />
            <span>Full Knee MRI Reporting Guide →</span>
          </button>
        </section>
      </div>
    </aside>
  );
}
