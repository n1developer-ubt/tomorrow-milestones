export type AiErrorCode =
  | "timeout"
  | "rate_limited"
  | "invalid_output"
  | "provider_error"
  | "brief_unclear";

type ProviderError = { name?: string; status?: number; lc_error_code?: string };

export class AiError extends Error {
  constructor(
    readonly code: AiErrorCode,
    detail?: string,
  ) {
    super(detail ?? code);
    this.name = "AiError";
  }
}

export function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  const { name, status, lc_error_code } = (error ?? {}) as ProviderError;
  if (name === "TimeoutError") return new AiError("timeout");
  if (status === 429 || lc_error_code === "MODEL_RATE_LIMIT") {
    return new AiError("rate_limited");
  }
  const detail = error instanceof Error ? error.message : String(error);
  return new AiError("provider_error", detail);
}
