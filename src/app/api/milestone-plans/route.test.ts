import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLlm } from "@/lib/ai/chat-model";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import { getMilestonePlanRepository } from "@/lib/storage";
import { fakeLlm } from "@/test/fake-model";
import { InMemoryMilestonePlanRepository } from "@/test/fake-repository";
import {
  generationRequestFactory,
  savedMilestoneFactory,
  tokenUsageFactory,
} from "@/test/factories";
import { jsonRequest } from "@/test/http";
import { POST } from "./route";

vi.mock("@/lib/ai/chat-model", () => ({ getLlm: vi.fn() }));
vi.mock("@/lib/storage", () => ({ getMilestonePlanRepository: vi.fn() }));

let repository: InMemoryMilestonePlanRepository;

beforeEach(() => {
  repository = new InMemoryMilestonePlanRepository();
  vi.mocked(getMilestonePlanRepository).mockResolvedValue(repository);
  vi.mocked(getLlm).mockReturnValue(fakeLlm().llm);
});

describe("POST /api/milestone-plans", () => {
  it("saves accepted milestones with prompt version, model and token usage", async () => {
    const request = generationRequestFactory.build();
    const milestones = savedMilestoneFactory.buildList(2);
    const tokenUsage = tokenUsageFactory.build();

    const response = await POST(
      jsonRequest({ request, milestones, tokenUsage }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      ...request,
      milestones,
      tokenUsage,
      promptVersion: PROMPT_VERSION,
      model: "fake-model",
    });
    expect(repository.plans.has(body.data.id)).toBe(true);
  });

  it("strips review-only fields before saving", async () => {
    const milestone = {
      ...savedMilestoneFactory.build(),
      id: "m1",
      locked: true,
    };

    await POST(
      jsonRequest({
        request: generationRequestFactory.build(),
        milestones: [milestone],
        tokenUsage: tokenUsageFactory.build(),
      }),
    );

    const [saved] = [...repository.plans.values()];
    expect(saved?.milestones[0]).not.toHaveProperty("id");
    expect(saved?.milestones[0]).not.toHaveProperty("locked");
  });

  it("rejects saving without accepted milestones", async () => {
    const response = await POST(
      jsonRequest({
        request: generationRequestFactory.build(),
        milestones: [],
        tokenUsage: tokenUsageFactory.build(),
      }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.issues).toEqual([
      {
        path: "milestones",
        message: "Accept at least one milestone before saving",
      },
    ]);
    expect(repository.plans.size).toBe(0);
  });
});
