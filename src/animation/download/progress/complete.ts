import { gsap } from "@/animation/core/gsap";
import { DOWNLOAD_ANIMATION_TIMING, DOWNLOAD_PROGRESS_SVG } from "@/animation/download/constants";
import { applyDownloadRingProgress } from "./ring";
import type { DownloadProgressDomRefs, DownloadProgressLevelRefs } from "./types";
import { applyDownloadWaterLevel } from "./water";

export interface DownloadProgressCompleteOptions {
  onDismiss: () => void;
}

/** 下载完成：液面/外圈涨满 → 对勾弹出 → 延迟回调收起 */
export function createDownloadProgressCompleteTimeline(
  refs: DownloadProgressDomRefs,
  levels: DownloadProgressLevelRefs,
  options: DownloadProgressCompleteOptions
): gsap.core.Timeline {
  const { cx, cy } = DOWNLOAD_PROGRESS_SVG;
  const { duration, ease } = DOWNLOAD_ANIMATION_TIMING.progressComplete;
  const dismissDelay = DOWNLOAD_ANIMATION_TIMING.completeDismissDelayMs;

  if (refs.arrow) gsap.set(refs.arrow, { autoAlpha: 0 });
  if (refs.svg) gsap.set(refs.svg, { autoAlpha: 1, scale: 1 });
  if (refs.check) {
    gsap.set(refs.check, {
      opacity: 0,
      scale: 0.4,
      transformOrigin: `${cx}px ${cy}px`
    });
  }

  const tl = gsap.timeline({
    onComplete: () => {
      window.setTimeout(options.onDismiss, dismissDelay);
    }
  });

  tl.to(
    levels.waterLevel.current,
    {
      pct: 100,
      duration,
      ease,
      onUpdate() {
        applyDownloadWaterLevel(refs, levels, levels.waterLevel.current.pct);
      }
    },
    0
  );

  tl.to(
    levels.ringLevel.current,
    {
      pct: 100,
      duration,
      ease,
      onUpdate() {
        applyDownloadRingProgress(refs, levels, levels.ringLevel.current.pct);
      }
    },
    0
  );

  if (refs.circle) {
    tl.to(refs.circle, { opacity: 1, duration: 0.2 }, 0);
  }

  if (refs.check) {
    tl.to(
      refs.check,
      {
        opacity: 1,
        scale: 1,
        duration: 0.38,
        ease: "back.out(2.2)"
      },
      "-=0.12"
    );
  }

  return tl;
}
