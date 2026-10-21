import type { NextResponse } from "next/server";
import type { AiErrorCode } from "@/lib/ai/errors";
import type { PlanErrorCode } from "@/lib/plans/plan-error";

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
