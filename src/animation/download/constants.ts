/** 下载卡片角标在卡片内的停靠位置（px） */
export const DOWNLOAD_BADGE_CORNER = {
  right: 30,
  top: 30,
  size: 40
} as const;

/** 下载进度圆环 SVG 几何 */
export const DOWNLOAD_PROGRESS_SVG = {
  cx: 80,
  cy: 80,
  radius: 54,
  viewBox: 160,
  wavePeriod: 48,
  checkPath: "M62 82 L75 95 L100 65"
} as const;

export const DOWNLOAD_PROGRESS_CIRCUMFERENCE = 2 * Math.PI * DOWNLOAD_PROGRESS_SVG.radius;

export const DOWNLOAD_PROGRESS_WATER = {
  x: DOWNLOAD_PROGRESS_SVG.cx - DOWNLOAD_PROGRESS_SVG.radius,
  width: DOWNLOAD_PROGRESS_SVG.radius * 2
} as const;

/** 共享缓动与时长 */
export const DOWNLOAD_ANIMATION_TIMING = {
  badgeExpand: { duration: 0.55, ease: "power3.inOut" as const },
  badgeCollapse: { duration: 0.5, ease: "power3.inOut" as const },
  badgeVisualRadius: { duration: 0.48, ease: "power3.inOut" as const },
  badgeVisibility: { duration: 0.45, ease: "power3.out" as const },
  progressIntro: { duration: 0.65, ease: "power2.out" as const },
  progressSync: { duration: 0.55, ease: "sine.out" as const },
  progressComplete: { duration: 0.4, ease: "power2.out" as const },
  completeDismissDelayMs: 750,
  collapseFallbackMs: 3200,
  collapseFallbackReducedMs: 500
} as const;
