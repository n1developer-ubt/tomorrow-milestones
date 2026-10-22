import "server-only";
import { getLlm } from "@/lib/ai/model";
import { getMilestonePlanRepository } from "@/lib/repository";
import type { PlanDeps } from "./plan-service";

export async function getPlanDeps(): Promise<PlanDeps> {
  return { llm: getLlm(), repository: await getMilestonePlanRepository() };
}
