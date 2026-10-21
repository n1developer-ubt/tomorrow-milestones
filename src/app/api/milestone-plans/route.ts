import { success } from "@/lib/api/responses";
import { validatedQueryRoute, validatedRoute } from "@/lib/api/route-handlers";
import { getPlanDeps } from "@/lib/plans/plan-deps";
import { createPlan } from "@/lib/plans/plan-service";
import { getMilestonePlanRepository } from "@/lib/storage";
import { GenerationRequestSchema } from "@/lib/validation/generation-request";
import { ListMilestonePlansQuerySchema } from "@/lib/validation/milestone-plan";

export const GET = validatedQueryRoute(
  ListMilestonePlansQuerySchema,
  async ({ limit }) => {
    const repository = await getMilestonePlanRepository();
    return success(await repository.listLatest(limit));
  },
);

export const POST = validatedRoute(GenerationRequestSchema, async (request) =>
  success(await createPlan(await getPlanDeps(), request), 201),
);
