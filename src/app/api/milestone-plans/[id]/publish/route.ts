import { success } from "@/lib/api/responses";
import { withErrorHandling } from "@/lib/api/route-handlers";
import { publishPlan } from "@/lib/plans/plan-service";
import { getMilestonePlanRepository } from "@/lib/storage";

export const POST = withErrorHandling<{ id: string }>(
  async (_request, { id }) => {
    const repository = await getMilestonePlanRepository();
    return success(await publishPlan({ repository }, id));
  },
);
