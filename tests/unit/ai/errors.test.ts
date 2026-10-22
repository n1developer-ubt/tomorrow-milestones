import { describe, expect, it } from "vitest";
import { toAiError } from "@/lib/ai/llm";

describe("toAiError", () => {
  it.each([
    [{ name: "TimeoutError" }, "timeout"],
    [{ status: 429 }, "rate_limited"],
    [{ lc_error_code: "MODEL_RATE_LIMIT" }, "rate_limited"],
    [{ status: 401, lc_error_code: "MODEL_AUTHENTICATION" }, "provider_error"],
    ["boom", "provider_error"],
  ])("maps %o to %s", (error, code) => {
    expect(toAiError(error).code).toBe(code);
  });
});
