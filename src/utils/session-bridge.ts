import { listen } from "@tauri-apps/api/event";

import { SESSION_CHANGED_EVENT } from "@/config/window-events";
import type { AppStore } from "@/store";
import { changeCurrentLanguageAction } from "@/store/modules/app";
import type { Languages } from "@/store/modules/app/types";

export type SessionChangedPayload = {
  currentLanguage: Languages;
};

export function applySessionToStore(store: AppStore, payload: SessionChangedPayload) {
  const lang = payload.currentLanguage;
  if (lang === "cn" || lang === "en") {
    store.dispatch(changeCurrentLanguageAction(lang));
  }
}

/**
 * 监听 Rust 广播的 session/changed（跨 Webview IPC）。
 * 首次拉取在 InitGuard 完成，避免与 LanguageGuard 竞态。
 */
export function initSessionBridge(store: AppStore): () => void {
  let unlisten: (() => void) | undefined;

  void listen<SessionChangedPayload>(SESSION_CHANGED_EVENT, (event) => {
    applySessionToStore(store, event.payload);
  }).then((fn) => {
    unlisten = fn;
  });

  return () => {
    unlisten?.();
  };
}
