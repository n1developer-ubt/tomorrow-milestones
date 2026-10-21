import { z } from "zod";
import { MILESTONE_LIMITS } from "@/lib/validation/milestone";

const MilestoneOutput = z.object({
  title: z.string(),
  description: z.string(),
});

export const GeneratedOutput = z.object({
  milestones: z
    .array(MilestoneOutput)
    .min(MILESTONE_LIMITS.count.min)
    .max(MILESTONE_LIMITS.count.max),
});

export const RefinedSetOutput = z.object({
  milestones: z
    .array(MilestoneOutput.extend({ id: z.string().nullable() }))
    .min(MILESTONE_LIMITS.count.min)
    .max(MILESTONE_LIMITS.count.max),
});

export const RefinedMilestoneOutput = MilestoneOutput;
