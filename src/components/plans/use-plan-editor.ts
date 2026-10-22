"use client";

import { useState } from "react";
import {
  planClient,
  type ClientError,
  type ClientResult,
} from "@/lib/client/plan-client";
import type { MilestoneChange } from "@/lib/milestones/review";
import type { RefineMode, ReviewCommand } from "@/lib/milestones/schemas";
import type { MilestonePlanDto } from "@/lib/repository/repository";

export type PendingAction =
  | { kind: "review"; milestoneId: string }
  | { kind: "refineAll" }
  | { kind: "refineMilestone"; milestoneId: string }
  | { kind: "publish" };

export type PlanEditor = ReturnType<typeof usePlanEditor>;

export function usePlanEditor(
  initialPlan: MilestonePlanDto,
  onError: (error: ClientError) => void = () => {},
) {
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
      onError(result.error);
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
        {
          kind: "review",
          milestoneId: "milestoneId" in command ? command.milestoneId : "",
        },
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
