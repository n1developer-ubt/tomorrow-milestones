import { success, validatedQueryRoute, validatedRoute } from "@/lib/api/api";
import {
  GenerationRequestSchema,
  ListMilestonePlansQuerySchema,
} from "@/lib/milestones/schemas";
import { getMilestonePlanRepository } from "@/lib/repository";
import { getPlanDeps } from "@/lib/services/plan-deps";
import { createPlan } from "@/lib/services/plan-service";

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
