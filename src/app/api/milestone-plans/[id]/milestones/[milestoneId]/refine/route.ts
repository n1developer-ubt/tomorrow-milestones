import { success } from "@/lib/api/responses";
import { validatedRoute } from "@/lib/api/route-handlers";
import { getPlanDeps } from "@/lib/plans/plan-deps";
import { refinePlanMilestone } from "@/lib/plans/plan-service";
import { RefinePlanMilestoneBodySchema } from "@/lib/validation/refine-request";

type Params = { id: string; milestoneId: string };

export const POST = validatedRoute<
  typeof RefinePlanMilestoneBodySchema,
  Params
>(RefinePlanMilestoneBodySchema, async (body, { id, milestoneId }) =>
  success(
    await refinePlanMilestone(await getPlanDeps(), id, milestoneId, body),
  ),
);
