import type { SavedMilestone } from "@/lib/validation/milestone-plan";
import type { TokenUsage } from "@/lib/validation/token-usage";

export type MilestonePlan = {
  id: string;
  title: string;
  brief: string;
  milestones: SavedMilestone[];
  promptVersion: string;
  model: string;
  tokenUsage: TokenUsage;
  createdAt: Date;
};

export type NewMilestonePlan = Omit<MilestonePlan, "id" | "createdAt">;

export interface MilestonePlanRepository {
  create(plan: NewMilestonePlan): Promise<MilestonePlan>;
  findById(id: string): Promise<MilestonePlan | null>;
  listLatest(limit: number): Promise<MilestonePlan[]>;
}
