import { describe, expect, it } from "vitest";
import { fakeLlm, sentMessages } from "@/test/fake-model";
import {
  draftMilestoneFactory,
  generationRequestFactory,
  milestoneFactory,
  toOutput,
} from "@/test/factories";
import {
  generateMilestones,
  refineMilestone,
  refineMilestoneSet,
} from "@/lib/ai/milestone-ai";

const request = generationRequestFactory.build();

describe("generateMilestones", () => {
  it("returns validated milestones with unique ids, unlocked", async () => {
    const { llm } = fakeLlm({ milestones: milestoneFactory.buildList(3) });

    const { milestones } = await generateMilestones(llm, request);

    expect(milestones).toHaveLength(3);
    expect(new Set(milestones.map((m) => m.id)).size).toBe(3);
    expect(milestones.every((m) => m.locked === false)).toBe(true);
  });

  it("reports token usage of a single call", async () => {
    const { llm } = fakeLlm({ milestones: milestoneFactory.buildList(2) });

    const { usage } = await generateMilestones(llm, request);

    expect(usage).toEqual({
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
    });
  });

  it("retries when too few milestones are returned and sums token usage", async () => {
    const { llm, invoke } = fakeLlm(
      { milestones: milestoneFactory.buildList(1) },
      { milestones: milestoneFactory.buildList(2) },
    );

    const { milestones, usage } = await generateMilestones(llm, request);

    expect(milestones).toHaveLength(2);
    expect(usage.totalTokens).toBe(300);
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it("retries when a description is too short", async () => {
    const { llm, invoke } = fakeLlm(
      {
        milestones: [
          milestoneFactory.build({ description: "Too short." }),
          milestoneFactory.build(),
        ],
      },
      { milestones: milestoneFactory.buildList(2) },
    );

    await generateMilestones(llm, request);
    const feedback = sentMessages(invoke, 1).at(-1)?.text;
    expect(feedback).toContain("milestones.0.description");
  });
});

describe("refineMilestoneSet", () => {
  it("keeps ids, marks changes and assigns ids to new milestones", async () => {
    const [first, second, third] = draftMilestoneFactory.buildList(3);
    const { llm } = fakeLlm({
      milestones: [
        toOutput(first!),
        { ...milestoneFactory.build(), id: second!.id },
        { ...milestoneFactory.build(), id: null },
      ],
    });

    const result = await refineMilestoneSet(llm, {
      request,
      milestones: [first!, second!, third!],
      instruction: "Replace the last step",
    });

    expect(result.milestones.slice(0, 2).map((m) => m.id)).toEqual([
      first!.id,
      second!.id,
    ]);
    expect(result.changes.map((c) => c.kind)).toEqual([
      "unchanged",
      "modified",
      "added",
      "removed",
    ]);
  });

  it("restores locked milestones the model changed", async () => {
    const locked = draftMilestoneFactory.build({ locked: true });
    const other = draftMilestoneFactory.build();
    const { llm } = fakeLlm({
      milestones: [
        { ...milestoneFactory.build(), id: locked.id },
        toOutput(other),
      ],
    });

    const result = await refineMilestoneSet(llm, {
      request,
      milestones: [locked, other],
      instruction: "Rewrite everything",
    });

    expect(result.milestones[0]).toEqual(locked);
  });

  it("retries when a locked milestone is removed", async () => {
    const locked = draftMilestoneFactory.build({ locked: true });
    const [second, third] = draftMilestoneFactory.buildList(2);
    const { llm, invoke } = fakeLlm(
      { milestones: [toOutput(second!), toOutput(third!)] },
      { milestones: [toOutput(locked), toOutput(second!)] },
    );

    await refineMilestoneSet(llm, {
      request,
      milestones: [locked, second!, third!],
      instruction: "Remove the first step",
    });

    const feedback = sentMessages(invoke, 1).at(-1)?.text;
    expect(feedback).toContain(`Locked milestone "${locked.id}"`);
  });

  it("treats unknown and duplicate ids as new milestones", async () => {
    const existing = draftMilestoneFactory.build();
    const { llm } = fakeLlm({
      milestones: [
        toOutput(existing),
        { ...milestoneFactory.build(), id: existing.id },
        { ...milestoneFactory.build(), id: "invented" },
      ],
    });

    const result = await refineMilestoneSet(llm, {
      request,
      milestones: [existing],
      instruction: "Add two steps",
    });

    const ids = result.milestones.map((m) => m.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids).not.toContain("invented");
  });
});

describe("refineMilestone", () => {
  const [target, other] = draftMilestoneFactory.buildList(2);
  const milestones = [target!, other!];
  const longer = milestoneFactory.build({
    title: target!.title,
    description: `${target!.description} Include photos and a comparison table.`,
  });

  it("keeps the target id and unlocks the result", async () => {
    const { llm } = fakeLlm(longer);

    const { milestone } = await refineMilestone(llm, {
      request,
      milestones,
      targetId: target!.id,
      mode: "longer",
    });

    expect(milestone).toEqual({ ...longer, id: target!.id, locked: false });
  });

  it("retries when 'shorter' does not shorten the description", async () => {
    const shorter = milestoneFactory.build({
      description: "Learners complete the task and write a short report.",
    });
    const { llm, invoke } = fakeLlm(longer, shorter);

    const { milestone } = await refineMilestone(llm, {
      request,
      milestones,
      targetId: target!.id,
      mode: "shorter",
    });

    expect(milestone.description).toBe(shorter.description);
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it("sends the custom instruction to the model", async () => {
    const { llm, invoke } = fakeLlm(longer);

    await refineMilestone(llm, {
      request,
      milestones,
      targetId: target!.id,
      mode: "custom",
      instruction: "Focus on the cafeteria",
    });

    const prompt = sentMessages(invoke, 0)[1]?.text;
    expect(prompt).toContain("Focus on the cafeteria");
  });
});
