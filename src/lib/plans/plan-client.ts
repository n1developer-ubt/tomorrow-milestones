import { postJson } from "@/lib/api/client";
import type { MilestoneChange } from "@/lib/milestones/diff";
import type { GenerationRequest } from "@/lib/validation/generation-request";
import type { RefineMode } from "@/lib/validation/refine-request";
import type { ReviewCommand } from "@/lib/validation/review-command";
import type { MilestonePlanDto } from "./plan-dto";

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
};
