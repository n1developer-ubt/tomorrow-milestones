import { z } from "zod";
import { GenerationRequestSchema } from "./generation-request";
import { MILESTONE_LIMITS, MilestoneSchema } from "./milestone";
import { TokenUsageSchema } from "./token-usage";

export type SavedMilestone = z.infer<typeof SavedMilestoneSchema>;
export type SaveMilestonePlanRequest = z.infer<
  typeof SaveMilestonePlanRequestSchema
>;
export type ListMilestonePlansQuery = z.infer<
  typeof ListMilestonePlansQuerySchema
>;

export const LIST_LIMITS = { default: 20, max: 100 } as const;

export const SavedMilestoneSchema = MilestoneSchema.extend({
  edited: z.boolean().default(false),
});

export const SaveMilestonePlanRequestSchema = z.object({
  request: GenerationRequestSchema,
  milestones: z
    .array(SavedMilestoneSchema)
    .min(1, "validation.plan.noneAccepted")
    .max(MILESTONE_LIMITS.count.max, "validation.milestone.tooMany"),
  tokenUsage: TokenUsageSchema,
});

export const ListMilestonePlansQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, "validation.plan.limitInvalid")
    .max(LIST_LIMITS.max, "validation.plan.limitInvalid")
    .default(LIST_LIMITS.default),
});
