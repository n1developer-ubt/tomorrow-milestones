"use client";

import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { TokenUsage } from "@/lib/milestones/schemas";

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
  const percent = total ? Math.round((accepted / total) * 100) : 0;

  return (
    <div className="bg-card/95 supports-[backdrop-filter]:bg-card/85 fixed inset-x-0 bottom-0 z-10 border-t shadow-[0_-4px_20px_rgba(35,8,93,0.06)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5 text-sm">
          <div className="flex items-center gap-2" aria-live="polite">
            <span className="text-foreground font-semibold">
              {t("summary", { accepted, total })}
            </span>
            <span className="bg-muted-foreground/40 size-1.5 rounded-full" />
            <span className="text-muted-foreground font-mono text-xs">
              {percent}%
            </span>
          </div>
          <span className="text-muted-foreground text-xs">
            {t("draftSaved")} · {t("tokens", { count: usage.totalTokens })}
          </span>
          {pendingReview > 0 && accepted > 0 && (
            <span className="text-muted-foreground text-xs">
              {t("pendingHint")}
            </span>
          )}
        </div>
        <Button
          size="lg"
          className="from-violet to-primary shadow-primary/30 bg-gradient-to-b shadow-md"
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
    </div>
  );
}
