import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import {
  acceptedCount,
  type MilestonePlanDto,
} from "@/lib/repository/repository";
import { DeletePlanButton } from "./delete-plan-button";
import { PlanStatusBadge } from "./plan-status-badge";

type PlanListProps = { plans: MilestonePlanDto[] };

export function PlanList({ plans }: PlanListProps) {
  const t = useTranslations("plansPage");
  const tNav = useTranslations("nav");
  const format = useFormatter();

  if (plans.length === 0) {
    return (
      <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
        <p className="font-semibold">{t("empty")}</p>
        <p className="text-muted-foreground text-sm">{t("emptyHint")}</p>
        <Link href="/new" className={buttonVariants({ size: "lg" })}>
          <Plus aria-hidden />
          {tNav("newPlan")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {plans.map((plan) => (
        <li
          key={plan.id}
          className="bg-card hover:border-primary/40 flex items-center gap-2 rounded-xl border pr-3 shadow-sm transition-all hover:shadow-md"
        >
          <Link
            href={`/plans/${plan.id}`}
            className="focus-visible:ring-ring/50 group flex min-w-0 flex-1 items-center gap-4 rounded-xl p-4 outline-none focus-visible:ring-2"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-foreground truncate font-semibold">
                  {plan.title}
                </span>
                <PlanStatusBadge status={plan.status} />
              </div>
              <span className="text-muted-foreground text-sm">
                {t("accepted", {
                  accepted: acceptedCount(plan),
                  total: plan.milestones.length,
                })}
                {" · "}
                {t("created", {
                  date: format.dateTime(new Date(plan.createdAt), {
                    dateStyle: "medium",
                  }),
                })}
              </span>
            </div>
            <ChevronRight
              className="text-muted-foreground size-5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <DeletePlanButton planId={plan.id} title={plan.title} />
        </li>
      ))}
    </ul>
  );
}
