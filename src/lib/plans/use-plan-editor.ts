"use client";

import { useState } from "react";
import type { ClientError, ClientResult } from "@/lib/api/client";
import type { MilestoneChange } from "@/lib/milestones/diff";
import type { RefineMode } from "@/lib/validation/refine-request";
import type { ReviewCommand } from "@/lib/validation/review-command";
import { planClient } from "./plan-client";
import type { MilestonePlanDto } from "./plan-dto";

export type PendingAction =
  | { kind: "review"; milestoneId: string }
  | { kind: "refineAll" }
  | { kind: "refineMilestone"; milestoneId: string }
  | { kind: "publish" };

export type PlanEditor = ReturnType<typeof usePlanEditor>;

export function usePlanEditor(initialPlan: MilestonePlanDto) {
  const [plan, setPlan] = useState(initialPlan);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [error, setError] = useState<ClientError | null>(null);

  async function run<T>(
    action: PendingAction,
    call: () => Promise<ClientResult<T>>,
    toPlan: (data: T) => MilestonePlanDto,
  ): Promise<T | null> {
    setPending(action);
    setError(null);
    const result = await call();
    setPending(null);
    if (!result.success) {
      setError(result.error);
      return null;
    }
    setPlan(toPlan(result.data));
    return result.data;
  }

  const samePlan = (data: MilestonePlanDto) => data;

  return {
    plan,
    pending,
    error,
    dismissError: () => setError(null),

    review: (command: ReviewCommand) =>
      run(
        { kind: "review", milestoneId: command.milestoneId },
        () => planClient.review(plan.id, command),
        samePlan,
      ),

    refineAll: (instruction: string) =>
      run<{ plan: MilestonePlanDto; changes: MilestoneChange[] }>(
        { kind: "refineAll" },
        () => planClient.refine(plan.id, instruction),
        (data) => data.plan,
      ),

    refineMilestone: (
      milestoneId: string,
      mode: RefineMode,
      instruction?: string,
    ) =>
      run(
        { kind: "refineMilestone", milestoneId },
        () =>
          planClient.refineMilestone(plan.id, milestoneId, mode, instruction),
        samePlan,
      ),

    publish: () =>
      run({ kind: "publish" }, () => planClient.publish(plan.id), samePlan),
  };
}
