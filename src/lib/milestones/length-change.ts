import type { RefineMode } from "@/lib/validation/refine-request";

export function hasExpectedLengthChange(
  mode: RefineMode,
  before: string,
  after: string,
): boolean {
  if (mode === "shorter") return after.length < before.length;
  if (mode === "longer") return after.length > before.length;
  return true;
}
