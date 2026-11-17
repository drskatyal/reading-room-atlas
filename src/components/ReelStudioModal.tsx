import { Download, Film, Play, Square, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { REEL_SCRIPTS } from '../data/modulesCatalog';
import type { ModuleId } from '../types/radiology';

interface ReelStudioModalProps {
  open: boolean;
  onClose: () => void;
  moduleId: ModuleId;
  get3DCanvas: () => HTMLCanvasElement | null;
  get2DCanvas: () => HTMLCanvasElement | null;
}

export function ReelStudioModal({
  open,
  onClose,
  moduleId,
  get3DCanvas,
  get2DCanvas,
}: ReelStudioModalProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const script = REEL_SCRIPTS[moduleId];

  useEffect(() => {
    setRecordedUrl(null);
    setProgress(0);
    setRecording(false);
  }, [moduleId, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawContain = (
      src: HTMLCanvasElement,
      dx: number,
      dy: number,
      dw: number,
      dh: number
    ) => {
      const srcAspect = src.width / Math.max(1, src.height);
      const dstAspect = dw / Math.max(1, dh);
      let rw = dw;
      let rh = dh;
      if (srcAspect > dstAspect) {
        rh = dw / srcAspect;
      } else {
        rw = dh * srcAspect;
      }
      const rx = dx + (dw - rw) / 2;
      const ry = dy + (dh - rh) / 2;
      ctx.drawImage(src, rx, ry, rw, rh);
    };

    let rafId = 0;
    const startMs = performance.now();

    const drawFrame = () => {
      rafId = requestAnimationFrame(drawFrame);
      const elapsedSec = ((performance.now() - startMs) / 1000) % script.durationSec;
      const t = playing ? elapsedSec / script.durationSec : progress;
      if (playing) setProgress(t);

      const W = canvas.width;
      const H = canvas.height;

      // Obsidian vertical 9:16 background
      ctx.fillStyle = '#090b10';
      ctx.fillRect(0, 0, W, H);

      // Header branding
      ctx.fillStyle = '#d4a853';
      ctx.font = '600 16px "JetBrains Mono", monospace';
      ctx.fillText('READINGROOM ATLAS • RADIOLOGY REEL', 32, 46);

      ctx.fillStyle = '#eceae4';
      ctx.font = 'bold 23px Georgia, serif';
      ctx.fillText(script.title.slice(0, 40), 32, 82);

      ctx.fillStyle = '#9fd3f7';
      ctx.font = '500 15px Inter, sans-serif';
      ctx.fillText(script.hookCaption.slice(0, 56), 32, 112);

      // Composite live 3D Canvas (top half)
      const c3d = get3DCanvas();
      ctx.fillStyle = '#07090e';
      ctx.fillRect(32, 134, W - 64, 340);
      ctx.strokeStyle = 'rgba(212, 168, 83, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(32, 134, W - 64, 340);
      if (c3d && c3d.width > 0 && c3d.height > 0) {
        drawContain(c3d, 34, 136, W - 68, 336);
      }

      // Composite live 2D PACS Canvas (bottom half)
      const c2d = get2DCanvas();
      ctx.fillStyle = '#05070b';
      ctx.fillRect(32, 492, W - 64, 326);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.strokeRect(32, 492, W - 64, 326);
      if (c2d && c2d.width > 0 && c2d.height > 0) {
        drawContain(c2d, 34, 494, W - 68, 322);
      }

      // Active teaching step banner
      let activeStep = script.steps[0];
      for (const s of script.steps) {
        if (t >= s.t) activeStep = s;
      }

      ctx.fillStyle = 'rgba(212, 168, 83, 0.16)';
      ctx.fillRect(32, 836, W - 64, 58);
      ctx.strokeStyle = 'rgba(212, 168, 83, 0.6)';
      ctx.strokeRect(32, 836, W - 64, 58);

      ctx.fillStyle = '#f4d48c';
      ctx.font = '600 16px Inter, sans-serif';
      ctx.fillText(activeStep.caption.slice(0, 50), 46, 871);

      // Footer pearl + progress bar
      ctx.fillStyle = '#a1a7b3';
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillText(script.pearlCaption.slice(0, 60), 32, 924);

      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(32, 938, W - 64, 4);
      ctx.fillStyle = '#d4a853';
      ctx.fillRect(32, 938, (W - 64) * t, 4);
    };

    drawFrame();
    return () => cancelAnimationFrame(rafId);
  }, [open, playing, progress, script, get3DCanvas, get2DCanvas]);

  if (!open) return null;

  const startRecording = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      return;
    }
    setRecordedUrl(null);
    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setRecordedUrl(URL.createObjectURL(blob));
      setRecording(false);
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setPlaying(true);

    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, script.durationSec * 1000);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Instagram Reel Studio" onClick={onClose}>
      <div className="modal-card reel-card" onClick={(e) => e.stopPropagation()}>
        <div className="sidecar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Film size={16} style={{ color: 'var(--accent-brass)' }} />
            <span style={{ fontWeight: 600 }}>9:16 Instagram Reel &amp; Teaching Video Studio</span>
            <span className="module-tab-mod">Zero PHI Composite</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, padding: 16, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', background: '#05070b', padding: 10, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <canvas
              ref={previewCanvasRef}
              width={540}
              height={960}
              style={{ width: 270, height: 480, borderRadius: 8, border: '1px solid var(--border-brass)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="report-heading">Reel Teaching Script</div>
              <h3 style={{ margin: '4px 0', fontFamily: 'var(--font-serif)', fontSize: 22 }}>{script.title}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>{script.hookCaption}</p>
            </div>

            <div className="panel-section">
              <div className="section-label">Storyboard Cues ({script.durationSec}s Loop)</div>
              {script.steps.map((s) => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-brass-bright)' }}>{s.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.caption}</span>
                </div>
              ))}
            </div>

            <div className="panel-section">
              <div className="section-label">Export Controls</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Records your live synchronized 3D anatomy + 2D PACS viewport directly in 9:16 vertical format (WebM, convert to MP4 via FFmpeg for Instagram Reels / YouTube Shorts).
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <button type="button" className="icon-btn" onClick={() => setPlaying((p) => !p)}>
                  <Play size={14} />
                  {playing ? 'Pause Timeline' : 'Play Timeline'}
                </button>
                {!recording ? (
                  <button
                    id="btn-start-reel-record"
                    type="button"
                    className="copy-btn primary"
                    style={{ flex: 1 }}
                    onClick={startRecording}
                  >
                    <Film size={14} />
                    Record {script.durationSec}s Vertical Reel
                  </button>
                ) : (
                  <button type="button" className="copy-btn" style={{ borderColor: 'var(--accent-crimson)', color: 'var(--accent-crimson)' }} onClick={stopRecording}>
                    <Square size={14} />
                    Stop Recording ({Math.round(progress * 100)}%)
                  </button>
                )}
              </div>

              {recordedUrl && (
                <a
                  href={recordedUrl}
                  download={`readingroom-${moduleId}-reel.webm`}
                  className="copy-btn primary"
                  style={{ textDecoration: 'none', marginTop: 6 }}
                >
                  <Download size={14} />
                  Download Vertical Reel (.webm)
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
