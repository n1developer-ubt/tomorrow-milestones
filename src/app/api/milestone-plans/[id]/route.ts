import { failure, success } from "@/lib/api/responses";
import { withErrorHandling } from "@/lib/api/route-handlers";
import { getMilestonePlanRepository } from "@/lib/storage";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(
  async (_request: Request, { params }: RouteContext) => {
    const { id } = await params;
    const repository = await getMilestonePlanRepository();
    const plan = await repository.findById(id);
    return plan ? success(plan) : failure(404, "not_found");
  },
);
