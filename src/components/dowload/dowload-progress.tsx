"use client";

import { ArrowDown } from "lucide-react";
import { interpolate } from "flubber";
import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { DownloadPhase } from "@/enums/download-phase";
import { cn } from "@/lib/utils";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ARROW_PATH = "M80 45 L80 88 M65 73 L80 88 L95 73";
const WAVE_PATH = "M48 88 Q62 78 76 88 T104 88";
const CHECK_PATH = "M62 82 L75 95 L100 65";

function clampPct(p: number): number {
  if (Number.isNaN(p) || !Number.isFinite(p)) return 0;
  return Math.min(100, Math.max(0, p));
}

export interface DowloadProgressProps {
  phase: DownloadPhase;
  /** 已知总大小时为 0–100；未知时为 `null`（环形为不确定进度样式） */
  progress: number | null;
  /** 与卡片角标一致：已安装工具时箭头旋转 */
  installed?: boolean;
}

export default function DowloadProgress({
  phase,
  progress,
  installed = false,
}: DowloadProgressProps) {
  const lucideArrowRef = useRef<HTMLDivElement>(null);
  const morphPathRef = useRef<SVGPathElement>(null);
  const progressCircleRef = useRef<SVGCircleElement>(null);
  const checkRef = useRef<SVGPathElement>(null);

  const breathTweenRef = useRef<gsap.core.Tween | null>(null);
  const indeterminateTweenRef = useRef<gsap.core.Tween | null>(null);
  const introGuardRef = useRef(false);

  const prevPhaseRef = useRef<DownloadPhase>(phase);
  const [showAfterComplete, setShowAfterComplete] = useState(false);

  const { arrowToWave, waveToCheck } = useMemo(
    () => ({
      arrowToWave: interpolate(ARROW_PATH, WAVE_PATH),
      waveToCheck: interpolate(WAVE_PATH, CHECK_PATH),
    }),
    [],
  );

  const showOverlay =
    phase === DownloadPhase.Downloading ||
    (phase === DownloadPhase.Completed && showAfterComplete);

  const pctLabel =
    phase === DownloadPhase.Downloading
      ? progress == null
        ? "…"
        : `${Math.round(clampPct(progress))}%`
      : phase === DownloadPhase.Completed
        ? "100%"
        : "0%";

  useLayoutEffect(() => {
    const circle = progressCircleRef.current;
    const check = checkRef.current;
    const morph = morphPathRef.current;
    if (!circle || !check || !morph) return;

    gsap.set(circle, {
      strokeDasharray: CIRCUMFERENCE,
      strokeDashoffset: CIRCUMFERENCE,
      opacity: 0,
    });
    gsap.set(check, { opacity: 0 });
    gsap.set(morph, {
      attr: { d: ARROW_PATH },
      scaleY: 1,
      y: 0,
      opacity: 0,
      transformOrigin: "center center",
    });
    const arrowEl = lucideArrowRef.current;
    if (arrowEl) {
      gsap.set(arrowEl, {
        opacity: 1,
        scaleY: 1,
        transformOrigin: "center center",
      });
    }
  }, []);

  const killBreath = () => {
    breathTweenRef.current?.kill();
    breathTweenRef.current = null;
  };

  const killIndeterminate = () => {
    indeterminateTweenRef.current?.kill();
    indeterminateTweenRef.current = null;
  };

  /** 根据外部进度更新圆环（下载中） */
  useEffect(() => {
    const circle = progressCircleRef.current;
    if (!circle || phase !== DownloadPhase.Downloading) return;

    if (progress != null) {
      killIndeterminate();
      const p = clampPct(progress);
      gsap.set(circle, {
        strokeDasharray: `${CIRCUMFERENCE} ${CIRCUMFERENCE}`,
        strokeDashoffset: CIRCUMFERENCE * (1 - p / 100),
      });
      return;
    }

    killIndeterminate();
    const seg = CIRCUMFERENCE * 0.22;
    gsap.set(circle, {
      strokeDasharray: `${seg} ${CIRCUMFERENCE}`,
      strokeDashoffset: 0,
    });
    indeterminateTweenRef.current = gsap.to(circle, {
      strokeDashoffset: -CIRCUMFERENCE,
      duration: 1.1,
      ease: "none",
      repeat: -1,
    });

    return () => {
      killIndeterminate();
    };
  }, [phase, progress]);

  /** 阶段转换：开场 / 收尾 / 清理 */
  useEffect(() => {
    const morph = morphPathRef.current;
    const circle = progressCircleRef.current;
    const check = checkRef.current;
    if (!morph || !circle || !check) return;

    const prev = prevPhaseRef.current;
    let cleanup: (() => void) | undefined;

    try {
      if (phase === DownloadPhase.Idle || phase === DownloadPhase.Error) {
        killBreath();
        killIndeterminate();
        introGuardRef.current = false;
        setShowAfterComplete(false);
        gsap.killTweensOf(
          [morph, circle, check, lucideArrowRef.current].filter(Boolean),
        );
        gsap.set(morph, {
          attr: { d: ARROW_PATH },
          scaleY: 1,
          y: 0,
          opacity: 0,
          transformOrigin: "center center",
        });
        const arrowEl = lucideArrowRef.current;
        if (arrowEl) {
          gsap.set(arrowEl, {
            opacity: 1,
            scaleY: 1,
            transformOrigin: "center center",
          });
        }
        gsap.set(circle, {
          opacity: 0,
          strokeDasharray: `${CIRCUMFERENCE} ${CIRCUMFERENCE}`,
          strokeDashoffset: CIRCUMFERENCE,
        });
        gsap.set(check, { opacity: 0 });
      } else if (
        phase === DownloadPhase.Downloading &&
        prev !== DownloadPhase.Downloading
      ) {
        if (!introGuardRef.current) {
          introGuardRef.current = true;
          killBreath();
          killIndeterminate();

          const arrowEl = lucideArrowRef.current;

          const tl = gsap.timeline({
            onComplete: () => {
              breathTweenRef.current = gsap.to(morph, {
                y: -2,
                repeat: -1,
                yoyo: true,
                duration: 0.6,
                ease: "sine.inOut",
              });
            },
          });

          gsap.set(morph, { opacity: 0 });
          if (arrowEl) {
            gsap.set(arrowEl, { opacity: 1, scaleY: 1 });
          }

          if (arrowEl) {
            tl.to(arrowEl, {
              scaleY: 0.8,
              transformOrigin: "center center",
              duration: 0.18,
              ease: "power2.out",
            });
            tl.to(arrowEl, {
              opacity: 0,
              duration: 0.2,
              ease: "power2.inOut",
            });
          }

          tl.to(
            morph,
            { opacity: 1, duration: 0.12, ease: "none" },
            arrowEl ? "-=0.12" : "0",
          );

          tl.to(
            { t: 0 },
            {
              t: 1,
              duration: 0.55,
              ease: "power2.inOut",
              onUpdate() {
                const t = (this.targets()[0] as { t: number }).t;
                morph.setAttribute("d", arrowToWave(t));
              },
            },
          );

          tl.to(circle, { opacity: 1, duration: 0.2 }, "-=0.2");

          cleanup = () => {
            tl.kill();
            killBreath();
          };
        }
      } else if (
        phase === DownloadPhase.Completed &&
        prev === DownloadPhase.Downloading
      ) {
        introGuardRef.current = false;
        setShowAfterComplete(true);
        killBreath();
        killIndeterminate();

        const tl = gsap.timeline({
          onComplete: () => {
            window.setTimeout(() => setShowAfterComplete(false), 900);
          },
        });

        tl.to(morph, { y: 0, duration: 0.2, ease: "power2.out" });
        tl.to(
          { t: 0 },
          {
            t: 1,
            duration: 0.5,
            ease: "power2.inOut",
            onUpdate() {
              const t = (this.targets()[0] as { t: number }).t;
              morph.setAttribute("d", waveToCheck(t));
            },
          },
        );
        tl.to(check, { opacity: 1, duration: 0.2 }, "-=0.05");
        tl.set(circle, {
          strokeDasharray: `${CIRCUMFERENCE} ${CIRCUMFERENCE}`,
          strokeDashoffset: 0,
          opacity: 1,
        });

        cleanup = () => {
          tl.kill();
        };
      }
    } finally {
      prevPhaseRef.current = phase;
    }

    return cleanup;
  }, [phase, arrowToWave, waveToCheck]);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={
        progress == null ? undefined : Math.round(clampPct(progress))
      }
      aria-busy={phase === DownloadPhase.Downloading}
      aria-label="Download progress"
      className={cn(
        "absolute inset-0 z-30 flex items-center justify-center pointer-events-auto w-full h-full",
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-[#2962ff]",
          "shadow-lg ring-1 ring-white/10",
          phase === DownloadPhase.Downloading
            ? "w-full h-full"
            : "h-10 w-10 rounded-full",
        )}
      >
        <div
          ref={lucideArrowRef}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          aria-hidden
        >
          <ArrowDown
            className={cn(
              "shrink-0 text-white",
              installed && "rotate-270",
            )}
            size={30}
            strokeWidth={2.25}
          />
        </div>
        {phase === DownloadPhase.Downloading && (
          <svg
            className="absolute inset-0 block"
            width="180"
            height="180"
            viewBox="0 0 160 160"
          >
            <circle
              cx="80"
              cy="80"
              r={RADIUS}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="5"
              fill="none"
            />

            <circle
              ref={progressCircleRef}
              cx="80"
              cy="80"
              r={RADIUS}
              stroke="#fff"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />

            <path
              ref={morphPathRef}
              d={ARROW_PATH}
              stroke="#fff"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <text
              x="80"
              y="120"
              textAnchor="middle"
              fill="#fff"
              fontSize="20"
              fontWeight="700"
              style={{ fontFamily: "sans-serif" }}
            >
              {pctLabel}
            </text>

            <path
              ref={checkRef}
              d={CHECK_PATH}
              stroke="#fff"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
