export interface WindowLevel {
  width: number;
  level: number;
}

/**
 * Maps a physical intensity (e.g. Hounsfield Units or MRI arbitrary units)
 * through a standard linear PACS Window/Level LUT to 0..255 grayscale.
 */
export function applyWindowLevel(value: number, wl: WindowLevel): number {
  const low = wl.level - wl.width / 2;
  const high = wl.level + wl.width / 2;
  if (value <= low) return 0;
  if (value >= high) return 255;
  return Math.round(((value - low) / wl.width) * 255);
}

/**
 * Deterministic fast hash noise for subtle MRI Rician / CT quantum grain
 * without triggering slow Math.random allocations.
 */
export function fastPixelNoise(x: number, y: number, seed = 17): number {
  let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return ((n & 0xff) / 255 - 0.5) * 2;
}

export function drawPacsOrientationMarkers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  markers: { top: string; bottom: string; left: string; right: string }
): void {
  ctx.save();
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(229, 190, 112, 0.88)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(markers.top, width / 2, 10);

  ctx.textBaseline = 'bottom';
  ctx.fillText(markers.bottom, width / 2, height - 10);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(markers.left, 10, height / 2);

  ctx.textAlign = 'right';
  ctx.fillText(markers.right, width - 10, height / 2);
  ctx.restore();
}

export function drawPacsScaleBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  lengthPx: number,
  label = '5 cm'
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(236, 234, 228, 0.72)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + lengthPx);
  for (let i = 0; i <= 5; i++) {
    const ty = y + (lengthPx * i) / 5;
    const tickLen = i === 0 || i === 5 ? 6 : 3.5;
    ctx.moveTo(x - tickLen, ty);
    ctx.lineTo(x, ty);
  }
  ctx.stroke();

  ctx.font = '500 9.5px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(236, 234, 228, 0.72)';
  ctx.textAlign = 'right';
  ctx.fillText(label, x - 8, y + lengthPx / 2 + 3);
  ctx.restore();
}

export function drawCrosshairs(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  normX: number,
  normY: number,
  color = 'rgba(56, 189, 248, 0.55)'
): void {
  const px = normX * width;
  const py = normY * height;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(px, 0);
  ctx.lineTo(px, Math.max(0, py - 12));
  ctx.moveTo(px, Math.min(height, py + 12));
  ctx.lineTo(px, height);
  ctx.moveTo(0, py);
  ctx.lineTo(Math.max(0, px - 12), py);
  ctx.moveTo(Math.min(width, px + 12), py);
  ctx.lineTo(width, py);
  ctx.stroke();
  ctx.restore();
}
