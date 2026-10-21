"use client";

import { useTranslations } from "next-intl";

export function useTranslateKey(): (key: string) => string {
  const t = useTranslations();
  return (key) => (t.has(key as never) ? t(key as never) : key);
}
