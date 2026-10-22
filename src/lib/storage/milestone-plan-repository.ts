import type { ReviewCard } from "@/lib/review/review-reducer";
import type { DraftMilestone } from "@/lib/validation/milestone";
import type { TokenUsage } from "@/lib/validation/token-usage";

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

export interface MilestonePlanRepository {
  create(plan: NewMilestonePlan): Promise<MilestonePlan>;
  findById(id: string): Promise<MilestonePlan | null>;
  listLatest(limit: number): Promise<MilestonePlan[]>;
  update(plan: MilestonePlan): Promise<MilestonePlan>;
  delete(id: string): Promise<boolean>;
}
