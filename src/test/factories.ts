import { Factory } from "fishery";
import type { NewMilestonePlan } from "@/lib/storage/milestone-plan-repository";
import type { GenerationRequest } from "@/lib/validation/generation-request";
import type { DraftMilestone, Milestone } from "@/lib/validation/milestone";
import type { SavedMilestone } from "@/lib/validation/milestone-plan";
import type { TokenUsage } from "@/lib/validation/token-usage";

export type MilestoneOutput = Milestone & { id: string | null };

export const generationRequestFactory = Factory.define<GenerationRequest>(
  () => ({
    title: "Design a zero-waste campus",
    brief:
      "Students research waste streams on campus and propose a realistic reduction plan.",
  }),
);

export const milestoneFactory = Factory.define<Milestone>(({ sequence }) => ({
  title: `Milestone number ${sequence}`,
  description: `Learners complete concrete task number ${sequence} and document the outcome in a short report.`,
}));

export const draftMilestoneFactory = Factory.define<DraftMilestone>(
  ({ sequence }) => ({
    ...milestoneFactory.build(),
    id: `m${sequence}`,
    locked: false,
  }),
);

export const tokenUsageFactory = Factory.define<TokenUsage>(() => ({
  inputTokens: 300,
  outputTokens: 120,
  totalTokens: 420,
}));

export const savedMilestoneFactory = Factory.define<SavedMilestone>(() => ({
  ...milestoneFactory.build(),
  edited: false,
}));

export const newMilestonePlanFactory = Factory.define<NewMilestonePlan>(() => ({
  ...generationRequestFactory.build(),
  milestones: savedMilestoneFactory.buildList(2),
  promptVersion: "test-version",
  model: "gpt-5-nano",
  tokenUsage: tokenUsageFactory.build(),
}));

export function toOutput({
  id,
  title,
  description,
}: DraftMilestone): MilestoneOutput {
  return { id, title, description };
}
