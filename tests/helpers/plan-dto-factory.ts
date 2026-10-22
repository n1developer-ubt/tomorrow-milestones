import {
  toPlanDto,
  type MilestonePlanDto,
  type NewMilestonePlan,
} from "@/lib/repository/repository";
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
