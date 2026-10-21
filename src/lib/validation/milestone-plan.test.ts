import { describe, expect, it } from "vitest";
import {
  generationRequestFactory,
  milestoneFactory,
  savedMilestoneFactory,
  tokenUsageFactory,
} from "@/test/factories";
import { SaveMilestonePlanRequestSchema } from "./milestone-plan";

const request = generationRequestFactory.build();
const tokenUsage = tokenUsageFactory.build();

describe("SaveMilestonePlanRequestSchema", () => {
  it("accepts accepted milestones and defaults edited to false", () => {
    const result = SaveMilestonePlanRequestSchema.parse({
      request,
      milestones: [milestoneFactory.build()],
      tokenUsage,
    });
    expect(result.milestones[0]?.edited).toBe(false);
  });

  it("rejects saving without milestones", () => {
    const result = SaveMilestonePlanRequestSchema.safeParse({
      request,
      milestones: [],
      tokenUsage,
    });
    expect(result.error?.issues[0]?.message).toBe(
      "validation.plan.noneAccepted",
    );
  });

  it("rejects more milestones than allowed", () => {
    const result = SaveMilestonePlanRequestSchema.safeParse({
      request,
      milestones: savedMilestoneFactory.buildList(7),
      tokenUsage,
    });
    expect(result.success).toBe(false);
  });
});
