import { success } from "@/lib/api/responses";
import { validatedRoute } from "@/lib/api/route-handlers";
import { getPlanDeps } from "@/lib/plans/plan-deps";
import { refinePlan } from "@/lib/plans/plan-service";
import { RefinePlanBodySchema } from "@/lib/validation/refine-request";

export const POST = validatedRoute<typeof RefinePlanBodySchema, { id: string }>(
  RefinePlanBodySchema,
  async ({ instruction }, { id }) =>
    success(await refinePlan(await getPlanDeps(), id, instruction)),
);
