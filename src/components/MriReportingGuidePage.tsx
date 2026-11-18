import { ArrowUpRight } from 'lucide-react';
import {
  FIVE_PASS_SCROLL_ORDER,
  RA_GUIDE_CHAPTERS,
  SIX_BLIND_SPOTS,
  type GuideFigurePlate,
  type GuideTone,
} from '../data/radiologyAssistantGuideData';
import type { KneeModuleId, StructureId } from '../types/atlas';

interface MriReportingGuidePageProps {
  onJumpToModule: (
    mode: 'anatomy' | 'pathology',
    moduleId?: KneeModuleId,
    structureId?: StructureId
  ) => void;
}

const TONE_PALETTE: Record<GuideTone, { stroke: string; fill: string; border: string }> = {
  cyan: {
    stroke: '#38bdf8',
    fill: 'rgba(56, 189, 248, 0.28)',
    border: 'rgba(56, 189, 248, 0.72)',
  },
  amber: {
    stroke: '#fbbf24',
    fill: 'rgba(251, 191, 36, 0.25)',
    border: 'rgba(251, 191, 36, 0.72)',
  },
  crimson: {
    stroke: '#fb7185',
    fill: 'rgba(244, 63, 94, 0.34)',
    border: 'rgba(251, 113, 133, 0.78)',
  },
  emerald: {
    stroke: '#34d399',
    fill: 'rgba(52, 211, 153, 0.28)',
    border: 'rgba(52, 211, 153, 0.72)',
  },
};

function parseViewBox(vb?: string): [number, number, number, number] {
  if (!vb) return [0, 0, 100, 100];
  const parts = vb.split(/\s+/).map(Number);
  if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
    return [parts[0], parts[1], parts[2], parts[3]];
  }
  return [0, 0, 100, 100];
}

