import { BookOpen, CheckCircle2 } from 'lucide-react';
import { KNEE_MODULES } from '../data/kneeClinicalAtlas';
import type { KneeModuleId } from '../types/atlas';

interface PathologySidebarProps {
  activeModuleId: KneeModuleId;
  subStepIndex: number;
  visitedModules: Set<KneeModuleId>;
  onSelectModule: (id: KneeModuleId) => void;
  onSelectSubStep: (index: number) => void;
  flexionDeg: number;
  onChangeFlexionDeg: (deg: number) => void;
  patellaSubluxation: number;
  onChangePatellaSubluxation: (val: number) => void;
  onOpenReportGuide: () => void;
}

const PATHOLOGY_MODULES = KNEE_MODULES.filter((m) => m.category === 'pathology');

export function PathologySidebar({
  activeModuleId,
  subStepIndex,
  visitedModules,
  onSelectModule,
  onSelectSubStep,
  flexionDeg,
  onChangeFlexionDeg,
  patellaSubluxation,
  onChangePatellaSubluxation,
  onOpenReportGuide,
}: PathologySidebarProps) {
  return (
    <aside className="mode-sidebar pathology-sidebar" aria-label="Knee MRI pathologies">
      <div className="sidebar-head-title">
        <span>3D + MRI Pathologies (8)</span>
      </div>

      <div className="sidebar-scroll-tree pathology-list">
        {PATHOLOGY_MODULES.map((mod) => {
          const active = mod.id === activeModuleId;
          const visited = visitedModules.has(mod.id);
          const isPatella = mod.biomechControl === 'patella-reduction';

          return (
            <div key={mod.id} className={`patho-card ${active ? 'active' : ''}`}>
              <button
                type="button"
                className="patho-card-btn"
                onClick={() => onSelectModule(mod.id)}
              >
                <div className="patho-card-top">
                  <span className="patho-card-title">{mod.shortTitle}</span>
                  {visited && <CheckCircle2 size={12} className="strip-done-icon" />}
                </div>
                <span className="patho-card-sign">{mod.diagnosticSign}</span>
              </button>

              {active && (
                <div className="patho-card-expand">
                  <div className="patho-step-pills" role="tablist" aria-label="Pathology focus steps">
                    {mod.subSteps.map((step, idx) => (
                      <button
                        key={step.id}
                        type="button"
                        role="tab"
                        aria-selected={idx === subStepIndex}
                        className={`substep-pill ${idx === subStepIndex ? 'active' : ''}`}
                        onClick={() => onSelectSubStep(idx)}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>

                  <label className="rail-slider-wrap compact-slider">
                    <div className="rail-slider-head">
                      <span>{isPatella ? 'Patellar Subluxation' : 'Knee Flexion Motion'}</span>
                      <span className="slider-val">
                        {isPatella ? `${Math.round(patellaSubluxation * 100)}%` : `${flexionDeg}°`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={isPatella ? 0 : 0}
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
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer-action">
        <button type="button" className="chip-btn rail-full-btn" onClick={onOpenReportGuide}>
          <BookOpen size={13} />
          <span>How to Report &amp; Grading →</span>
        </button>
      </div>
    </aside>
  );
}
