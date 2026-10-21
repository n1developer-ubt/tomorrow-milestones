import { describe, expect, it } from "vitest";
import { GeneratedMilestonesSchema, MilestoneSchema } from "./milestone";

const validMilestone = {
  title: "Map campus waste streams",
  description:
    "Audit bins in three buildings for one week and record waste by category.",
};

function milestonesOfCount(count: number) {
  return { milestones: Array.from({ length: count }, () => validMilestone) };
}

describe("MilestoneSchema", () => {
  it("accepts a valid milestone", () => {
    expect(MilestoneSchema.safeParse(validMilestone).success).toBe(true);
  });

  it("rejects a description that is too short", () => {
    const result = MilestoneSchema.safeParse({
      ...validMilestone,
      description: "Do the audit.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a title that is too long", () => {
    const result = MilestoneSchema.safeParse({
      ...validMilestone,
      title: "a".repeat(81),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(MilestoneSchema.safeParse({ title: "Only a title" }).success).toBe(
      false,
    );
  });
});

describe("GeneratedMilestonesSchema", () => {
  it.each([3, 4, 5])("accepts %i milestones", (count) => {
    expect(
      GeneratedMilestonesSchema.safeParse(milestonesOfCount(count)).success,
    ).toBe(true);
  });

  it.each([0, 2, 6])("rejects %i milestones", (count) => {
    expect(
      GeneratedMilestonesSchema.safeParse(milestonesOfCount(count)).success,
    ).toBe(false);
  });
});
