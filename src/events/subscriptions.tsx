"use client";

import { useSessionChangedSubscription } from "@/events/session";

/** 在 TauriEventProvider 内挂载的跨 Webview 事件订阅 */
export function TauriEventSubscriptions() {
  useSessionChangedSubscription();
  return null;
}
