"use client";

import { useEffect } from "react";
import { useStore } from "react-redux";

import type { AppSession } from "@/cmd/session";
import { SESSION_CHANGED_EVENT } from "@/config/window-events";
import type { AppStore } from "@/store";
import { changeCurrentLanguageAction } from "@/store/modules/app";
import { tauriOn } from "@/utils/tauri-event";

export function applySessionToStore(store: AppStore, session: AppSession) {
  const lang = session.currentLanguage;
  if (lang === "cn" || lang === "en") {
    store.dispatch(changeCurrentLanguageAction(lang));
  }
}

/** Rust `session/changed` → 各 Webview 本地 Redux */
export function useSessionChangedSubscription() {
  const store = useStore() as AppStore;

  useEffect(() => {
    return tauriOn<AppSession>(SESSION_CHANGED_EVENT, (event) => {
      applySessionToStore(store, event.payload);
    });
  }, [store]);
}
