import { describe, expect, it } from "vitest";
import { GenerationRequestSchema } from "./generation-request";

const validInput = {
  title: "Design a zero-waste campus",
  brief:
    "Students research waste streams on campus and propose a realistic reduction plan.",
};

describe("GenerationRequestSchema", () => {
  it("accepts valid input", () => {
    expect(GenerationRequestSchema.safeParse(validInput).success).toBe(true);
  });

  it("trims whitespace before validating", () => {
    const result = GenerationRequestSchema.parse({
      ...validInput,
      title: `  ${validInput.title}  `,
    });
    expect(result.title).toBe(validInput.title);
  });

  it("rejects a whitespace-only title", () => {
    const result = GenerationRequestSchema.safeParse({
      ...validInput,
      title: "        ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a brief that is too short", () => {
    const result = GenerationRequestSchema.safeParse({
      ...validInput,
      brief: "Too short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a brief that is too long", () => {
    const result = GenerationRequestSchema.safeParse({
      ...validInput,
      brief: "a".repeat(4001),
    });
    expect(result.success).toBe(false);
  });
});
