"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { DraftMilestone } from "@/lib/validation/milestone";

type RemovedMilestonesProps = {
  removed: DraftMilestone[];
  disabled: boolean;
  onRestore: (id: string) => void;
};

export function RemovedMilestones({
  removed,
  disabled,
  onRestore,
}: RemovedMilestonesProps) {
  const t = useTranslations("removed");
  if (removed.length === 0) return null;

  return (
    <section
      aria-labelledby="removed-heading"
      className="bg-card/50 flex flex-col gap-2 rounded-xl border border-dashed p-4"
    >
      <h3
        id="removed-heading"
        className="text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
      >
        {t("heading")}
        <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-[11px]">
          {removed.length}
        </span>
      </h3>
      <ul className="flex flex-col gap-2">
        {removed.map((milestone) => (
          <li
            key={milestone.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-muted-foreground line-through">
              {milestone.title}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => onRestore(milestone.id)}
            >
              <RotateCcw aria-hidden />
              {t("restore")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
