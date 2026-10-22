import { useTranslations } from "next-intl";
import type { PlanStatus } from "@/lib/repository/repository";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<PlanStatus, string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

const DOT_STYLES: Record<PlanStatus, string> = {
  published: "bg-emerald-500",
  draft: "bg-indigo-400",
};

export function PlanStatusBadge({ status }: { status: PlanStatus }) {
  const t = useTranslations("plansPage.status");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status],
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", DOT_STYLES[status])}
        aria-hidden
      />
      {t(status)}
    </span>
  );
}
