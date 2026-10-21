import { z } from "zod";
import { GenerationRequestSchema } from "./generation-request";
import { DraftMilestoneSchema, MILESTONE_LIMITS } from "./milestone";

export type RefineSetRequest = z.infer<typeof RefineSetRequestSchema>;
export type RefineMilestoneRequest = z.infer<
  typeof RefineMilestoneRequestSchema
>;
export type RefineMode = z.infer<typeof RefineMode>;
export type RefinePlanBody = z.infer<typeof RefinePlanBodySchema>;
export type RefinePlanMilestoneBody = z.infer<
  typeof RefinePlanMilestoneBodySchema
>;

export const INSTRUCTION_LIMITS = { min: 3, max: 500 } as const;

const InstructionSchema = z
  .string()
  .trim()
  .min(INSTRUCTION_LIMITS.min, "validation.refine.instructionTooShort")
  .max(INSTRUCTION_LIMITS.max, "validation.refine.instructionTooLong");

const DraftMilestonesSchema = z
  .array(DraftMilestoneSchema)
  .min(1)
  .max(MILESTONE_LIMITS.count.max)
  .refine(
    (milestones) =>
      new Set(milestones.map((milestone) => milestone.id)).size ===
      milestones.length,
    "validation.milestone.duplicateIds",
  );

export const RefineSetRequestSchema = z.object({
  request: GenerationRequestSchema,
  milestones: DraftMilestonesSchema,
  instruction: InstructionSchema,
});

export const RefineMode = z.enum(["shorter", "longer", "custom"]);

export const RefineMilestoneRequestSchema = z
  .object({
    request: GenerationRequestSchema,
    milestones: DraftMilestonesSchema,
    targetId: z.string().min(1),
    mode: RefineMode,
    instruction: InstructionSchema.optional(),
  })
  .refine((value) => value.mode !== "custom" || value.instruction, {
    message: "validation.refine.instructionRequired",
    path: ["instruction"],
  })
  .refine((value) => value.milestones.some((m) => m.id === value.targetId), {
    message: "validation.refine.targetNotFound",
    path: ["targetId"],
  });

export const RefinePlanBodySchema = z.object({
  instruction: InstructionSchema,
});

export const RefinePlanMilestoneBodySchema = z
  .object({
    mode: RefineMode,
    instruction: InstructionSchema.optional(),
  })
  .refine((value) => value.mode !== "custom" || value.instruction, {
    message: "validation.refine.instructionRequired",
    path: ["instruction"],
  });
