import { z } from "zod";

export type Milestone = z.infer<typeof MilestoneSchema>;
export type DraftMilestone = z.infer<typeof DraftMilestoneSchema>;
export type GeneratedMilestones = z.infer<typeof GeneratedMilestonesSchema>;
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
export type RefineSetRequest = z.infer<typeof RefineSetRequestSchema>;
export type RefineMilestoneRequest = z.infer<
  typeof RefineMilestoneRequestSchema
>;
export type RefineMode = z.infer<typeof RefineMode>;
export type RefinePlanBody = z.infer<typeof RefinePlanBodySchema>;
export type RefinePlanMilestoneBody = z.infer<
  typeof RefinePlanMilestoneBodySchema
>;
export type ReviewCommand = z.infer<typeof ReviewCommandSchema>;
export type ListMilestonePlansQuery = z.infer<
  typeof ListMilestonePlansQuerySchema
>;
export type TokenUsage = z.infer<typeof TokenUsageSchema>;
export type ValidationResult<T> =
  { ok: true; value: T } | { ok: false; issues: string[] };
export type FieldErrors = Record<string, string>;

export const MILESTONE_LIMITS = {
  title: { min: 5, max: 80 },
  description: { min: 40, max: 400 },
  count: { min: 2, max: 6 },
} as const;

export const GENERATION_REQUEST_LIMITS = {
  title: { min: 5, max: 120 },
  brief: { min: 30, max: 4000 },
} as const;

export const INSTRUCTION_LIMITS = { min: 3, max: 500 } as const;

export const LIST_LIMITS = { default: 20, max: 100 } as const;

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

export const GenerationRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(
      GENERATION_REQUEST_LIMITS.title.min,
      "validation.request.titleTooShort",
    )
    .max(
      GENERATION_REQUEST_LIMITS.title.max,
      "validation.request.titleTooLong",
    ),
  brief: z
    .string()
    .trim()
    .min(
      GENERATION_REQUEST_LIMITS.brief.min,
      "validation.request.briefTooShort",
    )
    .max(
      GENERATION_REQUEST_LIMITS.brief.max,
      "validation.request.briefTooLong",
    ),
});

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
  z.object({ type: z.literal("acceptAll") }),
]);

export const ListMilestonePlansQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, "validation.plan.limitInvalid")
    .max(LIST_LIMITS.max, "validation.plan.limitInvalid")
    .default(LIST_LIMITS.default),
});

const TokenCount = z.number().int().min(0);

export const TokenUsageSchema = z.object({
  inputTokens: TokenCount,
  outputTokens: TokenCount,
  totalTokens: TokenCount,
});

export const EMPTY_TOKEN_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
};

export function addTokenUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    totalTokens: a.totalTokens + b.totalTokens,
  };
}

export function zodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const detail = describeIssue(issue);
    return issue.path.length ? `${issue.path.join(".")}: ${detail}` : detail;
  });
}

function describeIssue(issue: z.core.$ZodIssue): string {
  const unit =
    "origin" in issue && issue.origin === "array" ? "items" : "characters";
  if (issue.code === "too_small")
    return `needs at least ${issue.minimum} ${unit}`;
  if (issue.code === "too_big") return `needs at most ${issue.maximum} ${unit}`;
  return issue.code;
}

export function withoutKey(errors: FieldErrors, field: string): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([key]) => key !== field),
  );
}

export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    errors[field] ??= issue.message;
  }
  return errors;
}
