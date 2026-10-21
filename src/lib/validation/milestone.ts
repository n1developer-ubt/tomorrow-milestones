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
    .min(MILESTONE_LIMITS.title.min, "Title is too short")
    .max(MILESTONE_LIMITS.title.max, "Title is too long"),
  description: z
    .string()
    .trim()
    .min(MILESTONE_LIMITS.description.min, "Description needs more detail")
    .max(MILESTONE_LIMITS.description.max, "Description is too long"),
});

export const GeneratedMilestonesSchema = z.object({
  milestones: z
    .array(MilestoneSchema)
    .min(MILESTONE_LIMITS.count.min, "Too few milestones")
    .max(MILESTONE_LIMITS.count.max, "Too many milestones"),
});

export type Milestone = z.infer<typeof MilestoneSchema>;
export type GeneratedMilestones = z.infer<typeof GeneratedMilestonesSchema>;
