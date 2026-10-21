import {
  generateMilestones,
  refineMilestone,
  refineMilestoneSet,
} from "@/lib/ai/milestone-ai";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import type { Llm } from "@/lib/ai/structured-llm-call";
import type { MilestoneChange } from "@/lib/milestones/diff";
import {
  draftMilestones,
  INITIAL_REVIEW_STATE,
  reviewReducer,
  type ReviewAction,
  type ReviewState,
} from "@/lib/review/review-reducer";
import type {
  MilestonePlan,
  MilestonePlanRepository,
} from "@/lib/storage/milestone-plan-repository";
import type { GenerationRequest } from "@/lib/validation/generation-request";
import type { RefinePlanMilestoneBody } from "@/lib/validation/refine-request";
import type { ReviewCommand } from "@/lib/validation/review-command";
import { PlanError } from "./plan-error";

export type PlanDeps = {
  llm: Llm;
  repository: MilestonePlanRepository;
  now?: () => Date;
};

export type RefinedPlan = { plan: MilestonePlan; changes: MilestoneChange[] };

export async function createPlan(
  { llm, repository }: PlanDeps,
  request: GenerationRequest,
): Promise<MilestonePlan> {
  const { milestones, usage } = await generateMilestones(llm, request);
  const state = reviewReducer(INITIAL_REVIEW_STATE, {
    type: "generated",
    milestones,
    usage,
  });
  return repository.create({
    ...request,
    status: "draft",
    milestones: state.cards,
    removed: state.removed,
    tokenUsage: state.usage,
    promptVersion: PROMPT_VERSION,
    model: llm.modelName,
    publishedAt: null,
  });
}

export async function refinePlan(
  { llm, repository }: PlanDeps,
  id: string,
  instruction: string,
): Promise<RefinedPlan> {
  const plan = await loadDraft(repository, id);
  const state = toReviewState(plan);
  const refined = await refineMilestoneSet(llm, {
    request: toRequest(plan),
    milestones: draftMilestones(state),
    instruction,
  });
  const updated = await repository.update(
    applyAction(plan, { type: "refinedSet", ...refined }),
  );
  return { plan: updated, changes: refined.changes };
}

export async function refinePlanMilestone(
  { llm, repository }: PlanDeps,
  id: string,
  milestoneId: string,
  { mode, instruction }: RefinePlanMilestoneBody,
): Promise<MilestonePlan> {
  const plan = await loadDraft(repository, id);
  const milestones = draftMilestones(toReviewState(plan));
  if (!milestones.some((m) => m.id === milestoneId)) {
    throw new PlanError("milestone_not_found");
  }
  const { milestone, usage } = await refineMilestone(llm, {
    request: toRequest(plan),
    milestones,
    targetId: milestoneId,
    mode,
    instruction,
  });
  return repository.update(
    applyAction(plan, { type: "refinedItem", milestone, usage }),
  );
}

export async function reviewPlan(
  { repository }: Pick<PlanDeps, "repository">,
  id: string,
  command: ReviewCommand,
): Promise<MilestonePlan> {
  const plan = await loadDraft(repository, id);
  if (command.type === "acceptAll") {
    return repository.update(applyAction(plan, { type: "acceptAll" }));
  }
  const ids =
    command.type === "restoreRemoved"
      ? plan.removed.map((m) => m.id)
      : plan.milestones.map((card) => card.milestone.id);
  if (!ids.includes(command.milestoneId)) {
    throw new PlanError("milestone_not_found");
  }
  return repository.update(applyAction(plan, toReviewAction(command)));
}

export async function publishPlan(
  { repository, now = () => new Date() }: Pick<PlanDeps, "repository" | "now">,
  id: string,
): Promise<MilestonePlan> {
  const plan = await loadDraft(repository, id);
  if (!plan.milestones.some((card) => card.status === "accepted")) {
    throw new PlanError("nothing_accepted");
  }
  return repository.update({
    ...plan,
    status: "published",
    publishedAt: now(),
  });
}

async function loadDraft(
  repository: MilestonePlanRepository,
  id: string,
): Promise<MilestonePlan> {
  const plan = await repository.findById(id);
  if (!plan) throw new PlanError("not_found");
  if (plan.status === "published") throw new PlanError("plan_published");
  return plan;
}

function toRequest({ title, brief }: MilestonePlan): GenerationRequest {
  return { title, brief };
}

function toReviewState(plan: MilestonePlan): ReviewState {
  return {
    cards: plan.milestones,
    removed: plan.removed,
    usage: plan.tokenUsage,
  };
}

function applyAction(plan: MilestonePlan, action: ReviewAction): MilestonePlan {
  const { cards, removed, usage } = reviewReducer(toReviewState(plan), action);
  return { ...plan, milestones: cards, removed, tokenUsage: usage };
}

function toReviewAction(
  command: Exclude<ReviewCommand, { type: "acceptAll" }>,
): ReviewAction {
  switch (command.type) {
    case "setStatus":
      return {
        type: "setStatus",
        id: command.milestoneId,
        status: command.status,
      };
    case "edit":
      return { type: "edit", id: command.milestoneId, text: command.text };
    case "revert":
      return { type: "revert", id: command.milestoneId };
    case "restoreRemoved":
      return { type: "restoreRemoved", id: command.milestoneId };
  }
}
