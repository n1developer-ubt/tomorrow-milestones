import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import type { z } from "zod";
import type { ValidationResult } from "@/lib/validation/validation-result";
import { AiError, toAiError } from "./errors";
import { buildRetryPrompt, SYSTEM_PROMPT } from "./prompts";

export type Llm = {
  model: BaseChatModel;
  maxValidationAttempts: number;
};

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
}: LlmCallParams<T>): Promise<T> {
  const structured = llm.model.withStructuredOutput(outputSchema, {
    name: schemaName,
    includeRaw: true,
    strict: true,
  });
  const messages: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(prompt),
  ];
  let issues: string[] = [];

  for (let attempt = 1; attempt <= llm.maxValidationAttempts; attempt++) {
    const { raw } = await structured.invoke(messages).catch((error) => {
      throw toAiError(error);
    });
    const result = validate(parseJson(raw.text));
    if (result.ok) return result.value;

    issues = result.issues;
    messages.push(
      new AIMessage(raw.text),
      new HumanMessage(buildRetryPrompt(issues)),
    );
  }

  throw new AiError("invalid_output", issues.join("; "));
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
