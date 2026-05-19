import { gsap } from "@/animation/core/gsap";
import type { TweenHandle } from "@/animation/core/tween-handle";
import { applyDownloadRingProgress } from "./ring";
import type { DownloadProgressDomRefs, DownloadProgressLevelRefs } from "./types";
import { applyDownloadWaterLevel, killDownloadWaveMotion } from "./water";

export function resetDownloadProgressVisual(
  refs: DownloadProgressDomRefs,
  levels: DownloadProgressLevelRefs,
  waveHandles: { front: TweenHandle; back: TweenHandle; bob?: TweenHandle },
  syncHandles: { waterIndeterminate: TweenHandle; ring: TweenHandle }
) {
  killDownloadWaveMotion(refs, waveHandles);
  syncHandles.waterIndeterminate.kill();
  syncHandles.ring.kill();

  levels.lastSurfaceY.current = null;
  applyDownloadWaterLevel(refs, levels, 0);
  applyDownloadRingProgress(refs, levels, 0);

  gsap.killTweensOf(
    [
      refs.svg,
      refs.circle,
      refs.check,
      refs.arrow,
      levels.waterLevel.current,
      levels.ringLevel.current,
      refs.waveFrontGroup,
      refs.waveBackGroup
    ].filter(Boolean)
  );

  if (refs.svg) gsap.set(refs.svg, { autoAlpha: 0, scale: 0.9 });
  if (refs.circle) gsap.set(refs.circle, { opacity: 0 });
  if (refs.check) gsap.set(refs.check, { opacity: 0, scale: 1 });
  if (refs.arrow) gsap.set(refs.arrow, { autoAlpha: 1, scale: 1 });
}
