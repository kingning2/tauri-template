"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { ModalFrame } from "@/components/modal";
import { useAppSelector } from "@/store/hooks";

function ModalWindowContent() {
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel") ?? "default";
  const { t } = useTranslation("modal_window");
  const currentLanguage = useAppSelector((state) => state.app.currentLanguage);
  const title = panel === "activate" ? t("activate_title") : t("title");

  return (
    <ModalFrame title={title}>
      <div className="text-foreground flex flex-col gap-3 text-sm">
        <p>{t("panel_label", { panel })}</p>
        <p className="text-muted-foreground">{t("shared_session", { lang: currentLanguage })}</p>
        <p className="text-muted-foreground text-xs">{t("hint")}</p>
      </div>
    </ModalFrame>
  );
}

export default function ModalWindowPage() {
  return (
    <Suspense fallback={null}>
      <ModalWindowContent />
    </Suspense>
  );
}
