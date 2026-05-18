"use client";

import gsap from "gsap";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ShadowCard } from "@/components/ui/shadow-card";
import {
  openToolArgsFromDownloadSpec,
  toolHasUniversalDownloadForPlatform,
  ToolInstallState,
  type HostDesktopPlatform,
  type ToolManifest,
} from "@/config/tools-manifest";
import { DownloadPhase } from "@/enums/download-phase";
import { useToolDownload } from "@/hooks/useToolDownload";
import { cn } from "@/lib/utils";
import { openToolExecutable } from "@/cmd/tools";
import DowloadProgress from "./dowload-progress";

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();

    // Safari 兼容：老版本可能没有 addEventListener/removeEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return prefersReducedMotion;
}

export interface DowloadCardRenderArgs {
  canDownload: boolean;
  busy: boolean;
  done: boolean;
  failed: boolean;
  error: string | null;
  interactive: boolean;
  startDownload: () => void;
}

export interface DowloadCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  tool: ToolManifest;
  hostPlatform: HostDesktopPlatform | null;
  onInstallStateRefresh?: () => void;
  title: string;
  isFeatured: boolean;
  isCompact: boolean;
  /** 大进度块背景渐变，与卡片小图标一致 */
  iconGradient: string;
  children: (args: DowloadCardRenderArgs) => ReactNode;
  /** 与原先 `ShadowCard` 内层之后的插槽一致（如卡片扩展区） */
  trailing?: ReactNode;
  toolInstallState?: ToolInstallState;
}

