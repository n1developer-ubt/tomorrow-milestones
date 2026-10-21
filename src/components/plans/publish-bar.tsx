"use client";

import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { TokenUsage } from "@/lib/validation/token-usage";

type PublishBarProps = {
  accepted: number;
  total: number;
  pendingReview: number;
  usage: TokenUsage;
  publishing: boolean;
  disabled: boolean;
  onPublish: () => void;
};

export function PublishBar({
  accepted,
  total,
  pendingReview,
  usage,
  publishing,
  disabled,
  onPublish,
}: PublishBarProps) {
  const t = useTranslations("publish");

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 flex flex-col gap-3 border-t py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col text-sm">
        <span className="font-semibold" aria-live="polite">
          {t("summary", { accepted, total })}
        </span>
        <span className="text-muted-foreground">
          {t("draftSaved")} · {t("tokens", { count: usage.totalTokens })}
        </span>
        {pendingReview > 0 && accepted > 0 && (
          <span className="text-muted-foreground">{t("pendingHint")}</span>
        )}
      </div>
      <Button
        size="lg"
        disabled={disabled || accepted === 0}
        onClick={onPublish}
      >
        {publishing ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <Send aria-hidden />
        )}
        {publishing ? t("publishing") : t("submit")}
      </Button>
    </div>
  );
}
