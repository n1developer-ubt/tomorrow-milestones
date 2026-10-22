import type { ApiError, ApiResponse } from "@/lib/api/api";
import type { MilestoneChange } from "@/lib/milestones/review";
import type {
  GenerationRequest,
  RefineMode,
  ReviewCommand,
} from "@/lib/milestones/schemas";
import type { MilestonePlanDto } from "@/lib/repository/repository";

export type ClientError = ApiError | { code: "network"; message?: undefined };

export type ClientResult<T> =
  { success: true; data: T } | { success: false; error: ClientError };

const BASE = "/api/milestone-plans";

export const planClient = {
  create: (request: GenerationRequest) =>
    postJson<MilestonePlanDto>(BASE, request),

  refine: (id: string, instruction: string) =>
    postJson<{ plan: MilestonePlanDto; changes: MilestoneChange[] }>(
      `${BASE}/${id}/refine`,
      { instruction },
    ),

  refineMilestone: (
    id: string,
    milestoneId: string,
    mode: RefineMode,
    instruction?: string,
  ) =>
    postJson<MilestonePlanDto>(
      `${BASE}/${id}/milestones/${milestoneId}/refine`,
      { mode, instruction },
    ),

  review: (id: string, command: ReviewCommand) =>
    postJson<MilestonePlanDto>(`${BASE}/${id}/review`, command),

  publish: (id: string) =>
    postJson<MilestonePlanDto>(`${BASE}/${id}/publish`, {}),

  remove: (id: string) => deleteJson<{ id: string }>(`${BASE}/${id}`),
};

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
