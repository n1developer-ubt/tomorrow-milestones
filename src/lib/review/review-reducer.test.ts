import { describe, expect, it } from "vitest";
import {
  draftMilestoneFactory,
  milestoneFactory,
  tokenUsageFactory,
} from "@/test/factories";
import {
  draftMilestones,
  INITIAL_REVIEW_STATE,
  reviewReducer,
  type ReviewAction,
  type ReviewState,
} from "./review-reducer";

const usage = tokenUsageFactory.build();

function reduce(...actions: ReviewAction[]): ReviewState {
  return actions.reduce(reviewReducer, INITIAL_REVIEW_STATE);
}

function generated(count = 3) {
  const milestones = draftMilestoneFactory.buildList(count);
  return {
    milestones,
    action: { type: "generated", milestones, usage } as const,
  };
}

describe("reviewReducer", () => {
  it("starts every generated milestone as pending", () => {
    const { action } = generated();
    const state = reduce(action);

    expect(state.cards.map((c) => c.status)).toEqual([
      "pending",
      "pending",
      "pending",
    ]);
    expect(state.usage).toEqual(usage);
  });

  it("replaces drafts on a new generation but keeps adding token usage", () => {
    const state = reduce(generated(3).action, generated(2).action);

    expect(state.cards).toHaveLength(2);
    expect(state.usage.totalTokens).toBe(usage.totalTokens * 2);
  });

  it("locks accepted milestones and unlocks them on undo", () => {
    const { milestones, action } = generated(1);
    const id = milestones[0]!.id;

    const accepted = reduce(action, {
      type: "setStatus",
      id,
      status: "accepted",
    });
    expect(accepted.cards[0]?.milestone.locked).toBe(true);

    const undone = reviewReducer(accepted, {
      type: "setStatus",
      id,
      status: "pending",
    });
    expect(undone.cards[0]?.milestone.locked).toBe(false);
  });

  it("marks manual edits and ignores edits without changes", () => {
    const { milestones, action } = generated(1);
    const original = milestones[0]!;

    const unchanged = reduce(action, {
      type: "edit",
      id: original.id,
      text: { title: original.title, description: original.description },
    });
    expect(unchanged.cards[0]?.edited).toBe(false);

    const text = milestoneFactory.build();
    const edited = reviewReducer(unchanged, {
      type: "edit",
      id: original.id,
      text,
    });
    expect(edited.cards[0]).toMatchObject({ edited: true, milestone: text });
  });

  it("applies a single refine as a reviewable change with a previous version", () => {
    const { milestones, action } = generated(1);
    const original = milestones[0]!;
    const refined = { ...original, ...milestoneFactory.build() };

    const state = reduce(
      action,
      { type: "setStatus", id: original.id, status: "accepted" },
      { type: "refinedItem", milestone: refined, usage },
    );

    expect(state.cards[0]).toMatchObject({
      status: "pending",
      change: "modified",
      milestone: refined,
    });
    expect(state.cards[0]?.previous?.title).toBe(original.title);
  });

  it("reverts to the previous version and its review status", () => {
    const { milestones, action } = generated(1);
    const original = milestones[0]!;

    const state = reduce(
      action,
      { type: "setStatus", id: original.id, status: "accepted" },
      {
        type: "refinedItem",
        milestone: { ...original, ...milestoneFactory.build(), locked: false },
        usage,
      },
      { type: "revert", id: original.id },
    );

    expect(state.cards[0]).toEqual({
      milestone: { ...original, locked: true },
      status: "accepted",
      edited: false,
    });
  });

  it("applies a set refine: keeps unchanged, flags modified and added, collects removed", () => {
    const { milestones, action } = generated(3);
    const [kept, changed, dropped] = milestones;
    const modified = { ...changed!, ...milestoneFactory.build() };
    const added = draftMilestoneFactory.build();

    const state = reduce(
      action,
      { type: "setStatus", id: kept!.id, status: "accepted" },
      {
        type: "refinedSet",
        milestones: [kept!, modified, added],
        changes: [
          { kind: "unchanged", id: kept!.id },
          { kind: "modified", id: changed!.id, before: changed! },
          { kind: "added", id: added.id },
          { kind: "removed", id: dropped!.id, before: dropped! },
        ],
        usage,
      },
    );

    expect(state.cards.map((c) => [c.status, c.change])).toEqual([
      ["accepted", undefined],
      ["pending", "modified"],
      ["pending", "added"],
    ]);
    expect(state.removed).toEqual([dropped]);
  });

  it("keeps rejected cards that were not sent to the AI", () => {
    const { milestones, action } = generated(2);
    const [open, rejected] = milestones;

    const state = reduce(
      action,
      { type: "setStatus", id: rejected!.id, status: "rejected" },
      {
        type: "refinedSet",
        milestones: [open!],
        changes: [{ kind: "unchanged", id: open!.id }],
        usage,
      },
    );

    expect(state.cards.map((c) => c.milestone.id)).toEqual([
      open!.id,
      rejected!.id,
    ]);
  });

  it("restores a removed milestone as pending", () => {
    const { milestones, action } = generated(2);
    const [kept, dropped] = milestones;

    const state = reduce(
      action,
      {
        type: "refinedSet",
        milestones: [kept!],
        changes: [
          { kind: "unchanged", id: kept!.id },
          { kind: "removed", id: dropped!.id, before: dropped! },
        ],
        usage,
      },
      { type: "restoreRemoved", id: dropped!.id },
    );

    expect(state.removed).toEqual([]);
    expect(state.cards.at(-1)).toMatchObject({
      milestone: dropped,
      status: "pending",
    });
  });
});

describe("draftMilestones", () => {
  it("sends every non-rejected milestone to the AI", () => {
    const { milestones, action } = generated(3);

    const state = reduce(action, {
      type: "setStatus",
      id: milestones[1]!.id,
      status: "rejected",
    });

    expect(draftMilestones(state).map((m) => m.id)).toEqual([
      milestones[0]!.id,
      milestones[2]!.id,
    ]);
  });
});
