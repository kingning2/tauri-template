import { gsap } from "@/animation/core/gsap";
import {
  DOWNLOAD_ANIMATION_TIMING,
  DOWNLOAD_BADGE_CORNER,
} from "@/animation/download/constants";

export interface DownloadBadgeElements {
  card: HTMLElement;
  motion: HTMLElement;
  visual: HTMLElement;
}

export interface BadgeMotionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function measureBadgeMotionInCard(
  card: HTMLElement,
  motion: HTMLElement,
): BadgeMotionRect {
  const cardRect = card.getBoundingClientRect();
  const motionRect = motion.getBoundingClientRect();
  return {
    left: motionRect.left - cardRect.left,
    top: motionRect.top - cardRect.top,
    width: motionRect.width,
    height: motionRect.height,
  };
}

export function getBadgeCornerTarget(cardWidth: number): BadgeMotionRect {
  const { right, top, size } = DOWNLOAD_BADGE_CORNER;
  return {
    left: cardWidth - right - size,
    top,
    width: size,
    height: size,
  };
}

export function pinBadgeMotion(motion: HTMLElement, rect: BadgeMotionRect) {
  gsap.set(motion, {
    position: "absolute",
    right: "auto",
    bottom: "auto",
    margin: 0,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    x: 0,
    y: 0,
  });
}

/** 角标从右上角展开至铺满卡片 */
export function createBadgeExpandTimeline(
  elements: DownloadBadgeElements,
  options: { onComplete: () => void },
): gsap.core.Timeline {
  const { card, motion, visual } = elements;
  const cardRect = card.getBoundingClientRect();
  const start = measureBadgeMotionInCard(card, motion);

  gsap.killTweensOf([motion, visual]);
  gsap.set(visual, { scale: 1, autoAlpha: 1, transformOrigin: "50% 50%" });
  pinBadgeMotion(motion, start);

  const { duration, ease } = DOWNLOAD_ANIMATION_TIMING.badgeExpand;
  const radiusEase = DOWNLOAD_ANIMATION_TIMING.badgeVisualRadius;

  return gsap
    .timeline({
      onComplete: () => {
        gsap.set(motion, {
          clearProps: "left,top,right,bottom,width,height,x,y,scale",
        });
        options.onComplete();
      },
    })
    .to(
      motion,
      { left: 0, top: 0, width: cardRect.width, height: cardRect.height, duration, ease },
      0,
    )
    .to(visual, { borderRadius: "1.5rem", duration: radiusEase.duration, ease: radiusEase.ease }, 0.06);
}

/** 角标从铺满状态缩回右上角 */
export function createBadgeCollapseTimeline(
  elements: DownloadBadgeElements,
  options: { onComplete: () => void },
): gsap.core.Timeline {
  const { card, motion, visual } = elements;
  const cardRect = card.getBoundingClientRect();
  const current = measureBadgeMotionInCard(card, motion);
  const target = getBadgeCornerTarget(cardRect.width);

  gsap.killTweensOf([motion, visual]);
  pinBadgeMotion(motion, current);

  const { duration, ease } = DOWNLOAD_ANIMATION_TIMING.badgeCollapse;
  const radiusEase = DOWNLOAD_ANIMATION_TIMING.badgeVisualRadius;

  return gsap
    .timeline({ onComplete: options.onComplete })
    .to(
      motion,
      {
        left: target.left,
        top: target.top,
        width: target.width,
        height: target.height,
        duration,
        ease,
      },
      0,
    )
    .to(visual, { borderRadius: "9999px", duration: radiusEase.duration, ease: radiusEase.ease }, 0.05);
}

export function resetBadgeMotionDom(motion: HTMLElement | null, visual: HTMLElement | null) {
  if (motion) {
    gsap.killTweensOf(motion);
    gsap.set(motion, { clearProps: "all" });
  }
  if (visual) {
    gsap.killTweensOf(visual);
    gsap.set(visual, { clearProps: "borderRadius" });
  }
}
