import "server-only";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { getEnv, type Env } from "@/lib/env";
import type { Llm } from "./structured-llm-call";

export function createChatModel(env: Env): BaseChatModel {
  switch (env.LLM_PROVIDER) {
    case "openai":
      return new ChatOpenAI({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
        reasoning: { effort: env.OPENAI_REASONING_EFFORT },
        maxTokens: env.LLM_MAX_OUTPUT_TOKENS,
        timeout: env.LLM_TIMEOUT_MS,
        maxRetries: env.LLM_MAX_RETRIES,
      });
    default:
      throw new Error(
        `LLM provider "${env.LLM_PROVIDER}" is not supported. Supported: openai`,
      );
  }
}

let llm: Llm | undefined;

export function getLlm(): Llm {
  const env = getEnv();
  llm ??= {
    model: createChatModel(env),
    maxValidationAttempts: env.LLM_MAX_VALIDATION_ATTEMPTS,
  };
  return llm;
}
