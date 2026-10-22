"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ClientError } from "@/lib/client/plan-client";

export function useErrorToast(): (error: ClientError) => void {
  const t = useTranslations("errors");
  return (error) => toast.error(error.message ?? t("network"));
}
