"use client";

import { ArrowDown } from "lucide-react";
import { useId } from "react";

import { buildDownloadWaveCapPath, useDownloadProgressAnimation } from "@/animation";
import { DownloadPhase } from "@/enums/download-phase";
import { cn } from "@/lib/utils";

export interface DowloadProgressProps {
  phase: DownloadPhase;
  progress: number | null;
  installed?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  layoutExpanded?: boolean;
  onFinishDismiss?: () => void;
}

export default function DowloadProgress({
  phase,
  progress,
  installed = false,
  onExpandedChange,
  layoutExpanded = false,
  onFinishDismiss
}: DowloadProgressProps) {
  const clipId = useId().replace(/:/g, "");

  const {
    lucideArrowRef,
    progressSvgRef,
    progressCircleRef,
    checkRef,
    waterFillRef,
    waveFrontGroupRef,
    waveBackGroupRef,
    waveLineRef,
    waveLineBackRef,
    waveCapRef,
    showProgressSvg,
    isExpanded,
    pctLabel,
    svgGeometry,
    waterGeometry,
    initialWaterFillY,
    buildRepeatingWaveLine,
    waterSurfaceY
  } = useDownloadProgressAnimation({
    phase,
    progress,
    layoutExpanded,
    onExpandedChange,
    onFinishDismiss
  });

  const { cx, cy, radius, viewBox, checkPath } = svgGeometry;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress == null ? undefined : Math.round(progress)}
      aria-busy={phase === DownloadPhase.Downloading}
      aria-label="Download progress"
      className={cn(
        "pointer-events-auto absolute inset-0 z-30 flex items-center justify-center",
        isExpanded && "overflow-hidden rounded-3xl"
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden",
          isExpanded
            ? "h-full w-full rounded-3xl bg-transparent shadow-none ring-0"
            : "h-10 w-10 shrink-0 rounded-full bg-[#0a84ff] shadow-lg ring-1 ring-white/10"
        )}
      >
        <div
          ref={lucideArrowRef}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          aria-hidden
        >
          <ArrowDown
            className={cn("shrink-0 text-white", installed && "rotate-270")}
            size={isExpanded ? 36 : 30}
            strokeWidth={2.25}
          />
        </div>

        {showProgressSvg && (
          <svg
            ref={progressSvgRef}
            viewBox={`0 0 ${viewBox} ${viewBox}`}
            preserveAspectRatio="xMidYMid meet"
            className={cn(
              "block",
              isExpanded
                ? "aspect-square h-[min(72%,240px)] max-h-[88%] w-[min(72%,240px)] max-w-[88%]"
                : "absolute inset-0 h-full w-full"
            )}
          >
            <defs>
              <clipPath id={clipId}>
                <circle cx={cx} cy={cy} r={radius} />
              </clipPath>
            </defs>

            <circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="5"
              fill="none"
            />

            <g clipPath={`url(#${clipId})`}>
              <rect
                ref={waterFillRef}
                x={waterGeometry.x}
                y={initialWaterFillY()}
                width={waterGeometry.width}
                height={0}
                fill="rgba(255,255,255,0.24)"
              />
              <g
                ref={waveBackGroupRef}
                className="will-change-transform"
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center center"
                }}
              >
                <path
                  ref={waveLineBackRef}
                  d={buildRepeatingWaveLine(waterSurfaceY(0) + 2, 3.5)}
                  fill="none"
                  stroke="rgba(255,255,255,0.38)"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                />
              </g>
              <g
                ref={waveFrontGroupRef}
                className="will-change-transform"
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center center"
                }}
              >
                <path
                  ref={waveCapRef}
                  d={buildDownloadWaveCapPath(waterSurfaceY(0), 5)}
                  fill="rgba(255,255,255,0.14)"
                />
                <path
                  ref={waveLineRef}
                  d={buildRepeatingWaveLine(waterSurfaceY(0), 5)}
                  fill="none"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="3.25"
                  strokeLinecap="round"
                />
              </g>
            </g>

            <circle
              ref={progressCircleRef}
              cx={cx}
              cy={cy}
              r={radius}
              stroke="#fff"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />

            <text
              x={cx}
              y={120}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fff"
              fontSize="20"
              fontWeight="700"
              style={{ fontFamily: "sans-serif" }}
            >
              {pctLabel}
            </text>

            <path
              ref={checkRef}
              d={checkPath}
              stroke="#fff"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
