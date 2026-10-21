import { diffMilestones, type MilestoneChange } from "@/lib/milestones/diff";
import type { GenerationRequest } from "@/lib/validation/generation-request";
import {
  validateGeneratedMilestones,
  validateRefinedMilestone,
  validateRefinedSet,
} from "@/lib/validation/llm-output";
import type { DraftMilestone } from "@/lib/validation/milestone";
import type {
  RefineMilestoneRequest,
  RefineSetRequest,
} from "@/lib/validation/refine-request";
import {
  GeneratedOutput,
  RefinedMilestoneOutput,
  RefinedSetOutput,
} from "./output-schemas";
import {
  buildGeneratePrompt,
  buildRefineMilestonePrompt,
  buildRefineSetPrompt,
} from "./prompts";
import { callLlmWithValidation, type Llm } from "./structured-llm-call";

export type RefinedSet = {
  milestones: DraftMilestone[];
  changes: MilestoneChange[];
};

export async function generateMilestones(
  llm: Llm,
  request: GenerationRequest,
): Promise<DraftMilestone[]> {
  return callLlmWithValidation({
    llm,
    prompt: buildGeneratePrompt(request),
    schemaName: "generated_milestones",
    outputSchema: GeneratedOutput,
    validate: validateGeneratedMilestones,
  });
}

export async function refineMilestoneSet(
  llm: Llm,
  { request, milestones, instruction }: RefineSetRequest,
): Promise<RefinedSet> {
  const refined = await callLlmWithValidation({
    llm,
    prompt: buildRefineSetPrompt(request, milestones, instruction),
    schemaName: "refined_milestones",
    outputSchema: RefinedSetOutput,
    validate: (output) => validateRefinedSet(output, milestones),
  });
  return { milestones: refined, changes: diffMilestones(milestones, refined) };
}

export async function refineMilestone(
  llm: Llm,
  { request, milestones, targetId, mode, instruction }: RefineMilestoneRequest,
): Promise<DraftMilestone> {
  const target = milestones.find((m) => m.id === targetId);
  if (!target) throw new Error(`Milestone ${targetId} not found`);

  return callLlmWithValidation({
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
}
