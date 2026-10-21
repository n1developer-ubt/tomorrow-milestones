import { Factory } from "fishery";
import type { GenerationRequest } from "@/lib/validation/generation-request";
import type { DraftMilestone, Milestone } from "@/lib/validation/milestone";

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

export function toOutput({
  id,
  title,
  description,
}: DraftMilestone): MilestoneOutput {
  return { id, title, description };
}
