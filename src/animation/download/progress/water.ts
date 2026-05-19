import { gsap } from "@/animation/core/gsap";
import type { TweenHandle } from "@/animation/core/tween-handle";
import { DOWNLOAD_PROGRESS_SVG } from "@/animation/download/constants";
import {
  buildDownloadRepeatingWaveLine,
  buildDownloadWaveCapPath,
  downloadWaterSurfaceY,
} from "@/animation/download/progress-geometry";
import type { DownloadProgressDomRefs, DownloadProgressLevelRefs } from "./types";

const WAVE_BOB_DURATION = 1.35;

export function applyDownloadWaterLevel(
  refs: DownloadProgressDomRefs,
  levels: DownloadProgressLevelRefs,
  pct: number,
) {
  const { cy, radius } = DOWNLOAD_PROGRESS_SVG;
  const surface = downloadWaterSurfaceY(pct);
  const bottom = cy + radius + 4;
  levels.waterLevel.current.pct = pct;

  const fill = refs.waterFill;
  if (fill) {
    const height = Math.max(0, bottom - surface);
    fill.setAttribute("y", String(surface));
    fill.setAttribute("height", String(height));
  }

  if (
    levels.lastSurfaceY.current == null ||
    Math.abs(surface - levels.lastSurfaceY.current) > 0.35
  ) {
    levels.lastSurfaceY.current = surface;
    const ampFront = 5;
    const ampBack = 3.5;
    refs.waveLine?.setAttribute(
      "d",
      buildDownloadRepeatingWaveLine(surface, ampFront),
    );
    refs.waveLineBack?.setAttribute(
      "d",
      buildDownloadRepeatingWaveLine(surface + 2, ampBack),
    );
    refs.waveCap?.setAttribute("d", buildDownloadWaveCapPath(surface, ampFront));
  }
}

export function startDownloadWaveMotion(
  refs: DownloadProgressDomRefs,
  handles: { front: TweenHandle; back: TweenHandle; bob?: TweenHandle },
) {
  const front = refs.waveFrontGroup;
  const back = refs.waveBackGroup;
  if (!front || !back) return;

  if (handles.front.isActive() && handles.back.isActive()) return;

  handles.front.kill();
  handles.back.kill();
  handles.bob?.kill();

  const period = DOWNLOAD_PROGRESS_SVG.wavePeriod;
  gsap.set([front, back], {
    x: 0,
    y: 0,
    force3D: true,
    svgOrigin: `${DOWNLOAD_PROGRESS_SVG.cx} ${DOWNLOAD_PROGRESS_SVG.cy}`,
  });

  handles.back.set(
    gsap.to(back, {
      x: -period,
      duration: 2.6,
      ease: "none",
      repeat: -1,
    }),
  );

  handles.front.set(
    gsap.to(front, {
      x: -period,
      duration: 1.75,
      ease: "none",
      repeat: -1,
    }),
  );

  if (handles.bob) {
    handles.bob.set(
      gsap.to([front, back], {
        y: -2.5,
        duration: WAVE_BOB_DURATION,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      }),
    );
  }
}

export function killDownloadWaveMotion(
  refs: DownloadProgressDomRefs,
  handles: { front: TweenHandle; back: TweenHandle; bob?: TweenHandle },
) {
  handles.front.kill();
  handles.back.kill();
  handles.bob?.kill();
  if (refs.waveFrontGroup) gsap.set(refs.waveFrontGroup, { x: 0, y: 0 });
  if (refs.waveBackGroup) gsap.set(refs.waveBackGroup, { x: 0, y: 0 });
}
