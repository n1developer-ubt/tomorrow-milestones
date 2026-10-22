import { describe, expect, it } from "vitest";
import { generationRequestFactory } from "@/test/factories";
import { GenerationRequestSchema } from "@/lib/milestones/schemas";

describe("GenerationRequestSchema", () => {
  it("accepts valid input", () => {
    const input = generationRequestFactory.build();
    expect(GenerationRequestSchema.safeParse(input).success).toBe(true);
  });

  it("trims whitespace before validating", () => {
    const input = generationRequestFactory.build();
    const result = GenerationRequestSchema.parse({
      ...input,
      title: `  ${input.title}  `,
    });
    expect(result.title).toBe(input.title);
  });

  it.each([
    ["a whitespace-only title", { title: "        " }],
    ["a brief that is too short", { brief: "Too short" }],
    ["a brief that is too long", { brief: "a".repeat(4001) }],
  ])("rejects %s", (_, overrides) => {
    const input = generationRequestFactory.build(overrides);
    expect(GenerationRequestSchema.safeParse(input).success).toBe(false);
  });
});
