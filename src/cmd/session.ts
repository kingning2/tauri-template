import { invokeWrapper } from ".";

import type { Languages } from "@/store/modules/app/types";
import type { AppSession as GeneratedAppSession } from "@/generated/contracts";

/** 与 Rust `AppSession` 对齐；语言字段收窄为应用支持的语言。 */
export type AppSession = Omit<GeneratedAppSession, "currentLanguage"> & {
  currentLanguage: Languages;
};

export const getAppSession = () => invokeWrapper<AppSession>("get_app_session");
