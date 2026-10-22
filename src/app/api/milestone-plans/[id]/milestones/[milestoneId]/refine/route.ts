import { success, validatedRoute } from "@/lib/api/api";
import { RefinePlanMilestoneBodySchema } from "@/lib/milestones/schemas";
import { getPlanDeps } from "@/lib/services/plan-deps";
import { refinePlanMilestone } from "@/lib/services/plan-service";

type Params = { id: string; milestoneId: string };

export const POST = validatedRoute<
  typeof RefinePlanMilestoneBodySchema,
  Params
>(RefinePlanMilestoneBodySchema, async (body, { id, milestoneId }) =>
  success(
    await refinePlanMilestone(await getPlanDeps(), id, milestoneId, body),
  ),
);
