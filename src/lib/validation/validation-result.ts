import type { z } from "zod";

export type ValidationResult<T> =
  { ok: true; value: T } | { ok: false; issues: string[] };

export function zodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const detail = describeIssue(issue);
    return issue.path.length ? `${issue.path.join(".")}: ${detail}` : detail;
  });
}

function describeIssue(issue: z.core.$ZodIssue): string {
  const unit =
    "origin" in issue && issue.origin === "array" ? "items" : "characters";
  if (issue.code === "too_small")
    return `needs at least ${issue.minimum} ${unit}`;
  if (issue.code === "too_big") return `needs at most ${issue.maximum} ${unit}`;
  return issue.code;
}
