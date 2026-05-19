import { gsap } from "@/animation/core/gsap";
import type { TweenHandle } from "@/animation/core/tween-handle";
import { DOWNLOAD_PROGRESS_CIRCUMFERENCE } from "@/animation/download/constants";
import { clampDownloadPct } from "@/animation/download/progress-geometry";
import type { DownloadProgressDomRefs, DownloadProgressLevelRefs } from "./types";

export function applyDownloadRingProgress(
  refs: DownloadProgressDomRefs,
  levels: DownloadProgressLevelRefs,
  pct: number,
) {
  const circle = refs.circle;
  if (!circle) return;
  const p = clampDownloadPct(pct);
  levels.ringLevel.current.pct = p;
  gsap.set(circle, {
    strokeDasharray: `${DOWNLOAD_PROGRESS_CIRCUMFERENCE} ${DOWNLOAD_PROGRESS_CIRCUMFERENCE}`,
    strokeDashoffset: DOWNLOAD_PROGRESS_CIRCUMFERENCE * (1 - p / 100),
    opacity: 0.9,
  });
}

export function tweenDownloadRingProgress(
  refs: DownloadProgressDomRefs,
  levels: DownloadProgressLevelRefs,
  handle: TweenHandle,
  target: number,
  duration: number,
  ease: string,
  onUpdate: () => void,
) {
  handle.kill();
  handle.set(
    gsap.to(levels.ringLevel.current, {
      pct: clampDownloadPct(target),
      duration,
      ease,
      overwrite: true,
      onUpdate: () => {
        applyDownloadRingProgress(refs, levels, levels.ringLevel.current.pct);
        onUpdate();
      },
    }),
  );
}
