"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";

import AppErrorView from "@/components/error/app-error-view";
import { closeModalWindow } from "@/cmd/window";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  const handleBack = () => {
    void closeModalWindow(getCurrentWindow().label).catch(() => {
      getCurrentWindow()
        .close()
        .catch(() => undefined);
    });
  };

  return (
    <AppErrorView
      error={error}
      reset={reset}
      logPrefix="modal-window err capture"
      onBack={handleBack}
      backLabelKey="error_close"
    />
  );
}
