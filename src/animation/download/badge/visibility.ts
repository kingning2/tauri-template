import { gsap } from "@/animation/core/gsap";
import { DOWNLOAD_ANIMATION_TIMING } from "@/animation/download/constants";

/** 角标 hover / 下载态显隐（scale + autoAlpha） */
export function animateDownloadBadgeVisibility(
  visual: HTMLElement,
  visible: boolean,
  prefersReducedMotion: boolean,
): void {
  const next: gsap.TweenVars = {
    scale: prefersReducedMotion ? 1 : visible ? 1 : 0,
    autoAlpha: visible ? 1 : 0,
    transformOrigin: "50% 50%",
  };

  gsap.killTweensOf(visual);

  if (prefersReducedMotion) {
    gsap.set(visual, next);
    return;
  }

  const { duration, ease } = DOWNLOAD_ANIMATION_TIMING.badgeVisibility;
  gsap.to(visual, { ...next, duration, ease, overwrite: "auto" });
}
