import "server-only";
import { getLlm } from "@/lib/ai/chat-model";
import { getMilestonePlanRepository } from "@/lib/storage";
import type { PlanDeps } from "./plan-service";

export async function getPlanDeps(): Promise<PlanDeps> {
  return { llm: getLlm(), repository: await getMilestonePlanRepository() };
}
