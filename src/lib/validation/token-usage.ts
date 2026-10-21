import { z } from "zod";

export type TokenUsage = z.infer<typeof TokenUsageSchema>;

const TokenCount = z.number().int().min(0);

export const TokenUsageSchema = z.object({
  inputTokens: TokenCount,
  outputTokens: TokenCount,
  totalTokens: TokenCount,
});

export const EMPTY_TOKEN_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
};

export function addTokenUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    totalTokens: a.totalTokens + b.totalTokens,
  };
}
