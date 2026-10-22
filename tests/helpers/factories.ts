import { Factory } from "fishery";
import type { ReviewCard } from "@/lib/milestones/review";
import type {
  DraftMilestone,
  GenerationRequest,
  Milestone,
  TokenUsage,
} from "@/lib/milestones/schemas";
import type { NewMilestonePlan } from "@/lib/repository/repository";

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

export const reviewCardFactory = Factory.define<ReviewCard>(() => ({
  milestone: draftMilestoneFactory.build(),
  status: "pending",
  edited: false,
}));

export const newMilestonePlanFactory = Factory.define<NewMilestonePlan>(() => ({
  ...generationRequestFactory.build(),
  status: "draft",
  milestones: reviewCardFactory.buildList(2),
  removed: [],
  promptVersion: "test-version",
  model: "gpt-5-nano",
  tokenUsage: tokenUsageFactory.build(),
  publishedAt: null,
}));

export function toOutput({
  id,
  title,
  description,
}: DraftMilestone): MilestoneOutput {
  return { id, title, description };
}
