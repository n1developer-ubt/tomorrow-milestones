import { getRequestConfig } from "next-intl/server";
import messages from "../../messages/en.json";

export const DEFAULT_LOCALE = "en";

export default getRequestConfig(async () => ({
  locale: DEFAULT_LOCALE,
  messages,
}));
