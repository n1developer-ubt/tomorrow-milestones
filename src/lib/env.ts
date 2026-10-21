import "server-only";
import { z } from "zod";

export type Env = z.infer<typeof EnvSchema>;

const EnvSchema = z.object({
  LLM_PROVIDER: z.string().min(1).default("openai"),
  LLM_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(2000),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  LLM_MAX_RETRIES: z.coerce.number().int().min(0).default(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default("gpt-5-nano"),
  OPENAI_REASONING_EFFORT: z
    .enum(["minimal", "low", "medium", "high"])
    .default("minimal"),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1).default("tomorrow_milestones"),
  BASIC_AUTH_USER: z.string().optional(),
  BASIC_AUTH_PASSWORD: z.string().optional(),
});

let cachedEnv: Env | undefined;

export function getEnv(): Env {
  cachedEnv ??= EnvSchema.parse(process.env);
  return cachedEnv;
}
