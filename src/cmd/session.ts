import { invokeWrapper } from ".";

import type { Languages } from "@/store/modules/app/types";

export type AppSession = {
  currentLanguage: Languages;
};

export const getAppSession = () => invokeWrapper<AppSession>("get_app_session");
