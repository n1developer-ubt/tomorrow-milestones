import { z } from "zod";

export const MILESTONE_LIMITS = {
  title: { min: 5, max: 80 },
  description: { min: 40, max: 400 },
  count: { min: 2, max: 6 },
} as const;

export const MilestoneSchema = z.object({
  title: z
    .string()
    .trim()
    .min(MILESTONE_LIMITS.title.min, "validation.milestone.titleTooShort")
    .max(MILESTONE_LIMITS.title.max, "validation.milestone.titleTooLong"),
  description: z
    .string()
    .trim()
    .min(
      MILESTONE_LIMITS.description.min,
      "validation.milestone.descriptionTooShort",
    )
    .max(
      MILESTONE_LIMITS.description.max,
      "validation.milestone.descriptionTooLong",
    ),
});

export const GeneratedMilestonesSchema = z.object({
  milestones: z
    .array(MilestoneSchema)
    .min(MILESTONE_LIMITS.count.min, "validation.milestone.tooFew")
    .max(MILESTONE_LIMITS.count.max, "validation.milestone.tooMany"),
});

export const DraftMilestoneSchema = MilestoneSchema.extend({
  id: z.string().min(1),
  locked: z.boolean().default(false),
});

export type Milestone = z.infer<typeof MilestoneSchema>;
export type DraftMilestone = z.infer<typeof DraftMilestoneSchema>;
export type GeneratedMilestones = z.infer<typeof GeneratedMilestonesSchema>;
