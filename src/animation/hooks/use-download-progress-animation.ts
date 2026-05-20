"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type gsap from "gsap";

import { createTweenHandles } from "@/animation/core";
import {
  clampDownloadPct,
  createDownloadProgressCompleteTimeline,
  createDownloadProgressIntroTimeline,
  downloadWaterSurfaceY,
  DOWNLOAD_PROGRESS_SVG,
  DOWNLOAD_PROGRESS_WATER,
  initialWaterFillY,
  buildDownloadRepeatingWaveLine,
  killDownloadWaveMotion,
  resetDownloadProgressVisual,
  startDownloadWaveMotion,
  syncDownloadProgressDeterminate,
  syncDownloadProgressIndeterminate,
  type DownloadProgressDomRefs
} from "@/animation/download";
import { DownloadPhase } from "@/enums/download-phase";

export interface UseDownloadProgressAnimationOptions {
  phase: DownloadPhase;
  progress: number | null;
  layoutExpanded: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onFinishDismiss?: () => void;
}

export function useDownloadProgressAnimation({
  phase,
  progress,
  layoutExpanded,
  onExpandedChange,
  onFinishDismiss
}: UseDownloadProgressAnimationOptions) {
  const lucideArrowRef = useRef<HTMLDivElement>(null);
  const progressSvgRef = useRef<SVGSVGElement>(null);
  const progressCircleRef = useRef<SVGCircleElement>(null);
  const checkRef = useRef<SVGPathElement>(null);
  const waterFillRef = useRef<SVGRectElement>(null);
  const waveFrontGroupRef = useRef<SVGGElement>(null);
  const waveBackGroupRef = useRef<SVGGElement>(null);
  const waveLineRef = useRef<SVGPathElement>(null);
  const waveLineBackRef = useRef<SVGPathElement>(null);
  const waveCapRef = useRef<SVGPathElement>(null);

  const waterLevelRef = useRef({ pct: 0 });
  const ringLevelRef = useRef({ pct: 0 });
  const lastSurfaceYRef = useRef<number | null>(null);

  const introTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const completeTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const introPlayedRef = useRef(false);
  const completeAnimPlayedRef = useRef(false);

  const waveHandles = useMemo(() => createTweenHandles(["front", "back", "bob"] as const), []);
  const syncHandles = useMemo(
    () => createTweenHandles(["waterIndeterminate", "ring"] as const),
    []
  );

  const [showAfterComplete, setShowAfterComplete] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  const showProgressSvg =
    phase === DownloadPhase.Downloading || (phase === DownloadPhase.Completed && showAfterComplete);

  const isExpanded =
    layoutExpanded ||
    phase === DownloadPhase.Downloading ||
    (phase === DownloadPhase.Completed && showAfterComplete);

  const showWater =
    phase === DownloadPhase.Downloading || (phase === DownloadPhase.Completed && showAfterComplete);

  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  const getDomRefs = useCallback(
    (): DownloadProgressDomRefs => ({
      svg: progressSvgRef.current,
      circle: progressCircleRef.current,
      check: checkRef.current,
      arrow: lucideArrowRef.current,
      waterFill: waterFillRef.current,
      waveFrontGroup: waveFrontGroupRef.current,
      waveBackGroup: waveBackGroupRef.current,
      waveLine: waveLineRef.current,
      waveLineBack: waveLineBackRef.current,
      waveCap: waveCapRef.current
    }),
    []
  );

  const getLevelRefs = useCallback(
    () => ({
      waterLevel: waterLevelRef,
      ringLevel: ringLevelRef,
      lastSurfaceY: lastSurfaceYRef
    }),
    []
  );

  const stopLoops = useCallback(() => {
    killDownloadWaveMotion(getDomRefs(), waveHandles);
    syncHandles.waterIndeterminate.kill();
    syncHandles.ring.kill();
  }, [getDomRefs, syncHandles.ring, syncHandles.waterIndeterminate, waveHandles]);

  const resetVisualState = useCallback(() => {
    stopLoops();
    introPlayedRef.current = false;
    completeAnimPlayedRef.current = false;
    setIntroDone(false);
    setShowAfterComplete(false);
    resetDownloadProgressVisual(getDomRefs(), getLevelRefs(), waveHandles, syncHandles);
  }, [getDomRefs, getLevelRefs, stopLoops, syncHandles, waveHandles]);

  useLayoutEffect(() => {
    if (phase !== DownloadPhase.Downloading || !showProgressSvg) return;
    if (introPlayedRef.current) return;

    const refs = getDomRefs();
    if (!refs.svg || !refs.circle || !refs.check) return;

    introPlayedRef.current = true;
    stopLoops();

    const introPct = progress != null ? clampDownloadPct(progress) : 10;

    introTimelineRef.current = createDownloadProgressIntroTimeline(refs, getLevelRefs(), {
      introPct,
      onWaveStart: () => setIntroDone(true)
    });

    return () => {
      introTimelineRef.current?.kill();
      introTimelineRef.current = null;
    };
  }, [getDomRefs, getLevelRefs, phase, showProgressSvg, stopLoops]);

  useEffect(() => {
    if (!introDone || !showWater || phase !== DownloadPhase.Downloading) return;

    const refs = getDomRefs();
    if (!refs.waveFrontGroup || !refs.waveBackGroup) return;

    startDownloadWaveMotion(refs, waveHandles);

    return () => {
      killDownloadWaveMotion(refs, waveHandles);
    };
  }, [getDomRefs, introDone, phase, showWater, waveHandles]);

  useEffect(() => {
    if (!showWater || phase !== DownloadPhase.Downloading) return;
    if (!introPlayedRef.current) return;

    const refs = getDomRefs();
    const levels = getLevelRefs();

    if (progress != null) {
      syncDownloadProgressDeterminate(refs, levels, syncHandles, progress);
      return () => syncHandles.ring.kill();
    }

    syncDownloadProgressIndeterminate(refs, levels, syncHandles);
    return () => {
      syncHandles.waterIndeterminate.kill();
      syncHandles.ring.kill();
    };
  }, [getDomRefs, getLevelRefs, phase, progress, showWater, syncHandles]);

  useLayoutEffect(() => {
    if (phase !== DownloadPhase.Completed) return;
    if (showAfterComplete) return;
    flushSync(() => setShowAfterComplete(true));
  }, [phase, showAfterComplete]);

  useLayoutEffect(() => {
    if (!showAfterComplete || phase !== DownloadPhase.Completed) return;
    if (completeAnimPlayedRef.current) return;

    const refs = getDomRefs();
    if (!refs.svg || !refs.circle || !refs.check) return;

    completeAnimPlayedRef.current = true;
    stopLoops();

    completeTimelineRef.current = createDownloadProgressCompleteTimeline(refs, getLevelRefs(), {
      onDismiss: () => {
        setShowAfterComplete(false);
        onFinishDismiss?.();
      }
    });

    return () => {
      completeTimelineRef.current?.kill();
    };
  }, [getDomRefs, getLevelRefs, onFinishDismiss, phase, showAfterComplete, stopLoops]);

  useEffect(() => {
    if (phase === DownloadPhase.Idle || phase === DownloadPhase.Error) {
      queueMicrotask(() => resetVisualState());
    }
  }, [phase, resetVisualState]);

  const pctLabel =
    phase === DownloadPhase.Downloading
      ? progress == null
        ? "…"
        : `${Math.round(clampDownloadPct(progress))}%`
      : phase === DownloadPhase.Completed
        ? "100%"
        : "0%";

  return {
    lucideArrowRef,
    progressSvgRef,
    progressCircleRef,
    checkRef,
    waterFillRef,
    waveFrontGroupRef,
    waveBackGroupRef,
    waveLineRef,
    waveLineBackRef,
    waveCapRef,
    showProgressSvg,
    isExpanded,
    pctLabel,
    svgGeometry: DOWNLOAD_PROGRESS_SVG,
    waterGeometry: DOWNLOAD_PROGRESS_WATER,
    initialWaterFillY,
    buildRepeatingWaveLine: buildDownloadRepeatingWaveLine,
    waterSurfaceY: downloadWaterSurfaceY
  };
}
