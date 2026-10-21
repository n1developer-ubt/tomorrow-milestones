import { randomUUID } from "node:crypto";
import { hasExpectedLengthChange } from "@/lib/milestones/length-change";
import {
  findMissingLocked,
  mergeRefinedMilestones,
} from "@/lib/milestones/merge";
import {
  GeneratedMilestonesSchema,
  MilestoneSchema,
  type DraftMilestone,
} from "./milestone";
import type { RefineMode } from "./refine-request";
import { zodIssues, type ValidationResult } from "./validation-result";

export function validateGeneratedMilestones(
  output: unknown,
): ValidationResult<DraftMilestone[]> {
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
