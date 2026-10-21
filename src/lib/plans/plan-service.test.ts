import { beforeEach, describe, expect, it } from "vitest";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import { fakeLlm } from "@/test/fake-model";
import { InMemoryMilestonePlanRepository } from "@/test/fake-repository";
import {
  draftMilestoneFactory,
  generationRequestFactory,
  milestoneFactory,
  newMilestonePlanFactory,
  reviewCardFactory,
  toOutput,
} from "@/test/factories";
import {
  createPlan,
  publishPlan,
  refinePlan,
  refinePlanMilestone,
  reviewPlan,
} from "./plan-service";

let repository: InMemoryMilestonePlanRepository;

beforeEach(() => {
  repository = new InMemoryMilestonePlanRepository();
});

async function draftPlan(overrides = {}) {
  return repository.create(newMilestonePlanFactory.build(overrides));
}

describe("createPlan", () => {
  it("stores generated milestones as a pending draft", async () => {
    const { llm } = fakeLlm({ milestones: milestoneFactory.buildList(3) });
    const request = generationRequestFactory.build();

    const plan = await createPlan({ llm, repository }, request);

    expect(plan).toMatchObject({
      ...request,
      status: "draft",
      promptVersion: PROMPT_VERSION,
      model: "fake-model",
      publishedAt: null,
      tokenUsage: { totalTokens: 150 },
    });
    expect(plan.milestones.map((card) => card.status)).toEqual([
      "pending",
      "pending",
      "pending",
    ]);
    expect(repository.plans.has(plan.id)).toBe(true);
  });
});

describe("reviewPlan", () => {
  it("persists accept, edit and reject decisions", async () => {
    const plan = await draftPlan();
    const [first, second] = plan.milestones;
    const text = milestoneFactory.build();

    await reviewPlan({ repository }, plan.id, {
      type: "setStatus",
      milestoneId: first!.milestone.id,
      status: "accepted",
    });
    await reviewPlan({ repository }, plan.id, {
      type: "edit",
      milestoneId: second!.milestone.id,
      text,
    });
    const updated = await reviewPlan({ repository }, plan.id, {
      type: "setStatus",
      milestoneId: second!.milestone.id,
      status: "rejected",
    });

    expect(updated.milestones.map((c) => [c.status, c.edited])).toEqual([
      ["accepted", false],
      ["rejected", true],
    ]);
    expect((await repository.findById(plan.id))?.milestones).toEqual(
      updated.milestones,
    );
  });

  it("rejects unknown milestones", async () => {
    const plan = await draftPlan();

    await expect(
      reviewPlan({ repository }, plan.id, {
        type: "revert",
        milestoneId: "missing",
      }),
    ).rejects.toMatchObject({ code: "milestone_not_found" });
  });

  it("rejects unknown plans", async () => {
    await expect(
      reviewPlan({ repository }, "missing", {
        type: "revert",
        milestoneId: "m1",
      }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("restores milestones removed by a refine", async () => {
    const removed = draftMilestoneFactory.build();
    const plan = await draftPlan({ removed: [removed] });

    const updated = await reviewPlan({ repository }, plan.id, {
      type: "restoreRemoved",
      milestoneId: removed.id,
    });

    expect(updated.removed).toEqual([]);
    expect(updated.milestones.at(-1)?.milestone).toEqual(removed);
  });
});

describe("refinePlan", () => {
  it("sends only non-rejected milestones and keeps accepted ones locked", async () => {
    const accepted = reviewCardFactory.build({ status: "accepted" });
    accepted.milestone.locked = true;
    const open = reviewCardFactory.build();
    const rejected = reviewCardFactory.build({ status: "rejected" });
    const plan = await draftPlan({ milestones: [accepted, open, rejected] });
    const rewritten = { ...milestoneFactory.build(), id: open.milestone.id };
    const { llm, invoke } = fakeLlm({
      milestones: [toOutput(accepted.milestone), rewritten],
    });

    const { plan: updated, changes } = await refinePlan(
      { llm, repository },
      plan.id,
      "Make it hands-on",
    );

    const prompt = String(invoke.mock.calls[0]?.[0][1]?.content);
    expect(prompt).not.toContain(rejected.milestone.title);
    expect(changes.map((c) => c.kind)).toEqual(["unchanged", "modified"]);
    expect(updated.milestones.map((c) => c.status)).toEqual([
      "accepted",
      "pending",
      "rejected",
    ]);
    expect(updated.tokenUsage.totalTokens).toBe(
      plan.tokenUsage.totalTokens + 150,
    );
  });
});

describe("refinePlanMilestone", () => {
  it("replaces the milestone and keeps the previous version", async () => {
    const plan = await draftPlan();
    const target = plan.milestones[0]!.milestone;
    const longer = milestoneFactory.build({
      description: `${target.description} With a comparison table.`,
    });
    const { llm } = fakeLlm(longer);

    const updated = await refinePlanMilestone(
      { llm, repository },
      plan.id,
      target.id,
      { mode: "longer" },
    );

    expect(updated.milestones[0]).toMatchObject({
      status: "pending",
      change: "modified",
      milestone: { ...longer, id: target.id },
      previous: target,
    });
  });

  it("rejects milestones that are rejected or unknown", async () => {
    const rejected = reviewCardFactory.build({ status: "rejected" });
    const plan = await draftPlan({ milestones: [rejected] });
    const { llm } = fakeLlm();

    await expect(
      refinePlanMilestone({ llm, repository }, plan.id, rejected.milestone.id, {
        mode: "shorter",
      }),
    ).rejects.toMatchObject({ code: "milestone_not_found" });
  });
});

describe("publishPlan", () => {
  const publishedAt = new Date("2026-10-21T12:00:00Z");

  it("publishes a plan with at least one accepted milestone", async () => {
    const plan = await draftPlan({
      milestones: [reviewCardFactory.build({ status: "accepted" })],
    });

    const published = await publishPlan(
      { repository, now: () => publishedAt },
      plan.id,
    );

    expect(published).toMatchObject({ status: "published", publishedAt });
  });

  it("refuses to publish without accepted milestones", async () => {
    const plan = await draftPlan();

    await expect(publishPlan({ repository }, plan.id)).rejects.toMatchObject({
      code: "nothing_accepted",
    });
  });

  it("makes the plan read-only", async () => {
    const plan = await draftPlan({
      milestones: [reviewCardFactory.build({ status: "accepted" })],
    });
    await publishPlan({ repository }, plan.id);

    await expect(
      reviewPlan({ repository }, plan.id, {
        type: "setStatus",
        milestoneId: plan.milestones[0]!.milestone.id,
        status: "rejected",
      }),
    ).rejects.toMatchObject({ code: "plan_published" });
    const { llm } = fakeLlm();
    await expect(
      refinePlan({ llm, repository }, plan.id, "Change everything"),
    ).rejects.toMatchObject({ code: "plan_published" });
  });
});
