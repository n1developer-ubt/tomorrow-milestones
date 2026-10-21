"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ClientError } from "@/lib/api/client";

type ErrorAlertProps = {
  error: ClientError;
  onDismiss: () => void;
};

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  const t = useTranslations("errors");

  return (
    <Alert
      variant="destructive"
      className="items-center *:[svg]:row-span-1 *:[svg]:translate-y-0"
    >
      <TriangleAlert aria-hidden />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        <span>{error.message ?? t("network")}</span>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {t("dismiss")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
