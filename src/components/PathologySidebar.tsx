import { useEffect, useMemo, useRef } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import type { JointAtlasDefinition, KneeModuleId } from '../types/atlas';

interface PathologySidebarProps {
  jointDef: JointAtlasDefinition;
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

function stripLeadingNumber(label: string): string {
  return label.replace(/^\d+\.\s*/, '');
}

export function PathologySidebar({
  jointDef,
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

  const pathologyModules = useMemo(
    () => jointDef.modules.filter((m) => m.category === 'pathology'),
    [jointDef.modules]
  );
  const motionModules = useMemo(
    () => new Set(jointDef.kinematicConfig.motionModules ?? []),
    [jointDef.kinematicConfig.motionModules]
  );

  const activeIdx = Math.max(
    0,
    pathologyModules.findIndex((m) => m.id === activeModuleId)
  );
  const activeMod = pathologyModules[activeIdx] ?? pathologyModules[0];
  const activeStep = activeMod.subSteps[subStepIndex] ?? activeMod.subSteps[0];
  const detail = jointDef.pathologyReportingDetails[activeMod.id];
  const isPatella = activeMod.biomechControl === 'patella-reduction';
  const showMotionSlider = motionModules.has(activeMod.id);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeMod.id, jointDef.id]);

  return (
    <aside className="mode-sidebar pathology-sidebar" aria-label="Pathology diagnostic and reporting reference">
      {/* Compact Top Picker + 3-Step Visual Finding Tabs + Optional Motion Slider */}
      <div className="sidebar-sticky-head patho-sticky-head">
        <div className="patho-select-row">
          <select
            className="patho-select"
            value={activeMod.id}
            onChange={(e) => onSelectModule(e.target.value)}
            aria-label={`Select ${jointDef.shortName.toLowerCase()} pathology`}
          >
            {pathologyModules.map((mod, idx) => (
              <option key={mod.id} value={mod.id}>
                {idx + 1}. {mod.shortTitle}
              </option>
            ))}
          </select>

          <div className="step-arrows">
            <button
              type="button"
              className="arrow-btn"
              onClick={() => onSelectModule(pathologyModules[activeIdx - 1].id)}
              disabled={activeIdx <= 0}
              aria-label="Previous pathology"
              title="Previous pathology"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="arrow-btn"
              onClick={() => onSelectModule(pathologyModules[activeIdx + 1].id)}
              disabled={activeIdx >= pathologyModules.length - 1}
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
            <span>{isPatella ? 'Patella Slip' : jointDef.kinematicConfig.sliderLabel}</span>
            <input
              type="range"
              min={isPatella ? 0 : jointDef.kinematicConfig.minDeg}
              max={isPatella ? 1 : jointDef.kinematicConfig.maxDeg}
              step={isPatella ? 0.05 : 2}
              value={isPatella ? patellaSubluxation : flexionDeg}
              onChange={(e) =>
                isPatella
                  ? onChangePatellaSubluxation(Number(e.target.value))
                  : onChangeFlexionDeg(Number(e.target.value))
              }
              aria-label={isPatella ? 'Patellar subluxation slider' : `${jointDef.shortName} motion slider`}
            />
            <span className="slider-val">
              {isPatella ? `${Math.round(patellaSubluxation * 100)}%` : `${flexionDeg}°`}
            </span>
          </label>
        )}
      </div>

      {/* Scrollable Fellowship Pathology Reference Article */}
      <div ref={scrollRef} className="patho-editorial-scroll">
        <div className="patho-plane-tag">{detail?.sequencesAndPlanes ?? jointDef.mriSpecLabel}</div>
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
            <span>Full {jointDef.shortName} MRI Reporting Guide →</span>
          </button>
        </section>
      </div>
    </aside>
  );
}
