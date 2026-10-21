import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
  AIMessage,
  HumanMessage,
  isAIMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import type { z } from "zod";
import {
  addTokenUsage,
  EMPTY_TOKEN_USAGE,
  type TokenUsage,
} from "@/lib/validation/token-usage";
import type { ValidationResult } from "@/lib/validation/validation-result";
import { AiError, toAiError } from "./errors";
import { buildRetryPrompt, SYSTEM_PROMPT } from "./prompts";

export type Llm = {
  model: BaseChatModel;
  maxValidationAttempts: number;
};

export type LlmResult<T> = { value: T; usage: TokenUsage };

type LlmCallParams<T> = {
  llm: Llm;
  prompt: string;
  schemaName: string;
  outputSchema: z.ZodObject;
  validate: (output: unknown) => ValidationResult<T>;
};

export async function callLlmWithValidation<T>({
  llm,
  prompt,
  schemaName,
  outputSchema,
  validate,
}: LlmCallParams<T>): Promise<LlmResult<T>> {
  const structured = llm.model.withStructuredOutput(outputSchema, {
    name: schemaName,
    includeRaw: true,
    strict: true,
  });
  const messages: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(prompt),
  ];
  let usage = EMPTY_TOKEN_USAGE;
  let issues: string[] = [];

  for (let attempt = 1; attempt <= llm.maxValidationAttempts; attempt++) {
    const { raw } = await structured.invoke(messages).catch((error) => {
      throw toAiError(error);
    });
    usage = addTokenUsage(usage, toTokenUsage(raw));
    const result = validate(parseJson(raw.text));
    if (result.ok) return { value: result.value, usage };

    issues = result.issues;
    messages.push(
      new AIMessage(raw.text),
      new HumanMessage(buildRetryPrompt(issues)),
    );
  }

  throw new AiError("invalid_output", issues.join("; "));
}

function toTokenUsage(message: BaseMessage): TokenUsage {
  const usage = isAIMessage(message) ? message.usage_metadata : undefined;
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
