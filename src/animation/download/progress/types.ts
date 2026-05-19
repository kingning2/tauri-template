import type { MutableRefObject } from "react";

export interface DownloadProgressDomRefs {
  svg: SVGSVGElement | null;
  circle: SVGCircleElement | null;
  check: SVGPathElement | null;
  arrow: HTMLDivElement | null;
  waterFill: SVGRectElement | null;
  waveFrontGroup: SVGGElement | null;
  waveBackGroup: SVGGElement | null;
  waveLine: SVGPathElement | null;
  waveLineBack: SVGPathElement | null;
  waveCap: SVGPathElement | null;
}

export interface DownloadProgressLevelRefs {
  waterLevel: MutableRefObject<{ pct: number }>;
  ringLevel: MutableRefObject<{ pct: number }>;
  lastSurfaceY: MutableRefObject<number | null>;
}

export type GetDownloadProgressRefs = () => DownloadProgressDomRefs;
