import { createTranslator } from "next-intl";
import messages from "../../messages/en.json";
import { DEFAULT_LOCALE } from "./locale";

const translator = createTranslator({ locale: DEFAULT_LOCALE, messages });

export function translate(key: string): string {
  return translator.has(key as never) ? translator(key as never) : key;
}
