"use client";

import { useEffect } from "react";
import { useStore } from "react-redux";

import { isTauriRuntime } from "@/cmd";
import type { AppSession } from "@/cmd/session";
import {
  getToolsDownloadState,
  refreshToolsInstallState as refreshToolsInstallStateCmd
} from "@/cmd/tools";
import {
  SESSION_CHANGED_EVENT,
  TOOLS_DOWNLOAD_CHANGED_EVENT,
  TOOLS_INSTALL_STATE_CHANGED_EVENT,
  type ToolsDownloadSnapshot,
  type ToolsInstallStateChangedPayload
} from "@/config/window-events";
import type { ToolInstallState } from "@/config/tools-manifest";
import type { AppStore } from "@/store";
import { changeCurrentLanguageAction } from "@/store/modules/app";
import { downloadSnapshotApplied } from "@/store/modules/download";
import { tauriOn } from "@/utils/tauri-event";

// --- Session → Redux ---

export function applySessionToStore(store: AppStore, session: AppSession) {
  const lang = session.currentLanguage;
  if (lang === "cn" || lang === "en") {
    store.dispatch(changeCurrentLanguageAction(lang));
  }
}

function useSessionChangedSubscription() {
  const store = useStore() as AppStore;

  useEffect(() => {
    return tauriOn<AppSession>(SESSION_CHANGED_EVENT, (event) => {
      applySessionToStore(store, event.payload);
    });
  }, [store]);
}

// --- 工具下载态 → Redux ---

export function applyToolsDownloadSnapshotToStore(
  store: AppStore,
  snapshot: ToolsDownloadSnapshot
) {
  store.dispatch(downloadSnapshotApplied({ byToolId: snapshot.byToolId }));
}

function useToolsDownloadStateSubscription() {
  const store = useStore() as AppStore;

  useEffect(() => {
    if (!isTauriRuntime()) return;

    void getToolsDownloadState().then((snapshot) => {
      applyToolsDownloadSnapshotToStore(store, snapshot);
    });

    return tauriOn<ToolsDownloadSnapshot>(TOOLS_DOWNLOAD_CHANGED_EVENT, (event) => {
      applyToolsDownloadSnapshotToStore(store, event.payload);
    });
  }, [store]);
}

// --- 工具安装态（页面本地 state，非 Redux）---

export function installStateByToolId(list: ToolInstallState[]): Record<string, ToolInstallState> {
  return Object.fromEntries(list.map((s) => [s.toolId, s]));
}

/** 重新扫描安装态并由 Rust 广播到所有 Webview */
export async function refreshToolsInstallStateAcrossWindows(): Promise<ToolInstallState[]> {
  return refreshToolsInstallStateCmd();
}

export function useToolsInstallStateSync(
  setInstallByToolId: (map: Record<string, ToolInstallState>) => void
) {
  useEffect(() => {
    return tauriOn<ToolsInstallStateChangedPayload>(TOOLS_INSTALL_STATE_CHANGED_EVENT, (event) => {
      setInstallByToolId(installStateByToolId(event.payload));
    });
  }, [setInstallByToolId]);
}

// --- Provider 内挂载 ---

/** 在 `TauriEventProvider` 内挂载的跨 Webview 订阅（会话 + 下载 Redux） */
export function CrossWebviewSyncSubscriptions() {
  useSessionChangedSubscription();
  useToolsDownloadStateSubscription();
  return null;
}
