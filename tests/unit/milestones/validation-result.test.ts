import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodIssues } from "@/lib/milestones/schemas";

const Schema = z.object({
  items: z.array(z.string().min(3)).min(1).max(2),
  name: z.string(),
});

function issuesFor(value: unknown): string[] {
  const result = Schema.safeParse(value);
  return result.success ? [] : zodIssues(result.error);
}

describe("zodIssues", () => {
  it("describes string length issues with the path", () => {
    expect(issuesFor({ items: ["ab"], name: "x" })).toEqual([
      "items.0: needs at least 3 characters",
    ]);
  });

  it("describes array size issues", () => {
    expect(issuesFor({ items: ["abc", "abc", "abc"], name: "x" })).toEqual([
      "items: needs at most 2 items",
    ]);
  });

  it("falls back to the issue code", () => {
    expect(issuesFor({ items: ["abc"] })).toEqual(["name: invalid_type"]);
  });
});
