import { getLlm } from "@/lib/ai/chat-model";
import { generateMilestones } from "@/lib/ai/milestone-ai";
import { success } from "@/lib/api/responses";
import { validatedRoute } from "@/lib/api/route-handlers";
import { GenerationRequestSchema } from "@/lib/validation/generation-request";

export const POST = validatedRoute(GenerationRequestSchema, async (data) =>
  success(await generateMilestones(getLlm(), data)),
);
