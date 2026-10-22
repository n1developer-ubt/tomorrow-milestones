import { NextResponse } from "next/server";
import type { z } from "zod";
import { translate } from "@/i18n/translate";
import { AiError, type AiErrorCode } from "@/lib/ai/llm";
import { PlanError, type PlanErrorCode } from "@/lib/services/plan-service";

export type ApiErrorCode =
  | AiErrorCode
  | PlanErrorCode
  | "invalid_json"
  | "validation"
  | "internal_error";

export type RouteContext<P> = { params: Promise<P> };

export type ApiIssue = { path: string; message: string };

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  issues?: ApiIssue[];
};

export type ApiResponse<T> =
  { success: true; data: T } | { success: false; error: ApiError };

export type ValidatedInput<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<ApiResponse<never>> };

type NoParams = Record<string, never>;

type Route<P> = (
  request: Request,
  context: RouteContext<P>,
) => Promise<Response>;

const AI_ERROR_STATUS: Record<AiErrorCode, number> = {
  timeout: 504,
  rate_limited: 429,
  invalid_output: 502,
  provider_error: 502,
  brief_unclear: 422,
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

export async function validateBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<ValidatedInput<z.infer<T>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: failure(400, "invalid_json") };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false, response: validationFailure(result.error) };
  }
  return { ok: true, data: result.data };
}

export function validateQuery<T extends z.ZodType>(
  request: Request,
  schema: T,
): ValidatedInput<z.infer<T>> {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const result = schema.safeParse(query);
  if (!result.success) {
    return { ok: false, response: validationFailure(result.error) };
  }
  return { ok: true, data: result.data };
}

export function withErrorHandling<P = NoParams>(
  handler: (request: Request, params: P) => Promise<Response>,
): Route<P> {
  return async (request, context) => {
    try {
      return await handler(request, await context.params);
    } catch (error) {
      return handleRouteError(error);
    }
  };
}

export function validatedRoute<T extends z.ZodType, P = NoParams>(
  schema: T,
  handler: (data: z.infer<T>, params: P) => Promise<Response>,
): Route<P> {
  return withErrorHandling<P>(async (request, params) => {
    const body = await validateBody(request, schema);
    if (!body.ok) return body.response;
    return handler(body.data, params);
  });
}

export function validatedQueryRoute<T extends z.ZodType, P = NoParams>(
  schema: T,
  handler: (query: z.infer<T>, params: P) => Promise<Response>,
): Route<P> {
  return withErrorHandling<P>(async (request, params) => {
    const query = validateQuery(request, schema);
    if (!query.ok) return query.response;
    return handler(query.data, params);
  });
}

function isAiErrorCode(code: ApiErrorCode): code is AiErrorCode {
  return code in AI_ERROR_STATUS;
}
