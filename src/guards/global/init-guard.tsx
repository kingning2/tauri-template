"use client";

import { useEffect, useState } from "react";
import { useStore } from "react-redux";

import { getAppSession } from "@/cmd/session";
import type { AppStore } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { changeInitializedAction } from "@/store/modules/app";
import { applySessionToStore } from "@/utils/session-bridge";

export default function InitGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const store = useStore() as AppStore;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    dispatch(changeInitializedAction(true));
  }, [dispatch]);

  useEffect(() => {
    getAppSession()
      .then((session) => applySessionToStore(store, session))
      .catch(() => {
        /* 非 Tauri：沿用 Redux 默认语言 */
      })
      .finally(() => setReady(true));
  }, [store]);

  if (!ready) return null;

  return <>{children}</>;
}
