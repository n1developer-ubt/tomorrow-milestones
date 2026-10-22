import { describe, expect, it } from "vitest";
import { milestoneFactory } from "@/test/factories";
import { GeneratedMilestonesSchema, MilestoneSchema } from "@/lib/milestones/schemas";

describe("MilestoneSchema", () => {
  it("accepts a valid milestone", () => {
    expect(MilestoneSchema.safeParse(milestoneFactory.build()).success).toBe(
      true,
    );
  });

  it.each([
    ["a description that is too short", { description: "Do the audit." }],
    ["a title that is too long", { title: "a".repeat(81) }],
  ])("rejects %s", (_, overrides) => {
    const milestone = milestoneFactory.build(overrides);
    expect(MilestoneSchema.safeParse(milestone).success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(MilestoneSchema.safeParse({ title: "Only a title" }).success).toBe(
      false,
    );
  });
});

describe("GeneratedMilestonesSchema", () => {
  it.each([2, 4, 6])("accepts %i milestones", (count) => {
    const output = { milestones: milestoneFactory.buildList(count) };
    expect(GeneratedMilestonesSchema.safeParse(output).success).toBe(true);
  });

  it.each([0, 1, 7])("rejects %i milestones", (count) => {
    const output = { milestones: milestoneFactory.buildList(count) };
    expect(GeneratedMilestonesSchema.safeParse(output).success).toBe(false);
  });
});
