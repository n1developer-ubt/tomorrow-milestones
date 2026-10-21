import { randomUUID } from "node:crypto";
import type { DraftMilestone, Milestone } from "@/lib/validation/milestone";

export type RefinedMilestone = Milestone & { id: string | null };

export function findMissingLocked(
  refined: RefinedMilestone[],
  original: DraftMilestone[],
): DraftMilestone[] {
  const refinedIds = new Set(refined.map((m) => m.id));
  return original.filter((m) => m.locked && !refinedIds.has(m.id));
}

export function mergeRefinedMilestones(
  refined: RefinedMilestone[],
  original: DraftMilestone[],
): DraftMilestone[] {
  const originalById = new Map(original.map((m) => [m.id, m]));
  const usedIds = new Set<string>();

  return refined.map(({ id, title, description }) => {
    const previous = id ? originalById.get(id) : undefined;
    if (!id || !previous || usedIds.has(id)) {
      return { title, description, id: randomUUID(), locked: false };
    }
    usedIds.add(id);
    return previous.locked
      ? previous
      : { title, description, id, locked: false };
  });
}
