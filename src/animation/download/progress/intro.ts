import { gsap } from "@/animation/core/gsap";
import { DOWNLOAD_ANIMATION_TIMING, DOWNLOAD_PROGRESS_SVG } from "@/animation/download/constants";
import { clampDownloadPct } from "@/animation/download/progress-geometry";
import { applyDownloadRingProgress } from "./ring";
import type { DownloadProgressDomRefs, DownloadProgressLevelRefs } from "./types";
import { applyDownloadWaterLevel } from "./water";

export interface DownloadProgressIntroOptions {
  introPct: number;
  onWaveStart: () => void;
}

/** 下载进度 UI 入场：箭头淡出 → SVG 弹入 → 液面/外圈从 0 涨起 */
export function createDownloadProgressIntroTimeline(
  refs: DownloadProgressDomRefs,
  levels: DownloadProgressLevelRefs,
  options: DownloadProgressIntroOptions,
): gsap.core.Timeline {
  const { cx, cy } = DOWNLOAD_PROGRESS_SVG;
  const { introPct, onWaveStart } = options;
  const { duration, ease } = DOWNLOAD_ANIMATION_TIMING.progressIntro;

  if (refs.svg) {
    gsap.set(refs.svg, {
      autoAlpha: 0,
      scale: 0.82,
      transformOrigin: `${cx}px ${cy}px`,
    });
  }
  if (refs.circle) gsap.set(refs.circle, { opacity: 0 });
  if (refs.check) gsap.set(refs.check, { opacity: 0 });

  applyDownloadWaterLevel(refs, levels, 0);
  applyDownloadRingProgress(refs, levels, 0);
  levels.lastSurfaceY.current = null;

  const tl = gsap.timeline({ onComplete: onWaveStart });

  if (refs.arrow) {
    gsap.set(refs.arrow, { autoAlpha: 1, scale: 1 });
    tl.to(refs.arrow, {
      autoAlpha: 0,
      scale: 0.55,
      duration: 0.28,
      ease: "power2.in",
    });
  }

  if (refs.svg) {
    tl.to(
      refs.svg,
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.42,
        ease: "back.out(1.6)",
      },
      refs.arrow ? "-=0.12" : 0,
    );
  }

  if (refs.circle) {
    tl.to(refs.circle, { opacity: 0.9, duration: 0.22 }, "-=0.28");
  }

  const target = clampDownloadPct(introPct);

  tl.to(
    levels.waterLevel.current,
    {
      pct: target,
      duration,
      ease,
      onUpdate() {
        applyDownloadWaterLevel(refs, levels, levels.waterLevel.current.pct);
      },
    },
    "-=0.35",
  );

  tl.to(
    levels.ringLevel.current,
    {
      pct: target,
      duration,
      ease,
      onUpdate() {
        applyDownloadRingProgress(refs, levels, levels.ringLevel.current.pct);
      },
    },
    "<",
  );

  return tl;
}
