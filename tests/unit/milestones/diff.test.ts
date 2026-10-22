import { describe, expect, it } from "vitest";
import { draftMilestoneFactory } from "@/test/factories";
import { diffMilestones } from "@/lib/milestones/review";

describe("diffMilestones", () => {
  it("classifies unchanged, modified, added and removed milestones", () => {
    const [a, b, c] = draftMilestoneFactory.buildList(3);
    const d = draftMilestoneFactory.build();
    const before = [a!, b!, c!];
    const after = [a!, { ...b!, title: "New title" }, d];

    expect(diffMilestones(before, after)).toEqual([
      { kind: "unchanged", id: a!.id },
      { kind: "modified", id: b!.id, before: b },
      { kind: "added", id: d.id },
      { kind: "removed", id: c!.id, before: c },
    ]);
  });

  it("returns only unchanged entries for identical lists", () => {
    const list = draftMilestoneFactory.buildList(2);
    expect(
      diffMilestones(list, list).every((c) => c.kind === "unchanged"),
    ).toBe(true);
  });
});
