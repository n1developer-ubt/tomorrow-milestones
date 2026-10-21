import { z } from "zod";
import { MilestoneSchema } from "./milestone";

export type ReviewCommand = z.infer<typeof ReviewCommandSchema>;

const MilestoneId = z.string().min(1);

export const ReviewCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("setStatus"),
    milestoneId: MilestoneId,
    status: z.enum(["pending", "accepted", "rejected"]),
  }),
  z.object({
    type: z.literal("edit"),
    milestoneId: MilestoneId,
    text: MilestoneSchema,
  }),
  z.object({ type: z.literal("revert"), milestoneId: MilestoneId }),
  z.object({ type: z.literal("restoreRemoved"), milestoneId: MilestoneId }),
]);
