import { getRequestConfig } from "next-intl/server";
import messages from "../../messages/en.json";
import { DEFAULT_LOCALE } from "./locale";

export default getRequestConfig(async () => ({
  locale: DEFAULT_LOCALE,
  messages,
}));
