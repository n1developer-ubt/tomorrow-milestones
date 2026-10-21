import { toPlanDto, type MilestonePlanDto } from "@/lib/plans/plan-dto";
import type { NewMilestonePlan } from "@/lib/storage/milestone-plan-repository";
import { newMilestonePlanFactory } from "./factories";

export function planDto(
  overrides: Partial<NewMilestonePlan> = {},
  id = "plan-1",
): MilestonePlanDto {
  const created = new Date("2026-10-21T10:00:00Z");
  return toPlanDto({
    ...newMilestonePlanFactory.build(overrides),
    id,
    createdAt: created,
    updatedAt: created,
  });
}
