import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { vi } from "vitest";
import type { Llm } from "@/lib/ai/llm";

export type FakeLlm = ReturnType<typeof fakeLlm>;

export const FAKE_USAGE_PER_CALL = {
  input_tokens: 100,
  output_tokens: 50,
  total_tokens: 150,
};

export function fakeLlm(...responses: (string | object | Error)[]) {
  const invoke = vi.fn<(messages: BaseMessage[]) => Promise<unknown>>();
  for (const response of responses) {
    if (response instanceof Error) {
      invoke.mockRejectedValueOnce(response);
      continue;
    }
    const text =
      typeof response === "string" ? response : JSON.stringify(response);
    invoke.mockResolvedValueOnce({
      raw: new AIMessage({
        content: text,
        usage_metadata: FAKE_USAGE_PER_CALL,
      }),
      parsed: null,
    });
  }
  const withStructuredOutput = vi.fn(() => ({ invoke }));
  const model = { withStructuredOutput } as unknown as BaseChatModel;
  const llm: Llm = { model, modelName: "fake-model", maxValidationAttempts: 2 };
  return { llm, invoke, withStructuredOutput };
}

export function sentMessages(
  invoke: FakeLlm["invoke"],
  call: number,
): { type: string; text: string }[] {
  const messages = invoke.mock.calls[call]?.[0] ?? [];
  return messages.map((m) => ({ type: m.getType(), text: m.text }));
}
