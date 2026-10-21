import { describe, expect, it } from "vitest";
import {
  draftMilestoneFactory,
  generationRequestFactory,
  milestoneFactory,
} from "@/test/factories";
import {
  RefineMilestoneRequestSchema,
  RefineSetRequestSchema,
} from "./refine-request";

const request = generationRequestFactory.build();

describe("RefineSetRequestSchema", () => {
  it("accepts a valid request and defaults locked to false", () => {
    const milestone = { ...milestoneFactory.build(), id: "m1" };
    const result = RefineSetRequestSchema.parse({
      request,
      milestones: [milestone],
      instruction: "Make it more hands-on",
    });
    expect(result.milestones[0]?.locked).toBe(false);
  });

  it("rejects duplicate milestone ids", () => {
    const milestones = draftMilestoneFactory.buildList(2, { id: "same" });
    const result = RefineSetRequestSchema.safeParse({
      request,
      milestones,
      instruction: "Make it more hands-on",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty instruction", () => {
    const result = RefineSetRequestSchema.safeParse({
      request,
      milestones: [draftMilestoneFactory.build()],
      instruction: "  ",
    });
    expect(result.success).toBe(false);
  });
});

describe("RefineMilestoneRequestSchema", () => {
  const milestone = draftMilestoneFactory.build();
  const base = { request, milestones: [milestone], targetId: milestone.id };

  it.each(["shorter", "longer"] as const)(
    "accepts %s without an instruction",
    (mode) => {
      expect(
        RefineMilestoneRequestSchema.safeParse({ ...base, mode }).success,
      ).toBe(true);
    },
  );

  it("requires an instruction for custom mode", () => {
    const result = RefineMilestoneRequestSchema.safeParse({
      ...base,
      mode: "custom",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown target id", () => {
    const result = RefineMilestoneRequestSchema.safeParse({
      ...base,
      targetId: "missing",
      mode: "shorter",
    });
    expect(result.success).toBe(false);
  });
});
