import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiError } from "@/lib/ai/llm";
import { handleRouteError, success } from "@/lib/api/api";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("success", () => {
  it("wraps data in a success envelope", async () => {
    const response = success({ id: "1" }, 201);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      success: true,
      data: { id: "1" },
    });
  });
});

describe("handleRouteError", () => {
  it.each([
    ["timeout", 504],
    ["rate_limited", 429],
    ["invalid_output", 502],
    ["provider_error", 502],
  ] as const)("maps AiError %s to %i with a message", async (code, status) => {
    const response = handleRouteError(new AiError(code));
    const body = await response.json();

    expect(response.status).toBe(status);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(code);
    expect(body.error.message).not.toContain("errors.");
  });

  it("hides unexpected errors behind internal_error", async () => {
    const response = handleRouteError(new Error("database password leaked"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "internal_error",
        message: "Something went wrong. Please try again.",
      },
    });
  });
});
