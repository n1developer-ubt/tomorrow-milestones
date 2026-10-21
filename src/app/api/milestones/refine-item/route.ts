import { getLlm } from "@/lib/ai/chat-model";
import { refineMilestone } from "@/lib/ai/milestone-ai";
import { success } from "@/lib/api/responses";
import { validatedRoute } from "@/lib/api/route-handlers";
import { RefineMilestoneRequestSchema } from "@/lib/validation/refine-request";

export const POST = validatedRoute(RefineMilestoneRequestSchema, async (data) =>
  success(await refineMilestone(getLlm(), data)),
);
