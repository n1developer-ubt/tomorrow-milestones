import { success } from "@/lib/api/responses";
import { validatedRoute } from "@/lib/api/route-handlers";
import { reviewPlan } from "@/lib/plans/plan-service";
import { getMilestonePlanRepository } from "@/lib/storage";
import { ReviewCommandSchema } from "@/lib/validation/review-command";

export const POST = validatedRoute<typeof ReviewCommandSchema, { id: string }>(
  ReviewCommandSchema,
  async (command, { id }) => {
    const repository = await getMilestonePlanRepository();
    return success(await reviewPlan({ repository }, id, command));
  },
);
