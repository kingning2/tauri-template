"use client";

import TitleBar from "@/components/title-bar";
import { ContentContainer } from "@/components/ui/content-container";
import GlobalBgGuard from "@/guards/main-window/global-bg-guard";
import { useAppSelector } from "@/store/hooks";

export default function MainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const titleBarHeight = useAppSelector((state) => state.app.titleBarHeight);

  return (
    <div className="main-window flex min-h-0 flex-1 flex-col">
      <GlobalBgGuard />

      <div className="relative z-10 shrink-0 flex flex-col h-full">
        <TitleBar height={titleBarHeight}  />
        <div className="flex flex-col overflow-hidden flex-1 p-3 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}
