import type { MilestonePlan } from "@/lib/storage/milestone-plan-repository";

export type MilestonePlanDto = Omit<
  MilestonePlan,
  "createdAt" | "updatedAt" | "publishedAt"
> & {
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export function toPlanDto(plan: MilestonePlan): MilestonePlanDto {
  return {
    ...plan,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    publishedAt: plan.publishedAt?.toISOString() ?? null,
  };
}

export function acceptedCount(plan: Pick<MilestonePlan, "milestones">): number {
  return plan.milestones.filter((card) => card.status === "accepted").length;
}
