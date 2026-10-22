import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as publish } from "@/app/api/milestone-plans/[id]/publish/route";
import { POST as review } from "@/app/api/milestone-plans/[id]/review/route";
import { GET } from "@/app/api/milestone-plans/[id]/route";
import { getMilestonePlanRepository } from "@/lib/repository";
import { InMemoryMilestonePlanRepository } from "@/test/fake-repository";
import { newMilestonePlanFactory, reviewCardFactory } from "@/test/factories";
import { jsonRequest, params } from "@/test/http";

vi.mock("@/lib/repository", () => ({ getMilestonePlanRepository: vi.fn() }));

let repository: InMemoryMilestonePlanRepository;

beforeEach(() => {
  repository = new InMemoryMilestonePlanRepository();
  vi.mocked(getMilestonePlanRepository).mockResolvedValue(repository);
});

describe("GET /api/milestone-plans/:id", () => {
  it("returns a plan", async () => {
    const plan = await repository.create(newMilestonePlanFactory.build());

    const response = await GET(
      new Request("http://localhost"),
      params({ id: plan.id }),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data.id).toBe(plan.id);
  });

  it("returns 404 for an unknown plan", async () => {
    const response = await GET(
      new Request("http://localhost"),
      params({ id: "x" }),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error).toEqual({
      code: "not_found",
      message: "This plan could not be found.",
    });
  });
});

describe("POST /api/milestone-plans/:id/review", () => {
  it("applies a review command", async () => {
    const plan = await repository.create(newMilestonePlanFactory.build());
    const milestoneId = plan.milestones[0]!.milestone.id;

    const response = await review(
      jsonRequest({ type: "setStatus", milestoneId, status: "accepted" }),
      params({ id: plan.id }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.milestones[0].status).toBe("accepted");
  });

  it("validates the command", async () => {
    const plan = await repository.create(newMilestonePlanFactory.build());

    const response = await review(
      jsonRequest({ type: "setStatus", milestoneId: "m1", status: "maybe" }),
      params({ id: plan.id }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown milestone", async () => {
    const plan = await repository.create(newMilestonePlanFactory.build());

    const response = await review(
      jsonRequest({ type: "revert", milestoneId: "missing" }),
      params({ id: plan.id }),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("milestone_not_found");
  });
});

describe("POST /api/milestone-plans/:id/publish", () => {
  it("publishes a plan with accepted milestones", async () => {
    const plan = await repository.create(
      newMilestonePlanFactory.build({
        milestones: [reviewCardFactory.build({ status: "accepted" })],
      }),
    );

    const response = await publish(
      new Request("http://localhost", { method: "POST" }),
      params({ id: plan.id }),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data.status).toBe("published");
  });

  it("returns 422 without accepted milestones", async () => {
    const plan = await repository.create(newMilestonePlanFactory.build());

    const response = await publish(
      new Request("http://localhost", { method: "POST" }),
      params({ id: plan.id }),
    );

    expect(response.status).toBe(422);
    expect((await response.json()).error.message).toBe(
      "Accept at least one milestone before publishing.",
    );
  });

  it("returns 409 when changing a published plan", async () => {
    const plan = await repository.create(
      newMilestonePlanFactory.build({ status: "published" }),
    );

    const response = await review(
      jsonRequest({
        type: "revert",
        milestoneId: plan.milestones[0]!.milestone.id,
      }),
      params({ id: plan.id }),
    );

    expect(response.status).toBe(409);
  });
});
