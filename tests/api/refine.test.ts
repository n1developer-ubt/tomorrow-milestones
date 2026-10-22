import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as refineMilestone } from "@/app/api/milestone-plans/[id]/milestones/[milestoneId]/refine/route";
import { POST as refineAll } from "@/app/api/milestone-plans/[id]/refine/route";
import { getPlanDeps } from "@/lib/services/plan-deps";
import { fakeLlm } from "@/test/fake-model";
import { InMemoryMilestonePlanRepository } from "@/test/fake-repository";
import {
  milestoneFactory,
  newMilestonePlanFactory,
  toOutput,
} from "@/test/factories";
import { jsonRequest, params } from "@/test/http";

vi.mock("@/lib/services/plan-deps", () => ({ getPlanDeps: vi.fn() }));

let repository: InMemoryMilestonePlanRepository;

beforeEach(() => {
  repository = new InMemoryMilestonePlanRepository();
});

describe("POST /api/milestone-plans/:id/refine", () => {
  it("returns the updated plan with the changes", async () => {
    const plan = await repository.create(newMilestonePlanFactory.build());
    vi.mocked(getPlanDeps).mockResolvedValue({
      llm: fakeLlm({
        milestones: plan.milestones.map((card) => toOutput(card.milestone)),
      }).llm,
      repository,
    });

    const response = await refineAll(
      jsonRequest({ instruction: "Unrelated question" }),
      params({ id: plan.id }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.changes.map((c: { kind: string }) => c.kind)).toEqual([
      "unchanged",
      "unchanged",
    ]);
    expect(body.data.plan.id).toBe(plan.id);
  });

  it("requires an instruction", async () => {
    const response = await refineAll(jsonRequest({}), params({ id: "x" }));

    expect(response.status).toBe(400);
  });
});

describe("POST /api/milestone-plans/:id/milestones/:milestoneId/refine", () => {
  it("returns the plan with the refined milestone", async () => {
    const plan = await repository.create(newMilestonePlanFactory.build());
    const target = plan.milestones[0]!.milestone;
    const rewritten = milestoneFactory.build();
    vi.mocked(getPlanDeps).mockResolvedValue({
      llm: fakeLlm(rewritten).llm,
      repository,
    });

    const response = await refineMilestone(
      jsonRequest({ mode: "custom", instruction: "Focus on food" }),
      params({ id: plan.id, milestoneId: target.id }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.milestones[0].milestone).toMatchObject(rewritten);
  });

  it("requires an instruction for custom mode", async () => {
    const response = await refineMilestone(
      jsonRequest({ mode: "custom" }),
      params({ id: "x", milestoneId: "m1" }),
    );

    expect((await response.json()).error.issues).toEqual([
      { path: "instruction", message: "Custom refine needs an instruction" },
    ]);
  });
});
