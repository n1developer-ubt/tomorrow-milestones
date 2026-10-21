import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLlm } from "@/lib/ai/chat-model";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import { getMilestonePlanRepository } from "@/lib/storage";
import { fakeLlm } from "@/test/fake-model";
import { InMemoryMilestonePlanRepository } from "@/test/fake-repository";
import {
  generationRequestFactory,
  newMilestonePlanFactory,
  savedMilestoneFactory,
  tokenUsageFactory,
} from "@/test/factories";
import { jsonRequest } from "@/test/http";
import { GET, POST } from "./route";

vi.mock("@/lib/ai/chat-model", () => ({ getLlm: vi.fn() }));
vi.mock("@/lib/storage", () => ({ getMilestonePlanRepository: vi.fn() }));

let repository: InMemoryMilestonePlanRepository;

beforeEach(() => {
  repository = new InMemoryMilestonePlanRepository();
  vi.mocked(getMilestonePlanRepository).mockResolvedValue(repository);
  vi.mocked(getLlm).mockReturnValue(fakeLlm().llm);
});

function list(query = "") {
  return GET(new Request(`http://localhost/api/milestone-plans${query}`));
}

describe("GET /api/milestone-plans", () => {
  it("lists saved plans newest first", async () => {
    const first = await repository.create(newMilestonePlanFactory.build());
    const second = await repository.create(newMilestonePlanFactory.build());

    const response = await list();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.map((p: { id: string }) => p.id)).toEqual([
      second.id,
      first.id,
    ]);
  });

  it("respects the limit", async () => {
    await repository.create(newMilestonePlanFactory.build());
    await repository.create(newMilestonePlanFactory.build());

    const body = await (await list("?limit=1")).json();

    expect(body.data).toHaveLength(1);
  });

  it.each(["0", "101", "abc"])("rejects limit=%s", async (limit) => {
    const response = await list(`?limit=${limit}`);

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("validation");
  });
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
