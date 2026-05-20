"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { gsap, usePrefersReducedMotion } from "@/animation/core";
import {
  animateDownloadBadgeVisibility,
  createBadgeCollapseTimeline,
  createBadgeExpandTimeline,
  DOWNLOAD_ANIMATION_TIMING,
  resetBadgeMotionDom,
  type DownloadBadgeElements
} from "@/animation/download";
import { DownloadPhase } from "@/generated/contracts";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

export interface UseDownloadBadgeAnimationOptions {
  phase: DownloadPhase;
  onCollapseComplete?: () => void;
}

export function useDownloadBadgeAnimation({
  phase,
  onCollapseComplete
}: UseDownloadBadgeAnimationOptions) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const cardSurfaceRef = useRef<HTMLDivElement>(null);
  const badgeMotionRef = useRef<HTMLDivElement>(null);
  const badgeVisualRef = useRef<HTMLDivElement>(null);
  const expandTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const expandAnimatingRef = useRef(false);
  const collapseScheduledRef = useRef(false);

  const [cardHovered, setCardHovered] = useState(false);
  const [downloadExpandActive, setDownloadExpandActive] = useState(false);
  const [progressExpanded, setProgressExpanded] = useState(false);

  const getBadgeElements = useCallback((): DownloadBadgeElements | null => {
    const card = cardSurfaceRef.current;
    const motion = badgeMotionRef.current;
    const visual = badgeVisualRef.current;
    if (!card || !motion || !visual) return null;
    return { card, motion, visual };
  }, []);

  const resetBadgeLayout = useCallback(() => {
    expandTimelineRef.current?.kill();
    expandTimelineRef.current = null;
    expandAnimatingRef.current = false;
    collapseScheduledRef.current = false;
    setDownloadExpandActive(false);
    setProgressExpanded(false);
    resetBadgeMotionDom(badgeMotionRef.current, badgeVisualRef.current);
  }, []);

  const playDownloadCollapse = useCallback(
    (onComplete?: () => void) => {
      const elements = getBadgeElements();
      if (!elements) {
        resetBadgeLayout();
        onComplete?.();
        return;
      }

      if (prefersReducedMotion || (!progressExpanded && !downloadExpandActive)) {
        resetBadgeLayout();
        onComplete?.();
        return;
      }

      expandAnimatingRef.current = true;
      expandTimelineRef.current = createBadgeCollapseTimeline(elements, {
        onComplete: () => {
          expandAnimatingRef.current = false;
          resetBadgeLayout();
          onComplete?.();
        }
      });
    },
    [
      downloadExpandActive,
      getBadgeElements,
      prefersReducedMotion,
      progressExpanded,
      resetBadgeLayout
    ]
  );

  const handleDownloadFinishDismiss = useCallback(() => {
    if (collapseScheduledRef.current) return;
    collapseScheduledRef.current = true;
    playDownloadCollapse(() => {
      collapseScheduledRef.current = false;
      onCollapseComplete?.();
    });
  }, [onCollapseComplete, playDownloadCollapse]);

  const playDownloadExpand = useCallback(
    (onComplete: () => void) => {
      if (expandAnimatingRef.current) return;

      const elements = getBadgeElements();
      if (!elements) {
        onComplete();
        return;
      }

      if (prefersReducedMotion) {
        setDownloadExpandActive(true);
        flushSync(() => setProgressExpanded(true));
        onComplete();
        return;
      }

      expandAnimatingRef.current = true;
      setDownloadExpandActive(true);

      expandTimelineRef.current = createBadgeExpandTimeline(elements, {
        onComplete: () => {
          expandAnimatingRef.current = false;
          flushSync(() => setProgressExpanded(true));
          onComplete();
        }
      });
    },
    [getBadgeElements, prefersReducedMotion]
  );

  useEffect(() => {
    if (phase !== DownloadPhase.Error) return;
    queueMicrotask(() => playDownloadCollapse(onCollapseComplete));
  }, [phase, onCollapseComplete, playDownloadCollapse]);

  useEffect(() => {
    if (phase !== DownloadPhase.Completed) return;
    const fallbackMs = prefersReducedMotion
      ? DOWNLOAD_ANIMATION_TIMING.collapseFallbackReducedMs
      : DOWNLOAD_ANIMATION_TIMING.collapseFallbackMs;
    const timer = window.setTimeout(() => {
      if (progressExpanded || downloadExpandActive) {
        handleDownloadFinishDismiss();
      }
    }, fallbackMs);
    return () => window.clearTimeout(timer);
  }, [
    phase,
    prefersReducedMotion,
    progressExpanded,
    downloadExpandActive,
    handleDownloadFinishDismiss
  ]);

  useIsomorphicLayoutEffect(() => {
    const visual = badgeVisualRef.current;
    if (!visual) return;

    const visible =
      cardHovered ||
      downloadExpandActive ||
      phase === DownloadPhase.Downloading ||
      progressExpanded;

    animateDownloadBadgeVisibility(visual, visible, prefersReducedMotion);

    return () => {
      gsap.killTweensOf(visual);
    };
  }, [cardHovered, downloadExpandActive, phase, progressExpanded, prefersReducedMotion]);

  useIsomorphicLayoutEffect(() => {
    return () => {
      expandTimelineRef.current?.kill();
    };
  }, []);

  return {
    cardSurfaceRef,
    badgeMotionRef,
    badgeVisualRef,
    cardHovered,
    setCardHovered,
    downloadExpandActive,
    progressExpanded,
    playDownloadExpand,
    handleDownloadFinishDismiss,
    resetBadgeLayout
  };
}
