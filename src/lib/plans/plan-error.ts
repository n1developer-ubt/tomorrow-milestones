export type PlanErrorCode =
  "not_found" | "milestone_not_found" | "plan_published" | "nothing_accepted";

export class PlanError extends Error {
  constructor(readonly code: PlanErrorCode) {
    super(code);
    this.name = "PlanError";
  }
}
