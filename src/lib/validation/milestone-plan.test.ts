import { describe, expect, it } from "vitest";
import { LIST_LIMITS, ListMilestonePlansQuerySchema } from "./milestone-plan";

describe("ListMilestonePlansQuerySchema", () => {
  it("defaults the limit", () => {
    expect(ListMilestonePlansQuerySchema.parse({})).toEqual({
      limit: LIST_LIMITS.default,
    });
  });

  it("coerces numeric strings", () => {
    expect(ListMilestonePlansQuerySchema.parse({ limit: "5" })).toEqual({
      limit: 5,
    });
  });

  it.each(["0", "101", "1.5", "abc"])("rejects limit=%s", (limit) => {
    const result = ListMilestonePlansQuerySchema.safeParse({ limit });
    expect(result.success).toBe(false);
  });
});
