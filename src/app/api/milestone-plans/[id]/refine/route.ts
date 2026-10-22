import { success, validatedRoute } from "@/lib/api/api";
import { RefinePlanBodySchema } from "@/lib/milestones/schemas";
import { getPlanDeps } from "@/lib/services/plan-deps";
import { refinePlan } from "@/lib/services/plan-service";

export const POST = validatedRoute<typeof RefinePlanBodySchema, { id: string }>(
  RefinePlanBodySchema,
  async ({ instruction }, { id }) =>
    success(await refinePlan(await getPlanDeps(), id, instruction)),
);
