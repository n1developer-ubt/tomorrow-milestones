import { randomUUID } from "node:crypto";
import { diffMilestones, type MilestoneChange } from "@/lib/milestones/review";
import {
  GeneratedMilestonesSchema,
  MilestoneSchema,
  zodIssues,
  type DraftMilestone,
  type GenerationRequest,
  type Milestone,
  type RefineMilestoneRequest,
  type RefineMode,
  type RefineSetRequest,
  type TokenUsage,
  type ValidationResult,
} from "@/lib/milestones/schemas";
import { AiError, callLlmWithValidation, type Llm } from "./llm";
import {
  buildGeneratePrompt,
  buildRefineMilestonePrompt,
  buildRefineSetPrompt,
  GeneratedOutput,
  RefinedMilestoneOutput,
  RefinedSetOutput,
} from "./prompts";

export type GeneratedMilestones = {
  milestones: DraftMilestone[];
  usage: TokenUsage;
};

export type RefinedSet = GeneratedMilestones & { changes: MilestoneChange[] };

export type RefinedMilestone = { milestone: DraftMilestone; usage: TokenUsage };

export type RefinedOutputMilestone = Milestone & { id: string | null };

export async function generateMilestones(
  llm: Llm,
  request: GenerationRequest,
): Promise<GeneratedMilestones> {
  const { value, usage } = await callLlmWithValidation({
    llm,
    prompt: buildGeneratePrompt(request),
    schemaName: "generated_milestones",
    outputSchema: GeneratedOutput,
    validate: validateGeneratedMilestones,
  });
  return { milestones: value, usage };
}

export async function refineMilestoneSet(
  llm: Llm,
  { request, milestones, instruction }: RefineSetRequest,
): Promise<RefinedSet> {
  const { value, usage } = await callLlmWithValidation({
    llm,
    prompt: buildRefineSetPrompt(request, milestones, instruction),
    schemaName: "refined_milestones",
    outputSchema: RefinedSetOutput,
    validate: (output) => validateRefinedSet(output, milestones),
  });
  return {
    milestones: value,
    changes: diffMilestones(milestones, value),
    usage,
  };
}

export async function refineMilestone(
  llm: Llm,
  { request, milestones, targetId, mode, instruction }: RefineMilestoneRequest,
): Promise<RefinedMilestone> {
  const target = milestones.find((m) => m.id === targetId);
  if (!target) throw new Error(`Milestone ${targetId} not found`);

  const { value, usage } = await callLlmWithValidation({
    llm,
    prompt: buildRefineMilestonePrompt(
      request,
      milestones,
      target,
      mode,
      instruction,
    ),
    schemaName: "refined_milestone",
    outputSchema: RefinedMilestoneOutput,
    validate: (output) => validateRefinedMilestone(output, target, mode),
  });
  return { milestone: value, usage };
}

export function validateGeneratedMilestones(
  output: unknown,
): ValidationResult<DraftMilestone[]> {
  if ((output as { status?: unknown })?.status === "insufficient_brief") {
    throw new AiError("brief_unclear");
  }
  const result = GeneratedMilestonesSchema.safeParse(output);
  if (!result.success) return { ok: false, issues: zodIssues(result.error) };
  return {
    ok: true,
    value: result.data.milestones.map((m) => ({
      ...m,
      id: randomUUID(),
      locked: false,
    })),
  };
}

export function validateRefinedSet(
  output: unknown,
  original: DraftMilestone[],
): ValidationResult<DraftMilestone[]> {
  const result = GeneratedMilestonesSchema.safeParse(output);
  if (!result.success) return { ok: false, issues: zodIssues(result.error) };

  const outputIds = (
    output as { milestones: { id?: unknown }[] }
  ).milestones.map((m) => (typeof m.id === "string" ? m.id : null));
  const refined = result.data.milestones.map((milestone, index) => ({
    ...milestone,
    id: outputIds[index] ?? null,
  }));

  const missingLocked = findMissingLocked(refined, original);
  if (missingLocked.length) {
    return {
      ok: false,
      issues: missingLocked.map(
        (m) => `Locked milestone "${m.id}" must be kept unchanged`,
      ),
    };
  }

  return { ok: true, value: mergeRefinedMilestones(refined, original) };
}

export function validateRefinedMilestone(
  output: unknown,
  target: DraftMilestone,
  mode: RefineMode,
): ValidationResult<DraftMilestone> {
  const result = MilestoneSchema.safeParse(output);
  if (!result.success) return { ok: false, issues: zodIssues(result.error) };

  if (
    !hasExpectedLengthChange(mode, target.description, result.data.description)
  ) {
    return {
      ok: false,
      issues: [
        `Description must be ${mode} than ${target.description.length} characters`,
      ],
    };
  }
  return { ok: true, value: { ...result.data, id: target.id, locked: false } };
}

export function findMissingLocked(
  refined: RefinedOutputMilestone[],
  original: DraftMilestone[],
): DraftMilestone[] {
  const refinedIds = new Set(refined.map((m) => m.id));
  return original.filter((m) => m.locked && !refinedIds.has(m.id));
}

export function mergeRefinedMilestones(
  refined: RefinedOutputMilestone[],
  original: DraftMilestone[],
): DraftMilestone[] {
  const originalById = new Map(original.map((m) => [m.id, m]));
  const usedIds = new Set<string>();

  return refined.map(({ id, title, description }) => {
    const previous = id ? originalById.get(id) : undefined;
    if (!id || !previous || usedIds.has(id)) {
      return { title, description, id: randomUUID(), locked: false };
    }
    usedIds.add(id);
    return previous.locked
      ? previous
      : { title, description, id, locked: false };
  });
}

export function hasExpectedLengthChange(
  mode: RefineMode,
  before: string,
  after: string,
): boolean {
  if (mode === "shorter") return after.length < before.length;
  if (mode === "longer") return after.length > before.length;
  return true;
}
