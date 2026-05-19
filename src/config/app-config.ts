import type { Languages } from "@/store/modules/app/types";
import type { LocalCacheKey } from "@/utils/cache-types";

import { cacheKeys } from "@/config/cache-keys";

export type AppConfig = {
  titleBarHeight: number;
  mainWindowGlobalGg: string;
  languageCacheKey: LocalCacheKey;
  defaultLanguage: Languages;
  supportLanguages: Array<{ label: string; value: Languages }>;
};

export const appConfig: AppConfig = {
  titleBarHeight: 40,
  mainWindowGlobalGg: "#f0f4f8",
  languageCacheKey: cacheKeys.language,
  defaultLanguage: "cn",
  supportLanguages: [
    { label: "繁體中文", value: "cn" },
    { label: "English", value: "en" }
  ]
};
