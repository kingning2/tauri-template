import { gsap } from "@/animation/core/gsap";
import type { TweenHandle } from "@/animation/core/tween-handle";
import { DOWNLOAD_ANIMATION_TIMING } from "@/animation/download/constants";
import { clampDownloadPct } from "@/animation/download/progress-geometry";
import { applyDownloadRingProgress, tweenDownloadRingProgress } from "./ring";
import type { DownloadProgressDomRefs, DownloadProgressLevelRefs } from "./types";
import { applyDownloadWaterLevel } from "./water";

export interface DownloadProgressSyncHandles {
  waterIndeterminate: TweenHandle;
  ring: TweenHandle;
}

/** 已知进度：液面 + 外圈平滑跟随 */
export function syncDownloadProgressDeterminate(
  refs: DownloadProgressDomRefs,
  levels: DownloadProgressLevelRefs,
  handles: DownloadProgressSyncHandles,
  progress: number,
) {
  handles.waterIndeterminate.kill();
  const target = clampDownloadPct(progress);
  const { duration, ease } = DOWNLOAD_ANIMATION_TIMING.progressSync;

  gsap.to(levels.waterLevel.current, {
    pct: target,
    duration,
    ease,
    overwrite: true,
    onUpdate() {
      applyDownloadWaterLevel(refs, levels, levels.waterLevel.current.pct);
    },
  });

  tweenDownloadRingProgress(refs, levels, handles.ring, target, duration, ease, () => {});
}

/** 未知总量：液面/外圈往复 */
export function syncDownloadProgressIndeterminate(
  refs: DownloadProgressDomRefs,
  levels: DownloadProgressLevelRefs,
  handles: DownloadProgressSyncHandles,
) {
  handles.waterIndeterminate.kill();
  handles.ring.kill();

  applyDownloadWaterLevel(refs, levels, 12);
  applyDownloadRingProgress(refs, levels, 0);

  handles.waterIndeterminate.set(
    gsap.to(levels.waterLevel.current, {
      pct: 78,
      duration: 1.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      onUpdate() {
        applyDownloadWaterLevel(refs, levels, levels.waterLevel.current.pct);
      },
    }),
  );

  handles.ring.set(
    gsap.to(levels.ringLevel.current, {
      pct: 88,
      duration: 1.6,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      onUpdate() {
        applyDownloadRingProgress(refs, levels, levels.ringLevel.current.pct);
      },
    }),
  );
}
