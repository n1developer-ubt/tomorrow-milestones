import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlanDeps } from "@/lib/plans/plan-deps";
import { getMilestonePlanRepository } from "@/lib/storage";
import { fakeLlm } from "@/test/fake-model";
import { InMemoryMilestonePlanRepository } from "@/test/fake-repository";
import {
  generationRequestFactory,
  milestoneFactory,
  newMilestonePlanFactory,
} from "@/test/factories";
import { jsonRequest, noParams } from "@/test/http";
import { GET, POST } from "./route";

vi.mock("@/lib/plans/plan-deps", () => ({ getPlanDeps: vi.fn() }));
vi.mock("@/lib/storage", () => ({ getMilestonePlanRepository: vi.fn() }));

let repository: InMemoryMilestonePlanRepository;

beforeEach(() => {
  repository = new InMemoryMilestonePlanRepository();
  vi.mocked(getMilestonePlanRepository).mockResolvedValue(repository);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function list(query = "") {
  return GET(
    new Request(`http://localhost/api/milestone-plans${query}`),
    noParams,
  );
}

describe("GET /api/milestone-plans", () => {
  it("lists plans newest first", async () => {
    const first = await repository.create(newMilestonePlanFactory.build());
    const second = await repository.create(newMilestonePlanFactory.build());

    const body = await (await list()).json();

    expect(body.data.map((p: { id: string }) => p.id)).toEqual([
      second.id,
      first.id,
    ]);
  });

  it.each(["0", "101", "abc"])("rejects limit=%s", async (limit) => {
    expect((await list(`?limit=${limit}`)).status).toBe(400);
  });
});

describe("POST /api/milestone-plans", () => {
  it("generates milestones and stores them as a draft", async () => {
    vi.mocked(getPlanDeps).mockResolvedValue({
      llm: fakeLlm({ milestones: milestoneFactory.buildList(3) }).llm,
      repository,
    });

    const response = await POST(
      jsonRequest(generationRequestFactory.build()),
      noParams,
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({ status: "draft" });
    expect(body.data.milestones).toHaveLength(3);
    expect(repository.plans.has(body.data.id)).toBe(true);
  });

  it("does not store anything when the AI fails", async () => {
    vi.mocked(getPlanDeps).mockResolvedValue({
      llm: fakeLlm("bad", "bad").llm,
      repository,
    });

    const response = await POST(
      jsonRequest(generationRequestFactory.build()),
      noParams,
    );

    expect(response.status).toBe(502);
    expect(repository.plans.size).toBe(0);
  });

  it("returns translated validation issues", async () => {
    const response = await POST(
      jsonRequest(generationRequestFactory.build({ brief: "short" })),
      noParams,
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.issues).toEqual([
      { path: "brief", message: "Brief needs more detail" },
    ]);
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(jsonRequest("{nope"), noParams);

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("invalid_json");
  });
});
