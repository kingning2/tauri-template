"use client";

import { useCallback, useEffect, useRef } from "react";

import { useTauriEventApi } from "@/providers/tauri-event-provider";
import type { TauriEventHandler, TauriEventScope } from "@/utils/tauri-event";

export function useTauriEmit() {
  const { emit, emitTo } = useTauriEventApi();
  return { emit, emitTo };
}

/**
 * 订阅 Rust（或其他 Webview）发来的事件；组件卸载时自动取消监听。
 */
export function useTauriEventListener<T>(
  event: string,
  handler: TauriEventHandler<T>,
  options?: { scope?: TauriEventScope }
) {
  const { onScoped } = useTauriEventApi();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  const scope = options?.scope ?? "global";

  useEffect(() => {
    const wrapped: TauriEventHandler<T> = (e) => handlerRef.current(e);
    return onScoped(event, wrapped, scope);
  }, [event, onScoped, scope]);
}

/** 从事件中取出 payload 的便捷 hook */
export function useTauriEventPayload<T>(
  event: string,
  onPayload: (payload: T) => void,
  options?: { scope?: TauriEventScope }
) {
  const onPayloadRef = useRef(onPayload);

  useEffect(() => {
    onPayloadRef.current = onPayload;
  });

  const stableHandler = useCallback<TauriEventHandler<T>>((e) => {
    onPayloadRef.current(e.payload);
  }, []);

  useTauriEventListener(event, stableHandler, options);
}
