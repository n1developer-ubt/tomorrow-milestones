import { describe, expect, it } from "vitest";
import {
  draftMilestoneFactory,
  milestoneFactory,
  toOutput,
} from "@/test/factories";
import {
  validateGeneratedMilestones,
  validateRefinedMilestone,
  validateRefinedSet,
} from "./llm-output";

describe("validateGeneratedMilestones", () => {
  it("adds unique ids and unlocks every milestone", () => {
    const result = validateGeneratedMilestones({
      milestones: milestoneFactory.buildList(3),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(new Set(result.value.map((m) => m.id)).size).toBe(3);
    expect(result.value.every((m) => !m.locked)).toBe(true);
  });

  it("reports issues for invalid output", () => {
    const result = validateGeneratedMilestones({ milestones: [] });
    expect(result).toEqual({
      ok: false,
      issues: ["milestones: needs at least 2 items"],
    });
  });
});

describe("validateRefinedSet", () => {
  it("merges the refined list into the original", () => {
    const [first, second] = draftMilestoneFactory.buildList(2);
    const result = validateRefinedSet(
      { milestones: [toOutput(first!), toOutput(second!)] },
      [first!, second!],
    );
    expect(result).toEqual({ ok: true, value: [first, second] });
  });

  it("fails when a locked milestone is missing", () => {
    const locked = draftMilestoneFactory.build({ locked: true });
    const [second, third] = draftMilestoneFactory.buildList(2);
    const result = validateRefinedSet(
      { milestones: [toOutput(second!), toOutput(third!)] },
      [locked, second!, third!],
    );
    expect(result).toEqual({
      ok: false,
      issues: [`Locked milestone "${locked.id}" must be kept unchanged`],
    });
  });
});

describe("validateRefinedMilestone", () => {
  const target = draftMilestoneFactory.build();

  it("keeps the target id", () => {
    const text = milestoneFactory.build({
      description: `${target.description} With more detail.`,
    });
    expect(validateRefinedMilestone(text, target, "longer")).toEqual({
      ok: true,
      value: { ...text, id: target.id, locked: false },
    });
  });

  it("fails when 'shorter' is not shorter", () => {
    const result = validateRefinedMilestone(
      toOutput(target),
      target,
      "shorter",
    );
    expect(result).toEqual({
      ok: false,
      issues: [
        `Description must be shorter than ${target.description.length} characters`,
      ],
    });
  });
});
