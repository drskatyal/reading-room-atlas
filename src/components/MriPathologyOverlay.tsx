import type { MriAnnotation, MriAnnotationTone } from '../types/atlas';

interface MriPathologyOverlayProps {
  annotations: MriAnnotation[];
  visible: boolean;
  offSlice: boolean;
  width: number;
  height: number;
  pxPerMm: number;
  projectRas: (ras: [number, number, number]) => [number, number] | null;
}

const TONE_MAP: Record<
  MriAnnotationTone,
  { stroke: string; fill: string; border: string; glow: string }
> = {
  crimson: {
    stroke: '#fb7185',
    fill: 'rgba(244, 63, 94, 0.28)',
    border: 'rgba(251, 113, 133, 0.78)',
    glow: '#e11d48',
  },
  amber: {
    stroke: '#fbbf24',
    fill: 'rgba(245, 158, 11, 0.26)',
    border: 'rgba(251, 191, 36, 0.78)',
    glow: '#d97706',
  },
  cyan: {
    stroke: '#38bdf8',
    fill: 'rgba(56, 189, 248, 0.25)',
    border: 'rgba(56, 189, 248, 0.8)',
    glow: '#0284c7',
  },
  emerald: {
    stroke: '#34d399',
    fill: 'rgba(52, 211, 153, 0.24)',
    border: 'rgba(52, 211, 153, 0.76)',
    glow: '#059669',
  },
};

function clampCoord(val: number, min: number, max: number): number {
  if (max <= min) return min;
  return Math.max(min, Math.min(max, val));
}

