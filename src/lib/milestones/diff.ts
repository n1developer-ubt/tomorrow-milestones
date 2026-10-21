import type { DraftMilestone } from "@/lib/validation/milestone";

export type MilestoneChange =
  | { kind: "unchanged"; id: string }
  | { kind: "modified"; id: string; before: DraftMilestone }
  | { kind: "added"; id: string }
  | { kind: "removed"; id: string; before: DraftMilestone };

export function diffMilestones(
  before: DraftMilestone[],
  after: DraftMilestone[],
): MilestoneChange[] {
  const beforeById = new Map(before.map((m) => [m.id, m]));
  const afterIds = new Set(after.map((m) => m.id));

  const kept: MilestoneChange[] = after.map((milestone) => {
    const previous = beforeById.get(milestone.id);
    if (!previous) return { kind: "added", id: milestone.id };
    const changed =
      previous.title !== milestone.title ||
      previous.description !== milestone.description;
    return changed
      ? { kind: "modified", id: milestone.id, before: previous }
      : { kind: "unchanged", id: milestone.id };
  });

  const removed: MilestoneChange[] = before
    .filter((m) => !afterIds.has(m.id))
    .map((m) => ({ kind: "removed", id: m.id, before: m }));

  return [...kept, ...removed];
}
