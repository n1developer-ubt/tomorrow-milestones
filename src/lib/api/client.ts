import type { ApiError, ApiResponse } from "./types";

export type ClientError = ApiError | { code: "network"; message?: undefined };

export type ClientResult<T> =
  { success: true; data: T } | { success: false; error: ClientError };

export function postJson<T>(
  url: string,
  body: unknown,
): Promise<ClientResult<T>> {
  return requestJson<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteJson<T>(url: string): Promise<ClientResult<T>> {
  return requestJson<T>(url, { method: "DELETE" });
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
): Promise<ClientResult<T>> {
  try {
    const response = await fetch(url, init);
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return { success: false, error: { code: "network" } };
  }
}
