import { describe, expect, it } from "vitest";
import { hasExpectedLengthChange } from "./length-change";

describe("hasExpectedLengthChange", () => {
  it.each([
    ["shorter", "abcdef", "abc", true],
    ["shorter", "abc", "abcdef", false],
    ["shorter", "abc", "xyz", false],
    ["longer", "abc", "abcdef", true],
    ["longer", "abcdef", "abc", false],
    ["custom", "abc", "abc", true],
  ] as const)("%s: %s → %s is %s", (mode, before, after, expected) => {
    expect(hasExpectedLengthChange(mode, before, after)).toBe(expected);
  });
});
