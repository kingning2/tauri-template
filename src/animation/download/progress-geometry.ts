import {
  DOWNLOAD_PROGRESS_SVG,
  DOWNLOAD_PROGRESS_WATER,
} from "./constants";

export function clampDownloadPct(p: number): number {
  if (Number.isNaN(p) || !Number.isFinite(p)) return 0;
  return Math.min(100, Math.max(0, p));
}

/** 液面 Y：0% 在圆底，100% 在圆顶 */
export function downloadWaterSurfaceY(pct: number): number {
  const p = clampDownloadPct(pct);
  const { cy, radius } = DOWNLOAD_PROGRESS_SVG;
  return cy + radius - (p / 100) * (2 * radius);
}

/** 可横向平移拼缝的重复波浪线（仅液面高度变化时重建 path） */
export function buildDownloadRepeatingWaveLine(
  surfaceY: number,
  amplitude: number,
  period = DOWNLOAD_PROGRESS_SVG.wavePeriod,
): string {
  const startX = -period * 2;
  const cycles = 6;
  const half = period / 2;
  let d = `M ${startX} ${surfaceY}`;
  for (let i = 0; i < cycles; i++) {
    const xMid = startX + half * (i + 0.5);
    const xEnd = startX + half * (i + 1);
    const cpY = i % 2 === 0 ? surfaceY - amplitude : surfaceY + amplitude;
    d += ` Q ${xMid} ${cpY} ${xEnd} ${surfaceY}`;
  }
  return d;
}

/** 液面波浪带（封闭），与线条同相位平移 */
export function buildDownloadWaveCapPath(
  surfaceY: number,
  amplitude: number,
  period = DOWNLOAD_PROGRESS_SVG.wavePeriod,
): string {
  const startX = -period * 2;
  const endX = startX + period * 6;
  const line = buildDownloadRepeatingWaveLine(surfaceY, amplitude, period);
  return `${line} L ${endX} ${surfaceY + amplitude + 8} L ${startX} ${surfaceY + amplitude + 8} Z`;
}

export function initialWaterFillY(): number {
  return downloadWaterSurfaceY(0);
}

export { DOWNLOAD_PROGRESS_WATER, DOWNLOAD_PROGRESS_SVG };
