/**
 * 动画模块入口
 *
 * core/     — GSAP 入口、减少动效、Tween 句柄
 * download/ — 下载卡片角标展开/收起、进度圆环/水波/完成动效
 * hooks/    — 与 React 生命周期绑定的组合 Hook
 */

export { gsap, usePrefersReducedMotion, TweenHandle, createTweenHandles } from "./core";

export {
  DOWNLOAD_ANIMATION_TIMING,
  DOWNLOAD_BADGE_CORNER,
  DOWNLOAD_PROGRESS_CIRCUMFERENCE,
  DOWNLOAD_PROGRESS_SVG,
  DOWNLOAD_PROGRESS_WATER,
  animateDownloadBadgeVisibility,
  buildDownloadRepeatingWaveLine,
  buildDownloadWaveCapPath,
  clampDownloadPct,
  createBadgeCollapseTimeline,
  createBadgeExpandTimeline,
  createDownloadProgressCompleteTimeline,
  createDownloadProgressIntroTimeline,
  downloadWaterSurfaceY,
  initialWaterFillY,
  resetBadgeMotionDom,
  resetDownloadProgressVisual
} from "./download";

export { useDownloadBadgeAnimation } from "./hooks/use-download-badge-animation";
export { useDownloadProgressAnimation } from "./hooks/use-download-progress-animation";

export type { UseDownloadBadgeAnimationOptions } from "./hooks/use-download-badge-animation";
export type { UseDownloadProgressAnimationOptions } from "./hooks/use-download-progress-animation";

export type { DownloadBadgeElements, DownloadProgressDomRefs } from "./download";