export default function DowloadCard({
  tool,
  toolInstallState,
  hostPlatform,
  onInstallStateRefresh,
  title,
  isFeatured,
  isCompact,
  iconGradient,
  children,
  trailing,
  className,
  ...shadowCardProps
}: DowloadCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const cardLayoutRef = useRef<HTMLDivElement>(null);
  /** 仅承载 translate(x,y)，避免与 scale 混在同一层矩阵里做测量 */
  const badgeMotionRef = useRef<HTMLDivElement>(null);
  /** 承载圆角壳与 scale / autoAlpha，便于用 offsetWidth/Height 测“内容盒” */
  const badgeVisualRef = useRef<HTMLDivElement>(null);
  const badgePositionDidInitRef = useRef(false);
  const [cardHovered, setCardHovered] = useState(false);
  const { phase, error, start, progressPercent } = useToolDownload();

  const canDownload =
    hostPlatform != null &&
    toolHasUniversalDownloadForPlatform(tool.downloadSpec, hostPlatform);

  const busy = phase === DownloadPhase.Downloading;
  const done = phase === DownloadPhase.Completed;
  const failed = phase === DownloadPhase.Error;
  const interactive = canDownload && !busy;

  const startDownload = () => {
    if (!interactive || !hostPlatform) return;
    void start(tool, hostPlatform, {
      onCompleted: onInstallStateRefresh,
    });
  };

  const renderArgs: DowloadCardRenderArgs = {
    canDownload,
    busy,
    done,
    failed,
    error,
    interactive,
    startDownload,
  };

  const progressView =
    !canDownload || !busy ? null : (
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col items-center justify-center py-2 text-center",
          isCompact ? "gap-2.5 py-1.5 sm:py-2" : "gap-3 sm:gap-4 sm:py-3",
        )}
      />
    );

  /** 角标位移动画：仅用 GSAP 写 transform（x/y 像素），避免 top/right 与 CSS transition 抢 transform */
  // useLayoutEffect(() => {
  //   const card = cardLayoutRef.current;
  //   const motion = badgeMotionRef.current;
  //   const visual = badgeVisualRef.current;
  //   if (!card || !motion || !visual) return;

  //   const pad = 8;
  //   let raf = 0;

  //   const measureTransform = () => {
  //     const pw = card.clientWidth;
  //     const ph = card.clientHeight;
  //     const bw = visual.offsetWidth;
  //     const bh = visual.offsetHeight;
  //     if (pw <= 0 || ph <= 0 || bw <= 0 || bh <= 0) return null;

  //     const dir = getComputedStyle(card).direction;
  //     const isRtl = dir === "rtl";
  //     const toCenter = phase === DownloadPhase.Downloading;

  //     if (toCenter) {
  //       // 等价于父宽 50% 与自宽 50% 的差：0.5 * pw - 0.5 * bw（未用 xPercent 是为了避免与像素角点状态混算）
  //       const x = (pw - bw) / 2;
  //       const y = (ph - bh) / 2;
  //       return { x, y, xPercent: 0, yPercent: 0 };
  //     }

  //     const x = isRtl ? pad : pw - bw - pad;
  //     const y = pad;
  //     return { x, y, xPercent: 0, yPercent: 0 };
  //   };

  //   const applyPosition = (animate: boolean) => {
  //     const t = measureTransform();
  //     if (!t) return;

  //     gsap.killTweensOf(motion);

  //     if (!badgePositionDidInitRef.current) {
  //       gsap.set(motion, t);
  //       badgePositionDidInitRef.current = true;
  //       return;
  //     }

  //     if (prefersReducedMotion || !animate) {
  //       gsap.set(motion, t);
  //       return;
  //     }

  //     gsap.to(motion, {
  //       ...t,
  //       duration: 0.36,
  //       ease: "power3.inOut",
  //       overwrite: "auto",
  //     });
  //   };

  //   applyPosition(
  //     !badgePositionDidInitRef.current ? false : !prefersReducedMotion,
  //   );

  //   if (!badgePositionDidInitRef.current) {
  //     cancelAnimationFrame(raf);
  //     raf = requestAnimationFrame(() => {
  //       applyPosition(
  //         !badgePositionDidInitRef.current ? false : !prefersReducedMotion,
  //       );
  //     });
  //   }

  //   const schedule = () => {
  //     cancelAnimationFrame(raf);
  //     raf = requestAnimationFrame(() => {
  //       applyPosition(!prefersReducedMotion);
  //     });
  //   };

  //   const ro = new ResizeObserver(() => schedule());
  //   ro.observe(card);
  //   ro.observe(visual);

  //   return () => {
  //     cancelAnimationFrame(raf);
  //     ro.disconnect();
  //     gsap.killTweensOf(motion);
  //   };
  // }, [phase, prefersReducedMotion]);

  /** 显隐/缩放：与位移动画分离，避免同一节点上 React style 与 GSAP 争用 transform */
  useLayoutEffect(() => {
    const visual = badgeVisualRef.current;
    if (!visual) return;

    const visible = cardHovered || phase === DownloadPhase.Downloading;
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

    gsap.to(visual, {
      ...next,
      duration: 0.45,
      ease: "power3.out",
      overwrite: "auto",
    });

    return () => {
      gsap.killTweensOf(visual);
    };
  }, [cardHovered, phase, prefersReducedMotion]);

  return (
    <div
      ref={cardLayoutRef}
      className={cn("relative h-full min-h-0", className)}
      onPointerEnter={() => setCardHovered(true)}
      onPointerLeave={() => setCardHovered(false)}
    >
      <ShadowCard
        {...shadowCardProps}
        role={interactive ? "button" : shadowCardProps.role}
        tabIndex={interactive ? 0 : shadowCardProps.tabIndex}
        onClick={() => {
          if (!toolInstallState?.installed) {
            startDownload();
            return;
          }
          // 打开（Rust 侧仅从注册表 InstallPath + 相对主程序名解析，不经由嵌入清单按 toolId 查找）
          void openToolExecutable(
            openToolArgsFromDownloadSpec(tool.downloadSpec),
          );
        }}
        className={cn(
          "relative flex h-full min-h-0 flex-col overflow-hidden",
          canDownload && "cursor-pointer",
        )}
      >
        <div
          className={cn(
            "flex min-h-0 flex-col gap-2 p-3 sm:p-4 h-full",
            isCompact && "gap-1.5 p-2.5 sm:p-3",
          )}
        >
          {progressView ?? <>{children(renderArgs)}</>}
        </div>
        {trailing}
        {canDownload && (
          <div
            ref={badgeMotionRef}
            aria-hidden
            className={cn(
              "pointer-events-none absolute z-20 will-change-transform",
              phase === DownloadPhase.Downloading
                ? "w-full h-full"
                : "right-[30px] top-[30px]",
            )}
          >
            <div
              ref={badgeVisualRef}
              className="rounded-full bg-[#0a84ff] p-0.5 w-full h-full"
            >
              <DowloadProgress
                phase={phase}
                progress={progressPercent}
                installed={!!toolInstallState?.installed}
              />
            </div>
          </div>
        )}
      </ShadowCard>
    </div>
  );
}
