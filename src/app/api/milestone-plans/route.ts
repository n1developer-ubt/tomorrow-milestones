import { getLlm } from "@/lib/ai/chat-model";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import { success } from "@/lib/api/responses";
import { validatedQueryRoute, validatedRoute } from "@/lib/api/route-handlers";
import { getMilestonePlanRepository } from "@/lib/storage";
import {
  ListMilestonePlansQuerySchema,
  SaveMilestonePlanRequestSchema,
} from "@/lib/validation/milestone-plan";

export const GET = validatedQueryRoute(
  ListMilestonePlansQuerySchema,
  async ({ limit }) => {
    const repository = await getMilestonePlanRepository();
    return success(await repository.listLatest(limit));
  },
);

export const POST = validatedRoute(
  SaveMilestonePlanRequestSchema,
  async ({ request, milestones, tokenUsage }) => {
    const repository = await getMilestonePlanRepository();
    const plan = await repository.create({
      ...request,
      milestones,
      tokenUsage,
      promptVersion: PROMPT_VERSION,
      model: getLlm().modelName,
    });
    return success(plan, 201);
  },
);
