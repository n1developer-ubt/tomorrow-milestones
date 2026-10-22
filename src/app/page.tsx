import { getTranslations } from "next-intl/server";
import { PlanList } from "@/components/plans/plan-list";
import { LIST_LIMITS } from "@/lib/milestones/schemas";
import { getMilestonePlanRepository } from "@/lib/repository";
import { toPlanDto } from "@/lib/repository/repository";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const t = await getTranslations("plansPage");
  const repository = await getMilestonePlanRepository();
  const plans = await repository.listLatest(LIST_LIMITS.max);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-indigo-dark text-3xl font-bold tracking-tight">
          {t("heading")}
        </h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </header>
      <PlanList plans={plans.map(toPlanDto)} />
    </main>
  );
}
