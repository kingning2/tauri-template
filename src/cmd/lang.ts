import { invokeWrapper } from ".";

import type { Languages } from "@/store/modules/app/types";

export async function getLanguageResourceBundle(currentLanguage: Languages) {
  return invokeWrapper<Record<string, Record<string, unknown>>>("get_language_resource_bundle", {
    language: currentLanguage
  });
}

export async function getLang(): Promise<Languages> {
  return invokeWrapper<Languages>("get_lang");
}

export async function setLang(lang: Languages): Promise<void> {
  await invokeWrapper<void>("set_lang", { lang });
}
