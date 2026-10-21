"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { useTranslateKey } from "@/i18n/use-translate-key";

type FieldProps = {
  id: string;
  label: string;
  length: number;
  max: number;
  error?: string;
  children: ReactNode;
};

export function Field({ id, label, length, max, error, children }: FieldProps) {
  const t = useTranslations("requestForm");
  const translateKey = useTranslateKey();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span
          className={
            length > max
              ? "text-destructive text-xs tabular-nums"
              : "text-muted-foreground text-xs tabular-nums"
          }
        >
          {t("characters", { count: length, max })}
        </span>
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
          {translateKey(error)}
        </p>
      )}
    </div>
  );
}
