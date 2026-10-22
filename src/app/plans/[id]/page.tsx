import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DeletePlanButton } from "@/components/plans/delete-plan-button";
import { PlanEditor } from "@/components/plans/plan-editor";
import { toPlanDto } from "@/lib/plans/plan-dto";
import { getMilestonePlanRepository } from "@/lib/storage";

export const dynamic = "force-dynamic";

type PlanPageProps = { params: Promise<{ id: string }> };

export default async function PlanPage({ params }: PlanPageProps) {
  const { id } = await params;
  const t = await getTranslations("review");
  const repository = await getMilestonePlanRepository();
  const plan = await repository.findById(id);
  if (!plan) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="text-primary inline-flex w-fit items-center gap-1 text-sm font-medium hover:underline"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {t("back")}
        </Link>
        <DeletePlanButton planId={plan.id} title={plan.title} />
      </div>
      <PlanEditor initialPlan={toPlanDto(plan)} />
    </main>
  );
}
