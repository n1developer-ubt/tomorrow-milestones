import type { ApiError, ApiResponse } from "./types";

export type ClientError = ApiError | { code: "network"; message?: undefined };

export type ClientResult<T> =
  { success: true; data: T } | { success: false; error: ClientError };

export async function postJson<T>(
  url: string,
  body: unknown,
): Promise<ClientResult<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return { success: false, error: { code: "network" } };
  }
}
