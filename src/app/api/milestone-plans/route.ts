import { getLlm } from "@/lib/ai/chat-model";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import { success } from "@/lib/api/responses";
import { validatedRoute } from "@/lib/api/route-handlers";
import { getMilestonePlanRepository } from "@/lib/storage";
import { SaveMilestonePlanRequestSchema } from "@/lib/validation/milestone-plan";

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
