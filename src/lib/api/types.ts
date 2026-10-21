import type { NextResponse } from "next/server";
import type { AiErrorCode } from "@/lib/ai/errors";

export type ApiErrorCode =
  AiErrorCode | "invalid_json" | "validation" | "not_found" | "internal_error";

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