function MriReferenceFigure({
  plate,
  onJumpToModule,
}: {
  plate: GuideFigurePlate;
  onJumpToModule: MriReportingGuidePageProps['onJumpToModule'];
}) {
  const [vx, vy, vw, vh] = parseViewBox(plate.viewBox);
  const scaleFactor = 100 / vw;
  const strokeUnit = 0.65 / scaleFactor;

  const labelChips: Array<{
    key: string;
    leftPct: number;
    topPct: number;
    text: string;
    tone: GuideTone;
  }> = [];

  for (let i = 0; i < plate.annotations.length; i++) {
    const ann = plate.annotations[i];
    if (!ann.label) continue;
    const rawX =
      ann.lx ??
      (ann.kind === 'zone'
        ? ann.cx
        : ann.kind === 'caliper'
          ? (ann.x1 + ann.x2) * 0.5
          : (ann.x1 + ann.x2) * 0.5);
    const rawY =
      ann.ly ??
      (ann.kind === 'zone'
        ? ann.cy - ann.ry - 3
        : (ann.y1 + ann.y2) * 0.5 - 3);
    const leftPct = Math.max(18, Math.min(82, ((rawX - vx) / vw) * 100));
    const topPct = Math.max(8, Math.min(92, ((rawY - vy) / vh) * 100));
    labelChips.push({
      key: `${plate.id}-lbl-${i}`,
      leftPct,
      topPct,
      text: ann.label,
      tone: ann.tone,
    });
  }

  return (
    <figure className="ra-plate-card">
      <div className="ra-plate-frame">
        <svg
          className="ra-plate-svg"
          viewBox={`${vx} ${vy} ${vw} ${vh}`}
          role="img"
          aria-label={plate.alt}
        >
          <defs>
            {(Object.keys(TONE_PALETTE) as GuideTone[]).map((t) => (
              <marker
                key={`${plate.id}-arrow-${t}`}
                id={`${plate.id}-arrow-${t}`}
                viewBox="0 0 10 10"
                refX="8.2"
                refY="5"
                markerWidth="5.2"
                markerHeight="5.2"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.4 L 9.5 5 L 0 8.6 z" fill={TONE_PALETTE[t].stroke} />
              </marker>
            ))}
          </defs>

          <image href={plate.imageSrc} x="0" y="0" width="100" height="100" preserveAspectRatio="none" />

          {plate.annotations.map((ann, idx) => {
            const pal = TONE_PALETTE[ann.tone];
            const k = `${plate.id}-ann-${idx}`;

            if (ann.kind === 'arrow') {
              return (
                <g key={k}>
                  <line
                    x1={ann.x1}
                    y1={ann.y1}
                    x2={ann.x2}
                    y2={ann.y2}
                    stroke="rgba(3, 6, 14, 0.78)"
                    strokeWidth={strokeUnit * 1.9}
                    strokeLinecap="round"
                  />
                  <line
                    x1={ann.x1}
                    y1={ann.y1}
                    x2={ann.x2}
                    y2={ann.y2}
                    stroke={pal.stroke}
                    strokeWidth={strokeUnit}
                    strokeLinecap="round"
                    markerEnd={`url(#${plate.id}-arrow-${ann.tone})`}
                  />
                </g>
              );
            }

            if (ann.kind === 'line') {
              return (
                <line
                  key={k}
                  x1={ann.x1}
                  y1={ann.y1}
                  x2={ann.x2}
                  y2={ann.y2}
                  stroke={pal.stroke}
                  strokeWidth={strokeUnit * 0.95}
                  strokeDasharray={ann.dashed ? `${strokeUnit * 2.4} ${strokeUnit * 1.6}` : undefined}
                  strokeLinecap="round"
                />
              );
            }

            if (ann.kind === 'zone') {
              const tf = ann.rotate
                ? `rotate(${ann.rotate} ${ann.cx} ${ann.cy})`
                : undefined;
              return (
                <ellipse
                  key={k}
                  cx={ann.cx}
                  cy={ann.cy}
                  rx={ann.rx}
                  ry={ann.ry}
                  transform={tf}
                  fill={pal.fill}
                  stroke={pal.stroke}
                  strokeWidth={strokeUnit * 0.8}
                  strokeDasharray={`${strokeUnit * 2} ${strokeUnit * 1.4}`}
                />
              );
            }

            if (ann.kind === 'caliper') {
              const dx = ann.x2 - ann.x1;
              const dy = ann.y2 - ann.y1;
              const len = Math.max(0.1, Math.hypot(dx, dy));
              const nx = (-dy / len) * (2.2 / scaleFactor);
              const ny = (dx / len) * (2.2 / scaleFactor);
              return (
                <g key={k}>
                  <line
                    x1={ann.x1}
                    y1={ann.y1}
                    x2={ann.x2}
                    y2={ann.y2}
                    stroke={pal.stroke}
                    strokeWidth={strokeUnit * 0.95}
                  />
                  <line
                    x1={ann.x1 - nx}
                    y1={ann.y1 - ny}
                    x2={ann.x1 + nx}
                    y2={ann.y1 + ny}
                    stroke={pal.stroke}
                    strokeWidth={strokeUnit * 0.95}
                  />
                  <line
                    x1={ann.x2 - nx}
                    y1={ann.y2 - ny}
                    x2={ann.x2 + nx}
                    y2={ann.y2 + ny}
                    stroke={pal.stroke}
                    strokeWidth={strokeUnit * 0.95}
                  />
                </g>
              );
            }

            return null;
          })}
        </svg>

        {labelChips.map((chip) => (
          <span
            key={chip.key}
            className="ra-plate-chip"
            style={{
              left: `${chip.leftPct}%`,
              top: `${chip.topPct}%`,
              borderColor: TONE_PALETTE[chip.tone].border,
            }}
          >
            <span
              className="anno-dot"
              style={{ background: TONE_PALETTE[chip.tone].stroke }}
            />
            <span>{chip.text}</span>
          </span>
        ))}
      </div>

      <figcaption className="ra-caption">
        <strong className="ra-fig-num">{plate.figureLabel}.</strong> {plate.caption}
        {plate.link && (
          <button
            type="button"
            className="ra-inline-jump"
            onClick={() =>
              onJumpToModule(
                plate.link!.mode,
                plate.link!.moduleId,
                plate.link!.structureId
              )
            }
          >
            <span>{plate.link.label}</span>
            <ArrowUpRight size={12} />
          </button>
        )}
      </figcaption>
    </figure>
  );
}

