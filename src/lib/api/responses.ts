import { NextResponse } from "next/server";
import type { z } from "zod";
import { translate } from "@/i18n/translate";
import { AiError, type AiErrorCode } from "@/lib/ai/errors";
import { PlanError, type PlanErrorCode } from "@/lib/plans/plan-error";
import type { ApiErrorCode, ApiIssue, ApiResponse } from "./types";

const AI_ERROR_STATUS: Record<AiErrorCode, number> = {
  timeout: 504,
  rate_limited: 429,
  invalid_output: 502,
  provider_error: 502,
};

const PLAN_ERROR_STATUS: Record<PlanErrorCode, number> = {
  not_found: 404,
  milestone_not_found: 404,
  plan_published: 409,
  nothing_accepted: 422,
};

export function success<T>(
  data: T,
  status = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function failure(
  status: number,
  code: ApiErrorCode,
  issues?: ApiIssue[],
): NextResponse<ApiResponse<never>> {
  const message = translate(
    `errors.${isAiErrorCode(code) ? "ai" : "api"}.${code}`,
  );
  return NextResponse.json(
    {
      success: false,
      error: issues ? { code, message, issues } : { code, message },
    },
    { status },
  );
}

export function validationFailure(
  error: z.ZodError,
): NextResponse<ApiResponse<never>> {
  return failure(
    400,
    "validation",
    error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: translate(issue.message),
    })),
  );
}

export function handleRouteError(
  error: unknown,
): NextResponse<ApiResponse<never>> {
  if (error instanceof PlanError) {
    return failure(PLAN_ERROR_STATUS[error.code], error.code);
  }
  if (error instanceof AiError) {
    console.error(`[ai] ${error.code}: ${error.message}`);
    return failure(AI_ERROR_STATUS[error.code], error.code);
  }
  console.error("[api] unexpected error", error);
  return failure(500, "internal_error");
}

function isAiErrorCode(code: ApiErrorCode): code is AiErrorCode {
  return code in AI_ERROR_STATUS;
}
