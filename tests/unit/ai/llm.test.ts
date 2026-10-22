import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fakeLlm, sentMessages } from "@/test/fake-model";
import { AiError, callLlmWithValidation, type Llm } from "@/lib/ai/llm";

const Schema = z.object({ value: z.number().min(1) });

async function run(llm: Llm) {
  const { value } = await callWithUsage(llm);
  return value;
}

function callWithUsage(llm: Llm) {
  return callLlmWithValidation({
    llm,
    prompt: "prompt",
    schemaName: "test",
    outputSchema: Schema,
    validate: (output) => {
      const result = Schema.safeParse(output);
      return result.success
        ? { ok: true, value: result.data.value }
        : { ok: false, issues: ["value: too small"] };
    },
  });
}

describe("callLlmWithValidation", () => {
  it("returns the value when the first response is valid", async () => {
    const { llm, invoke } = fakeLlm({ value: 3 });
    await expect(run(llm)).resolves.toBe(3);
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("requests strict structured output with the schema name", async () => {
    const { llm, withStructuredOutput } = fakeLlm({ value: 3 });
    await run(llm);
    expect(withStructuredOutput).toHaveBeenCalledWith(Schema, {
      name: "test",
      includeRaw: true,
      strict: true,
    });
  });

  it("retries with the validation issues as feedback", async () => {
    const { llm, invoke } = fakeLlm({ value: 0 }, { value: 2 });
    await expect(run(llm)).resolves.toBe(2);

    const retry = sentMessages(invoke, 1);
    expect(retry.at(-2)).toEqual({ type: "ai", text: '{"value":0}' });
    expect(retry.at(-1)?.text).toContain("value: too small");
  });

  it("sums token usage across attempts", async () => {
    const { llm } = fakeLlm({ value: 0 }, { value: 2 });
    const { usage } = await callWithUsage(llm);
    expect(usage).toEqual({
      inputTokens: 200,
      outputTokens: 100,
      totalTokens: 300,
    });
  });

  it("treats non-JSON output as invalid", async () => {
    const { llm } = fakeLlm("not json", { value: 1 });
    await expect(run(llm)).resolves.toBe(1);
  });

  it("throws invalid_output when every attempt is invalid", async () => {
    const { llm } = fakeLlm({ value: 0 }, { value: 0 });
    await expect(run(llm)).rejects.toMatchObject({ code: "invalid_output" });
  });

  it("uses the configured number of attempts", async () => {
    const { llm, invoke } = fakeLlm({ value: 0 }, { value: 0 }, { value: 4 });
    await expect(run({ ...llm, maxValidationAttempts: 3 })).resolves.toBe(4);
    expect(invoke).toHaveBeenCalledTimes(3);
  });

  it("maps provider errors and does not retry them", async () => {
    const timeout = Object.assign(new Error("timed out"), {
      name: "TimeoutError",
    });
    const { llm, invoke } = fakeLlm(timeout);
    await expect(run(llm)).rejects.toMatchObject({ code: "timeout" });
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("passes AiErrors through unchanged", async () => {
    const { llm } = fakeLlm(new AiError("rate_limited"));
    await expect(run(llm)).rejects.toMatchObject({ code: "rate_limited" });
  });
});
