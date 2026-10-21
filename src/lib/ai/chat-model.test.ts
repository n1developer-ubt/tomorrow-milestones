import { ChatOpenAI } from "@langchain/openai";
import { describe, expect, it, vi } from "vitest";
import type { Env } from "@/lib/env";
import { createChatModel } from "./chat-model";

vi.mock("server-only", () => ({}));

const env: Env = {
  LLM_PROVIDER: "openai",
  LLM_MAX_OUTPUT_TOKENS: 2000,
  LLM_TIMEOUT_MS: 30000,
  LLM_MAX_RETRIES: 1,
  LLM_MAX_VALIDATION_ATTEMPTS: 2,
  OPENAI_API_KEY: "sk-test",
  OPENAI_MODEL: "gpt-5-nano",
  OPENAI_REASONING_EFFORT: "minimal",
  MONGODB_URI: "mongodb://localhost:27017",
  MONGODB_DB: "test",
};

describe("createChatModel", () => {
  it("creates an OpenAI model for the openai provider", () => {
    expect(createChatModel(env)).toBeInstanceOf(ChatOpenAI);
  });

  it("rejects unsupported providers", () => {
    expect(() => createChatModel({ ...env, LLM_PROVIDER: "gemini" })).toThrow(
      'LLM provider "gemini" is not supported. Supported: openai',
    );
  });
});
