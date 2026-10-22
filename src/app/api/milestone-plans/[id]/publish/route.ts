import { success, withErrorHandling } from "@/lib/api/api";
import { getMilestonePlanRepository } from "@/lib/repository";
import { publishPlan } from "@/lib/services/plan-service";

export const POST = withErrorHandling<{ id: string }>(
  async (_request, { id }) => {
    const repository = await getMilestonePlanRepository();
    return success(await publishPlan({ repository }, id));
  },
);