export function MriPathologyOverlay({
  annotations,
  visible,
  offSlice,
  width,
  height,
  pxPerMm,
  projectRas,
}: MriPathologyOverlayProps) {
  if (!visible || offSlice || annotations.length === 0 || width < 40 || height < 40) {
    return null;
  }

  const labelChips: Array<{
    key: string;
    x: number;
    y: number;
    text: string;
    tone: MriAnnotationTone;
  }> = [];

  const pushLabel = (
    key: string,
    x: number,
    y: number,
    text: string | undefined,
    tone: MriAnnotationTone
  ) => {
    if (!text) return;
    let adjustedY = y;
    for (const prev of labelChips) {
      if (Math.abs(prev.x - x) < 135 && Math.abs(prev.y - adjustedY) < 25) {
        adjustedY = prev.y + 26;
      }
    }
    const halfW = Math.min(width * 0.46, Math.max(58, text.length * 3.9 + 22));
    labelChips.push({
      key,
      x: clampCoord(x, halfW + 8, width - halfW - 8),
      y: clampCoord(adjustedY, 20, height - 34),
      text,
      tone,
    });
  };

  return (
    <div className="mri-overlay-container" aria-hidden="true">
      <svg className="mri-annotations-svg" width={width} height={height}>
        <defs>
          {(Object.keys(TONE_MAP) as MriAnnotationTone[]).map((t) => (
            <marker
              key={`marker-${t}`}
              id={`mri-arrow-${t}`}
              viewBox="0 0 10 10"
              refX="8.2"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.4 L 9.5 5 L 0 8.6 z" fill={TONE_MAP[t].stroke} />
            </marker>
          ))}

          {(Object.keys(TONE_MAP) as MriAnnotationTone[]).map((t) => (
            <radialGradient key={`grad-${t}`} id={`mri-edema-${t}`}>
              <stop offset="0%" stopColor={TONE_MAP[t].stroke} stopOpacity="0.62" />
              <stop offset="55%" stopColor={TONE_MAP[t].glow} stopOpacity="0.32" />
              <stop offset="100%" stopColor={TONE_MAP[t].glow} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {annotations.map((ann, idx) => {
          const tone: MriAnnotationTone = ann.tone ?? 'crimson';
          const pal = TONE_MAP[tone];
          const key = `${ann.kind}-${idx}`;

          if (ann.kind === 'edema') {
            const c = projectRas(ann.centerRas);
            if (!c) return null;
            const rPx = clampCoord(ann.radiusMm * pxPerMm, 14, 72);
            pushLabel(key, c[0], c[1] + rPx + 12, ann.label, tone);
            return (
              <g key={key}>
                <circle cx={c[0]} cy={c[1]} r={rPx} fill={`url(#mri-edema-${tone})`} />
                <circle
                  cx={c[0]}
                  cy={c[1]}
                  r={rPx * 0.72}
                  fill="none"
                  stroke={pal.stroke}
                  strokeWidth="1.4"
                  strokeDasharray="4 3"
                  strokeOpacity="0.72"
                />
              </g>
            );
          }

          if (ann.kind === 'arrow') {
            const p1 = projectRas(ann.fromRas);
            const p2 = projectRas(ann.toRas);
            if (!p1 || !p2) return null;
            const dx = p2[0] - p1[0];
            const dy = p2[1] - p1[1];
            const len = Math.max(1, Math.hypot(dx, dy));
            const curve = ann.curved ?? 0;
            const nx = -dy / len;
            const ny = dx / len;
            const mx = (p1[0] + p2[0]) * 0.5 + nx * curve * len;
            const my = (p1[1] + p2[1]) * 0.5 + ny * curve * len;

            const d =
              Math.abs(curve) > 0.01
                ? `M ${p1[0]} ${p1[1]} Q ${mx} ${my} ${p2[0]} ${p2[1]}`
                : `M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]}`;

            pushLabel(key, mx + nx * 18, my + ny * 18 - 10, ann.label, tone);
            return (
              <g key={key}>
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(3, 6, 14, 0.78)"
                  strokeWidth="4.6"
                  strokeLinecap="round"
                />
                <path
                  d={d}
                  fill="none"
                  stroke={pal.stroke}
                  strokeWidth="2.4"
                  strokeDasharray={ann.dashed ? '6 4' : undefined}
                  strokeLinecap="round"
                  markerEnd={`url(#mri-arrow-${tone})`}
                />
              </g>
            );
          }

          if (ann.kind === 'cleft') {
            const pts = ann.pointsRas.map(projectRas).filter((p): p is [number, number] => p !== null);
            if (pts.length < 2) return null;
            const pointsAttr = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
            const mid = pts[Math.floor(pts.length / 2)];
            pushLabel(key, mid[0], mid[1] - 16, ann.label, tone);
            const w = ann.widthPx ?? 2.8;
            return (
              <g key={key}>
                <polyline
                  points={pointsAttr}
                  fill="none"
                  stroke="rgba(3, 6, 14, 0.72)"
                  strokeWidth={w + 2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points={pointsAttr}
                  fill="none"
                  stroke={pal.stroke}
                  strokeWidth={w}
                  strokeDasharray={ann.dashed ? '6 4' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          }

          if (ann.kind === 'region') {
            const pts = ann.pointsRas.map(projectRas).filter((p): p is [number, number] => p !== null);
            if (pts.length < 3) return null;
            const pointsAttr = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
            const cx = pts.reduce((acc, p) => acc + p[0], 0) / pts.length;
            const maxY = Math.max(...pts.map((p) => p[1]));
            pushLabel(key, cx, maxY + 18, ann.label, tone);
            return (
              <polygon
                key={key}
                points={pointsAttr}
                fill={pal.stroke}
                fillOpacity={ann.fillOpacity ?? 0.25}
                stroke={pal.stroke}
                strokeWidth="1.9"
                strokeDasharray={ann.dashed ? '5 3' : undefined}
                strokeLinejoin="round"
              />
            );
          }

          if (ann.kind === 'caliper') {
            const a = projectRas(ann.aRas);
            const b = projectRas(ann.bRas);
            if (!a || !b) return null;
            const dx = b[0] - a[0];
            const dy = b[1] - a[1];
            const len = Math.max(1, Math.hypot(dx, dy));
            const nx = (-dy / len) * 6;
            const ny = (dx / len) * 6;
            const mx = (a[0] + b[0]) * 0.5;
            const my = (a[1] + b[1]) * 0.5;
            pushLabel(key, mx, my + 20, ann.label, tone);
            return (
              <g key={key}>
                <line
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke="rgba(3, 6, 14, 0.8)"
                  strokeWidth="4"
                />
                <line
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke={pal.stroke}
                  strokeWidth="2.1"
                />
                <line
                  x1={a[0] - nx}
                  y1={a[1] - ny}
                  x2={a[0] + nx}
                  y2={a[1] + ny}
                  stroke={pal.stroke}
                  strokeWidth="2.1"
                />
                <line
                  x1={b[0] - nx}
                  y1={b[1] - ny}
                  x2={b[0] + nx}
                  y2={b[1] + ny}
                  stroke={pal.stroke}
                  strokeWidth="2.1"
                />
              </g>
            );
          }

          return null;
        })}
      </svg>

      {labelChips.map((chip) => {
        const pal = TONE_MAP[chip.tone];
        return (
          <div
            key={chip.key}
            className="mri-anno-label"
            style={{
              left: `${chip.x}px`,
              top: `${chip.y}px`,
              borderColor: pal.border,
            }}
          >
            <span className="anno-dot" style={{ background: pal.stroke }} />
            <span>{chip.text}</span>
          </div>
        );
      })}
    </div>
  );
}
