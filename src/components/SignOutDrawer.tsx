import { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { FellowshipReport, KneeChapter } from '../types/atlas';

interface SignOutDrawerProps {
  open: boolean;
  onClose: () => void;
  chapter: KneeChapter;
  report: FellowshipReport;
}

export function SignOutDrawer({ open, onClose, chapter, report }: SignOutDrawerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report.dictationText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-backdrop"
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer-panel"
            className="signout-drawer"
            aria-label="Fellowship dictation and board pearls"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="drawer-header">
              <div>
                <h2 className="drawer-title">{chapter.title}</h2>
                <div style={{ fontSize: 12, color: 'var(--accent-telemetry)', marginTop: 2 }}>
                  {chapter.diagnosticSign}
                </div>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={onClose}
                aria-label="Close sign-out drawer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="drawer-scroll">
              <div>
                <h3 className="drawer-section-title">Structured MRI Dictation</h3>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {report.examHeader} — {report.clinicalIndication}
                </div>
                {report.findings.map((item) => (
                  <div
                    key={item.compartment}
                    className={`finding-row ${item.abnormal ? 'abnormal' : ''}`}
                  >
                    <div className="finding-comp">{item.compartment}</div>
                    <div className="finding-text">{item.text}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="drawer-section-title">Impression & Recommendation</h3>
                <div className="finding-row">
                  {report.impression.map((imp, idx) => (
                    <div key={imp} className="finding-text" style={{ color: 'var(--text-primary)' }}>
                      {idx + 1}. {imp}
                    </div>
                  ))}
                  <div className="finding-text" style={{ marginTop: 6 }}>
                    {report.recommendation}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="drawer-section-title">3T MRI Verification Checklist</h3>
                {chapter.mriChecklist.map((point) => (
                  <div key={point} className="finding-row">
                    <div className="finding-text">{point}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="drawer-section-title">Board & Fellowship Pitfalls</h3>
                {chapter.boardPearls.map((item) => (
                  <div key={item.exam} className="pearl-card">
                    <div className="finding-comp" style={{ color: 'var(--accent-telemetry)' }}>
                      {item.exam}
                    </div>
                    <div className="finding-text">{item.pearl}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                In-vivo 3.0T qDESS MRI, chondral thickness maps, and BScore (-0.20) from Stanford
                OpenMSK (Goyal et al., <em>Osteoarthritis and Cartilage Open</em>, 2026;
                doi:10.1016/j.ocarto.2026.100886). Soft-tissue ligament/tendon morphology warped from
                NIH / Cleveland Clinic Open Knee(s) (R01GM104139, CC-BY 4.0).
              </div>
            </div>

            <div className="drawer-footer">
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                PowerScribe 360 ready
              </span>
              <button type="button" className="icon-btn primary" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied dictation' : 'Copy dictation'}</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