export function MriReportingGuidePage({ onJumpToModule }: MriReportingGuidePageProps) {
  return (
    <div className="ra-article-shell">
      <aside className="ra-toc" aria-label="Article sections">
        <div className="ra-toc-label">Contents</div>
        <nav className="ra-toc-nav">
          {RA_GUIDE_CHAPTERS.map((ch) => (
            <a key={ch.id} href={`#guide-${ch.id}`} className="ra-toc-link">
              <span className="ra-toc-num">{ch.number}.</span>
              <span>{ch.title}</span>
            </a>
          ))}
          <a href="#guide-blind-spots" className="ra-toc-link">
            <span className="ra-toc-num">7.</span>
            <span>Six Blind Spots Before Signing Out</span>
          </a>
        </nav>

        <button
          type="button"
          className="ra-toc-return"
          onClick={() => onJumpToModule('anatomy', undefined, 'Femur')}
        >
          <span>Open 3D + MRI Viewer</span>
          <ArrowUpRight size={12} />
        </button>
      </aside>

      <article className="ra-article-main">
        <header className="ra-masthead">
          <div className="ra-eyebrow">Musculoskeletal MRI Reference · 3.0T OpenMSK qDESS</div>
          <h2 className="ra-main-title">MRI of the Knee — Systematic Approach</h2>
          <p className="ra-main-lead">
            A structured reading-room routine modeled for orthopedic and radiology residents: review
            every structure in order across orthogonal planes so subtle tears and secondary
            footprints are never missed.
          </p>

          <div className="ra-pass-strip" aria-label="Five-pass reading routine">
            {FIVE_PASS_SCROLL_ORDER.map((item) => (
              <div key={item.step} className="ra-pass-item">
                <div className="ra-pass-head">
                  <span className="ra-pass-num">{item.step}</span>
                  <strong>{item.title}</strong>
                </div>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </header>

        {RA_GUIDE_CHAPTERS.map((chapter) => (
          <section key={chapter.id} id={`guide-${chapter.id}`} className="ra-chapter">
            <h2 className="ra-chapter-title">
              <span className="ra-ch-num">{chapter.number}.</span> {chapter.title}
            </h2>
            <p className="ra-chapter-lead">{chapter.lead}</p>

            <div className="ra-chapter-grid">
              <div className="ra-prose-col">
                {chapter.subsections.map((sub, sIdx) => (
                  <div key={`${chapter.id}-sub-${sIdx}`} className="ra-subblock">
                    {sub.heading && <h3 className="ra-subhead">{sub.heading}</h3>}

                    {sub.paragraphs?.map((p) => (
                      <p key={p} className="ra-body-p">
                        {p}
                      </p>
                    ))}

                    {sub.bullets && (
                      <ul className="ra-body-list">
                        {sub.bullets.map((b) => (
                          <li key={b.lead}>
                            <strong>{b.lead}</strong> {b.text}
                          </li>
                        ))}
                      </ul>
                    )}

                    {sub.table && (
                      <table className="ra-inline-table">
                        <thead>
                          <tr>
                            <th>{sub.table.columns[0]}</th>
                            <th>{sub.table.columns[1]}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sub.table.rows.map((row) => (
                            <tr key={row[0]}>
                              <th scope="row">{row[0]}</th>
                              <td>{row[1]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {sub.pitfall && (
                      <aside className="ra-pitfall-note">
                        <strong>Pitfall:</strong> {sub.pitfall}
                      </aside>
                    )}
                  </div>
                ))}
              </div>

              <div className="ra-figure-col">
                {chapter.plates.map((plate) => (
                  <MriReferenceFigure
                    key={plate.id}
                    plate={plate}
                    onJumpToModule={onJumpToModule}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}

        <section id="guide-blind-spots" className="ra-chapter">
          <h2 className="ra-chapter-title">
            <span className="ra-ch-num">7.</span> Six Blind Spots Before Signing Out
          </h2>
          <p className="ra-chapter-lead">
            Run this brief check after dictating your primary impression—these six regions hold the
            highest rate of clinically consequential misses on routine knee MRI.
          </p>

          <ol className="ra-blindspot-list">
            {SIX_BLIND_SPOTS.map((spot) => (
              <li key={spot.title}>
                <strong>{spot.title}:</strong> {spot.check}
              </li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}
