import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMilestonePlanRepository } from "@/lib/storage";
import { InMemoryMilestonePlanRepository } from "@/test/fake-repository";
import { newMilestonePlanFactory } from "@/test/factories";
import { GET } from "./route";

vi.mock("@/lib/storage", () => ({ getMilestonePlanRepository: vi.fn() }));

let repository: InMemoryMilestonePlanRepository;

beforeEach(() => {
  repository = new InMemoryMilestonePlanRepository();
  vi.mocked(getMilestonePlanRepository).mockResolvedValue(repository);
});

function get(id: string) {
  return GET(new Request(`http://localhost/api/milestone-plans/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /api/milestone-plans/:id", () => {
  it("returns a saved plan", async () => {
    const plan = await repository.create(newMilestonePlanFactory.build());

    const response = await get(plan.id);

    expect(response.status).toBe(200);
    expect((await response.json()).data.id).toBe(plan.id);
  });

  it("returns 404 for an unknown plan", async () => {
    const response = await get("missing");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      success: false,
      error: { code: "not_found", message: "This plan could not be found." },
    });
  });
});
