import { getLlm } from "@/lib/ai/chat-model";
import { refineMilestoneSet } from "@/lib/ai/milestone-ai";
import { success } from "@/lib/api/responses";
import { validatedRoute } from "@/lib/api/route-handlers";
import { RefineSetRequestSchema } from "@/lib/validation/refine-request";

export const POST = validatedRoute(RefineSetRequestSchema, async (data) =>
  success(await refineMilestoneSet(getLlm(), data)),
);
