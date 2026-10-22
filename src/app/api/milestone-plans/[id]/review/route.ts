import { success, validatedRoute } from "@/lib/api/api";
import { ReviewCommandSchema } from "@/lib/milestones/schemas";
import { getMilestonePlanRepository } from "@/lib/repository";
import { reviewPlan } from "@/lib/services/plan-service";

export const POST = validatedRoute<typeof ReviewCommandSchema, { id: string }>(
  ReviewCommandSchema,
  async (command, { id }) => {
    const repository = await getMilestonePlanRepository();
    return success(await reviewPlan({ repository }, id, command));
  },
);
