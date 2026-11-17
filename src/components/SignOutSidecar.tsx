import { Check, ChevronLeft, ChevronRight, ClipboardCopy, GraduationCap, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import type { ExamPearl, StructuredReport } from '../types/radiology';

interface SignOutSidecarProps {
  report: StructuredReport;
  pearls: ExamPearl[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function SignOutSidecar({
  report,
  pearls,
  collapsed,
  onToggleCollapse,
}: SignOutSidecarProps) {
  const [tab, setTab] = useState<'signout' | 'pearls'>('signout');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // Fallback for restricted clipboard contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    }
  };

  const fullReportText = [
    `EXAM: ${report.title}`,
    `TECHNIQUE: ${report.technique}`,
    '',
    'FINDINGS:',
    ...report.findings.map((f) => `- ${f}`),
    '',
    'IMPRESSION:',
    ...report.impression.map((i, idx) => `${idx + 1}. ${i}`),
    '',
    `RECOMMENDATION: ${report.recommendation}`,
  ].join('\n');

  const findingsOnlyText = report.findings.map((f) => `- ${f}`).join('\n');
  const impressionOnlyText =
    report.impression.map((i, idx) => `${idx + 1}. ${i}`).join('\n') +
    `\nRecommendation: ${report.recommendation}`;

  if (collapsed) {
    return (
      <aside className="sidecar" aria-label="Sign-Out Sidecar Collapsed">
        <div className="sidecar-collapsed-strip">
          <button
            id="btn-expand-sidecar"
            type="button"
            className="icon-btn"
            onClick={onToggleCollapse}
            title="Expand Sign-Out Sidecar"
          >
            <ChevronLeft size={15} />
          </button>
          <span
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              letterSpacing: '0.1em',
              color: 'var(--accent-brass)',
              textTransform: 'uppercase',
            }}
          >
            Sign-Out Desk
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidecar" aria-label="Sign-Out Sidecar">
      <div className="sidecar-header">
        <div className="sidecar-tabs">
          <button
            id="tab-signout"
            type="button"
            className={`sidecar-tab ${tab === 'signout' ? 'active' : ''}`}
            onClick={() => setTab('signout')}
          >
            <Stethoscope size={12} style={{ marginRight: 5, verticalAlign: '-1px' }} />
            Sign-Out
          </button>
          <button
            id="tab-pearls"
            type="button"
            className={`sidecar-tab ${tab === 'pearls' ? 'active' : ''}`}
            onClick={() => setTab('pearls')}
          >
            <GraduationCap size={12} style={{ marginRight: 5, verticalAlign: '-1px' }} />
            Boards ({pearls.length})
          </button>
        </div>

        <button
          id="btn-collapse-sidecar"
          type="button"
          className="icon-btn"
          style={{ height: 26, padding: '0 6px' }}
          onClick={onToggleCollapse}
          title="Collapse Sidecar"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {tab === 'signout' ? (
        <>
          <div className="sidecar-body">
            <div className={`category-banner ${report.categoryTone}`}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {report.modality}
                </div>
                <div className="banner-code">{report.categoryBadge}</div>
              </div>
            </div>

            <div className="metrics-grid">
              {report.metricsSummary.map((m) => (
                <div key={m.label} className="metric-box">
                  <div className="metric-label">{m.label}</div>
                  <div className="metric-value">{m.value}</div>
                </div>
              ))}
            </div>

            <div className="report-block">
              <div className="report-heading">Technique</div>
              <p className="report-text" style={{ color: 'var(--text-secondary)' }}>
                {report.technique}
              </p>
            </div>

            <div className="report-block">
              <div className="report-heading">Structured Findings</div>
              <ul className="report-list">
                {report.findings.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>

            <div className="report-block">
              <div className="report-heading">Impression &amp; Recommendation</div>
              <ul className="report-list">
                {report.impression.map((line, i) => (
                  <li key={i} style={{ fontWeight: 600 }}>
                    {line}
                  </li>
                ))}
              </ul>
              <p className="report-text" style={{ color: 'var(--accent-brass-bright)', marginTop: 4 }}>
                {report.recommendation}
              </p>
            </div>
          </div>

          <div className="sidecar-footer">
            <button
              id="btn-copy-findings"
              type="button"
              className="copy-btn"
              onClick={() => copyText('findings', findingsOnlyText)}
            >
              {copiedKey === 'findings' ? <Check size={13} /> : <ClipboardCopy size={13} />}
              {copiedKey === 'findings' ? 'Copied!' : 'Copy Findings'}
            </button>
            <button
              id="btn-copy-impression"
              type="button"
              className="copy-btn"
              onClick={() => copyText('impression', impressionOnlyText)}
            >
              {copiedKey === 'impression' ? <Check size={13} /> : <ClipboardCopy size={13} />}
              {copiedKey === 'impression' ? 'Copied!' : 'Copy Impression'}
            </button>
            <button
              id="btn-copy-full-report"
              type="button"
              className="copy-btn primary"
              onClick={() => copyText('full', fullReportText)}
            >
              {copiedKey === 'full' ? <Check size={14} /> : <ClipboardCopy size={14} />}
              {copiedKey === 'full' ? 'Copied to PowerScribe Clipboard' : '1-Click Copy PowerScribe Report'}
            </button>
          </div>
        </>
      ) : (
        <div className="sidecar-body">
          {pearls.map((pearl) => (
            <div key={pearl.id} className="pearl-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <span className="pearl-track">{pearl.track}</span>
                {pearl.keySign && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-cyan)' }}>
                    {pearl.keySign}
                  </span>
                )}
              </div>
              <div className="pearl-title">{pearl.title}</div>
              <div className="pearl-summary">{pearl.summary}</div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
