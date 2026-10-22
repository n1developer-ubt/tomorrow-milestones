import type { ReviewCard } from "@/lib/milestones/review";
import type { DraftMilestone, TokenUsage } from "@/lib/milestones/schemas";

export type PlanStatus = "draft" | "published";

export type MilestonePlan = {
  id: string;
  title: string;
  brief: string;
  status: PlanStatus;
  milestones: ReviewCard[];
  removed: DraftMilestone[];
  tokenUsage: TokenUsage;
  promptVersion: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

export type NewMilestonePlan = Omit<
  MilestonePlan,
  "id" | "createdAt" | "updatedAt"
>;

export type MilestonePlanDto = Omit<
  MilestonePlan,
  "createdAt" | "updatedAt" | "publishedAt"
> & {
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export interface MilestonePlanRepository {
  create(plan: NewMilestonePlan): Promise<MilestonePlan>;
  findById(id: string): Promise<MilestonePlan | null>;
  listLatest(limit: number): Promise<MilestonePlan[]>;
  update(plan: MilestonePlan): Promise<MilestonePlan>;
  delete(id: string): Promise<boolean>;
}

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
