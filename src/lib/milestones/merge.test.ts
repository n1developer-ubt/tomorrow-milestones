import { describe, expect, it } from "vitest";
import {
  draftMilestoneFactory,
  milestoneFactory,
  toOutput,
} from "@/test/factories";
import { findMissingLocked, mergeRefinedMilestones } from "./merge";

describe("findMissingLocked", () => {
  it("returns locked milestones absent from the refined list", () => {
    const locked = draftMilestoneFactory.build({ locked: true });
    const open = draftMilestoneFactory.build();

    expect(findMissingLocked([toOutput(open)], [locked, open])).toEqual([
      locked,
    ]);
  });

  it("ignores unlocked milestones that were removed", () => {
    const open = draftMilestoneFactory.build();
    expect(findMissingLocked([], [open])).toEqual([]);
  });
});

describe("mergeRefinedMilestones", () => {
  it("keeps known ids with the new text", () => {
    const original = draftMilestoneFactory.build();
    const text = milestoneFactory.build();

    expect(
      mergeRefinedMilestones([{ ...text, id: original.id }], [original]),
    ).toEqual([{ ...text, id: original.id, locked: false }]);
  });

  it("restores locked milestones exactly", () => {
    const locked = draftMilestoneFactory.build({ locked: true });
    const changed = { ...milestoneFactory.build(), id: locked.id };

    expect(mergeRefinedMilestones([changed], [locked])).toEqual([locked]);
  });

  it("assigns new ids to null, unknown and duplicate ids", () => {
    const original = draftMilestoneFactory.build();
    const result = mergeRefinedMilestones(
      [
        toOutput(original),
        { ...milestoneFactory.build(), id: original.id },
        { ...milestoneFactory.build(), id: "invented" },
        { ...milestoneFactory.build(), id: null },
      ],
      [original],
    );

    const ids = result.map((m) => m.id);
    expect(ids[0]).toBe(original.id);
    expect(new Set(ids).size).toBe(4);
    expect(ids).not.toContain("invented");
  });
});
