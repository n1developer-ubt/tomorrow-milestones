import { failure, success } from "@/lib/api/responses";
import { withErrorHandling } from "@/lib/api/route-handlers";
import { getMilestonePlanRepository } from "@/lib/storage";

export const GET = withErrorHandling<{ id: string }>(
  async (_request, { id }) => {
    const repository = await getMilestonePlanRepository();
    const plan = await repository.findById(id);
    return plan ? success(plan) : failure(404, "not_found");
  },
);
