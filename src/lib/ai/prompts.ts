import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  MILESTONE_LIMITS,
  type DraftMilestone,
  type GenerationRequest,
  type RefineMode,
} from "@/lib/milestones/schemas";

const MilestoneOutput = z.object({
  title: z.string(),
  description: z.string(),
});

export const GeneratedOutput = z.object({
  status: z.enum(["ok", "insufficient_brief"]),
  milestones: z.array(MilestoneOutput).max(MILESTONE_LIMITS.count.max),
});

export const RefinedSetOutput = z.object({
  milestones: z
    .array(MilestoneOutput.extend({ id: z.string().nullable() }))
    .min(MILESTONE_LIMITS.count.min)
    .max(MILESTONE_LIMITS.count.max),
});

export const RefinedMilestoneOutput = MilestoneOutput;

export const PROMPT_VERSION = "2026-10-22.1";

const PROMPTS_DIR = path.join(process.cwd(), "prompts");

function loadPrompt(name: string): string {
  return readFileSync(path.join(PROMPTS_DIR, `${name}.txt`), "utf8").trim();
}

const templates = {
  system: loadPrompt("system"),
  generate: loadPrompt("generate"),
  refineSet: loadPrompt("refine-set"),
  refineMilestone: loadPrompt("refine-milestone"),
  shorter: loadPrompt("refine-shorter"),
  longer: loadPrompt("refine-longer"),
  retry: loadPrompt("retry"),
};

export function renderTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`Missing prompt value: ${key}`);
    return String(values[key]);
  });
}

export function escapeTags(text: string): string {
  return text.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const { title, description, count } = MILESTONE_LIMITS;

export const SYSTEM_PROMPT = renderTemplate(templates.system, {
  title_min: title.min,
  title_max: title.max,
  description_min: description.min,
  description_max: description.max,
  count_min: count.min,
  count_max: count.max,
});

function requestValues(request: GenerationRequest) {
  return { title: escapeTags(request.title), brief: escapeTags(request.brief) };
}

function milestonesValue(milestones: DraftMilestone[]): string {
  const data = milestones.map(({ id, title, description, locked }) => ({
    id,
    title,
    description,
    locked,
  }));
  return escapeTags(JSON.stringify(data));
}

export function buildGeneratePrompt(request: GenerationRequest): string {
  return renderTemplate(templates.generate, requestValues(request));
}

export function buildRetryPrompt(issues: string[]): string {
  return renderTemplate(templates.retry, {
    issues: issues.map((issue) => `- ${issue}`).join("\n"),
  });
}

export function buildRefineSetPrompt(
  request: GenerationRequest,
  milestones: DraftMilestone[],
  instruction: string,
): string {
  return renderTemplate(templates.refineSet, {
    ...requestValues(request),
    milestones: milestonesValue(milestones),
    instruction: escapeTags(instruction),
  });
}

export function buildRefineMilestonePrompt(
  request: GenerationRequest,
  milestones: DraftMilestone[],
  target: DraftMilestone,
  mode: RefineMode,
  instruction?: string,
): string {
  const edit = mode === "custom" ? (instruction ?? "") : templates[mode];
  return renderTemplate(templates.refineMilestone, {
    ...requestValues(request),
    milestones: milestonesValue(milestones),
    instruction: escapeTags(edit),
    target_id: target.id,
  });
}
