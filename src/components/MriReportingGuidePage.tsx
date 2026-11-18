import { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { MRI_REPORTING_SECTIONS } from '../data/anatomyAndReportingData';
import type { KneeModuleId, ReportingGuideSection, StructureId } from '../types/atlas';

interface MriReportingGuidePageProps {
  onJumpToModule: (mode: 'anatomy' | 'pathology', moduleId?: KneeModuleId, structureId?: StructureId) => void;
}

function ReportingSchematicDiagram({ kind }: { kind: NonNullable<ReportingGuideSection['diagramKind']> }) {
  if (kind === 'sequence-matrix') {
    return (
      <div className="guide-diagram-card">
        <div className="diagram-title">Best Orthogonal Plane by Structure (3T Knee MRI)</div>
        <div className="matrix-grid">
          <div className="matrix-cell matrix-head">Structure</div>
          <div className="matrix-cell matrix-head">Primary Plane</div>
          <div className="matrix-cell matrix-head">Confirm Plane</div>
          <div className="matrix-cell matrix-head">Key Normal Rule</div>

          <div className="matrix-cell strong">Menisci &amp; Roots</div>
          <div className="matrix-cell accent-cyan">Sagittal (Bow-Tie)</div>
          <div className="matrix-cell">Coronal (Body &amp; Root)</div>
          <div className="matrix-cell">&lt;= 3 mm extrusion; dark triangle</div>

          <div className="matrix-cell strong">ACL &amp; PCL</div>
          <div className="matrix-cell accent-cyan">Sagittal Midline</div>
          <div className="matrix-cell">Coronal + Axial Notch</div>
          <div className="matrix-cell">ACL || Blumensaat; PCL smooth black arc</div>

          <div className="matrix-cell strong">MCL / LCL / PLC</div>
          <div className="matrix-cell accent-cyan">Coronal</div>
          <div className="matrix-cell">Axial</div>
          <div className="matrix-cell">Taut dark bands; intact fibular styloid</div>

          <div className="matrix-cell strong">Patella / MPFL / Trochlea</div>
          <div className="matrix-cell accent-cyan">Axial</div>
          <div className="matrix-cell">Sagittal (Alta)</div>
          <div className="matrix-cell">Centered tracking; Insall-Salvati 0.8–1.2</div>
        </div>
      </div>
    );
  }

  if (kind === 'meniscal-tears') {
    return (
      <div className="guide-diagram-card">
        <div className="diagram-title">Schematic: Three Core Meniscal Tear Planes</div>
        <svg viewBox="0 0 720 155" className="guide-svg" aria-label="Meniscal tear planes diagram">
          {/* Longitudinal */}
          <g transform="translate(20, 14)">
            <rect width="210" height="128" rx="10" fill="rgba(15,23,42,0.75)" stroke="rgba(148,163,184,0.28)" />
            <path d="M 38 96 A 56 44 0 1 1 170 46" fill="none" stroke="#38bdf8" strokeWidth="14" strokeOpacity="0.35" strokeLinecap="round" />
            <path d="M 48 92 A 48 37 0 1 1 160 48" fill="none" stroke="#f43f5e" strokeWidth="3.5" strokeDasharray="6 3" />
            <text x="105" y="106" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">Longitudinal (Vertical)</text>
            <text x="105" y="121" textAnchor="middle" fill="#94a3b8" fontSize="10.5">Parallel to rim -&gt; Bucket-Handle</text>
          </g>
          {/* Radial */}
          <g transform="translate(255, 14)">
            <rect width="210" height="128" rx="10" fill="rgba(15,23,42,0.75)" stroke="rgba(148,163,184,0.28)" />
            <path d="M 38 96 A 56 44 0 1 1 170 46" fill="none" stroke="#38bdf8" strokeWidth="14" strokeOpacity="0.35" strokeLinecap="round" />
            <line x1="88" y1="22" x2="96" y2="56" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
            <text x="105" y="106" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">Radial (Transverse)</text>
            <text x="105" y="121" textAnchor="middle" fill="#94a3b8" fontSize="10.5">Perpendicular -&gt; Destroys Hoop</text>
          </g>
          {/* Horizontal */}
          <g transform="translate(490, 14)">
            <rect width="210" height="128" rx="10" fill="rgba(15,23,42,0.75)" stroke="rgba(148,163,184,0.28)" />
            <polygon points="56,34 128,60 56,84" fill="rgba(56,189,248,0.32)" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="56" y1="60" x2="128" y2="60" stroke="#f43f5e" strokeWidth="3.5" />
            <circle cx="38" cy="59" r="13" fill="rgba(34,211,238,0.45)" stroke="#22d3ee" strokeWidth="2" />
            <text x="105" y="106" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">Horizontal + Cyst</text>
            <text x="105" y="121" textAnchor="middle" fill="#94a3b8" fontSize="10.5">Parallel to plateau -&gt; Rim Cyst</text>
          </g>
        </svg>
      </div>
    );
  }

  if (kind === 'bruise-footprints') {
    return (
      <div className="guide-diagram-card">
        <div className="diagram-title">Bone Marrow Bruise Footprints Diagnose Mechanism Instantly</div>
        <svg viewBox="0 0 720 142" className="guide-svg" aria-label="Knee bone bruise footprints">
          <g transform="translate(20, 12)">
            <rect width="212" height="118" rx="10" fill="rgba(15,23,42,0.75)" stroke="rgba(148,163,184,0.28)" />
            <circle cx="52" cy="48" r="14" fill="rgba(251,191,36,0.35)" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="156" cy="64" r="14" fill="rgba(251,191,36,0.35)" stroke="#fbbf24" strokeWidth="2" />
            <line x1="66" y1="51" x2="142" y2="61" stroke="#38bdf8" strokeDasharray="4 3" strokeWidth="2" />
            <text x="106" y="92" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">ACL Pivot-Shift</text>
            <text x="106" y="108" textAnchor="middle" fill="#94a3b8" fontSize="10.5">Lat. Condyle Sulcus + Post-Lat Tibia</text>
          </g>
          <g transform="translate(254, 12)">
            <rect width="212" height="118" rx="10" fill="rgba(15,23,42,0.75)" stroke="rgba(148,163,184,0.28)" />
            <circle cx="64" cy="42" r="14" fill="rgba(244,63,94,0.35)" stroke="#fb7185" strokeWidth="2" />
            <circle cx="152" cy="54" r="14" fill="rgba(244,63,94,0.35)" stroke="#fb7185" strokeWidth="2" />
            <line x1="78" y1="45" x2="138" y2="52" stroke="#fb7185" strokeDasharray="4 3" strokeWidth="2" />
            <text x="106" y="92" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">Patellar Dislocation</text>
            <text x="106" y="108" textAnchor="middle" fill="#94a3b8" fontSize="10.5">Inf-Med Patella + Ant-Lat Condyle</text>
          </g>
          <g transform="translate(488, 12)">
            <rect width="212" height="118" rx="10" fill="rgba(15,23,42,0.75)" stroke="rgba(148,163,184,0.28)" />
            <circle cx="106" cy="52" r="16" fill="rgba(56,189,248,0.3)" stroke="#38bdf8" strokeWidth="2" />
            <text x="106" y="92" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">PCL Dashboard Injury</text>
            <text x="106" y="108" textAnchor="middle" fill="#94a3b8" fontSize="10.5">Anterior Proximal Tibia Cushion Blow</text>
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className="guide-diagram-card">
      <div className="diagram-title">Modified Outerbridge Hyaline Cartilage Grading</div>
      <div className="grades-strip">
        <div className="grade-pill">
          <strong>Grade I</strong>
          <span>Signal softening / blister; intact smooth surface</span>
        </div>
        <div className="grade-pill">
          <strong>Grade II</strong>
          <span>Partial defect &lt; 50% thickness</span>
        </div>
        <div className="grade-pill">
          <strong>Grade III</strong>
          <span>Deep fissuring &gt; 50%; subchondral bone still covered</span>
        </div>
        <div className="grade-pill alert">
          <strong>Grade IV</strong>
          <span>Full-thickness loss exposing subchondral bone + edema</span>
        </div>
      </div>
    </div>
  );
}

export function MriReportingGuidePage({ onJumpToModule }: MriReportingGuidePageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Clipboard fallback in restricted panes
    }
  };

  return (
    <div className="report-guide-shell">
      {/* Left Sticky TOC */}
      <aside className="report-toc" aria-label="Reporting guide sections">
        <div className="toc-header">Structured Knee MRI Approach</div>
        <nav className="toc-nav">
          {MRI_REPORTING_SECTIONS.map((sec) => (
            <a key={sec.id} href={`#guide-${sec.id}`} className="toc-link">
              <span className="toc-num">{sec.stepNumber}</span>
              <span>{sec.title}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Scrollable Teaching Article */}
      <div className="report-guide-main">
        <div className="guide-hero">
          <span className="deck-tag">How to Read &amp; Report 3T Knee MRI</span>
          <h2 className="guide-hero-title">Systematic Reporting Approach by Compartment</h2>
          <p className="guide-hero-sub">
            Review normal MRI signal criteria, high-yield pathologic signs, grading rules, and ready-to-paste dictation lines — or jump directly into interactive 3D + MRI view for any lesion.
          </p>
        </div>

        {MRI_REPORTING_SECTIONS.map((section) => (
          <section key={section.id} id={`guide-${section.id}`} className="guide-section">
            <div className="guide-section-head">
              <span className="guide-step-num">{section.stepNumber}</span>
              <div>
                <h3 className="guide-section-title">{section.title}</h3>
                <p className="guide-section-sub">{section.subtitle}</p>
              </div>
            </div>

            <div className="guide-takeaway-banner">
              <strong>Key Rule:</strong> {section.takeaway}
            </div>

            {section.diagramKind && <ReportingSchematicDiagram kind={section.diagramKind} />}

            <div className="guide-cards-grid">
              {section.cards.map((card) => (
                <article key={card.id} className="guide-card">
                  <div className="guide-card-top">
                    <div>
                      <h4 className="guide-card-title">{card.title}</h4>
                      <span className="guide-card-planes">{card.bestPlanes}</span>
                    </div>

                    {card.linkedMode && (
                      <button
                        type="button"
                        className="mini-chip active"
                        onClick={() =>
                          onJumpToModule(
                            card.linkedMode!,
                            card.linkedModuleId,
                            card.linkedStructureId
                          )
                        }
                      >
                        <span>View in 3D + MRI</span>
                        <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>

                  <div className="guide-compare-row">
                    <div className="guide-col normal">
                      <div className="col-label">Normal MRI Appearance</div>
                      <p>{card.normalLook}</p>
                    </div>
                    <div className="guide-col pathology">
                      <div className="col-label">Pathology Signs</div>
                      <ul>
                        {card.pathologySigns.map((sign) => (
                          <li key={sign}>{sign}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="guide-grading-note">{card.gradingOrRule}</div>

                  <div className="guide-dictation-pair">
                    <div className="dictation-snippet">
                      <div className="snippet-head">
                        <span>Normal Dictation</span>
                        <button
                          type="button"
                          className="copy-mini-btn"
                          onClick={() => handleCopy(`${card.id}-norm`, card.dictationNormal)}
                        >
                          {copiedId === `${card.id}-norm` ? (
                            <>
                              <Check size={11} /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={11} /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="snippet-pre">{card.dictationNormal}</pre>
                    </div>

                    <div className="dictation-snippet abnormal">
                      <div className="snippet-head">
                        <span>Abnormal Dictation</span>
                        <button
                          type="button"
                          className="copy-mini-btn"
                          onClick={() => handleCopy(`${card.id}-abn`, card.dictationAbnormal)}
                        >
                          {copiedId === `${card.id}-abn` ? (
                            <>
                              <Check size={11} /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={11} /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="snippet-pre">{card.dictationAbnormal}</pre>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
