import { describe, expect, it, vi } from "vitest";
import { getLlm } from "@/lib/ai/chat-model";
import { fakeLlm } from "@/test/fake-model";
import {
  draftMilestoneFactory,
  generationRequestFactory,
  milestoneFactory,
} from "@/test/factories";
import { jsonRequest } from "@/test/http";
import { POST } from "./route";

vi.mock("@/lib/ai/chat-model", () => ({ getLlm: vi.fn() }));

const request = generationRequestFactory.build();

describe("POST /api/milestones/refine-item", () => {
  it("returns the refined milestone with the same id", async () => {
    const target = draftMilestoneFactory.build();
    const rewritten = milestoneFactory.build();
    vi.mocked(getLlm).mockReturnValue(fakeLlm(rewritten).llm);

    const response = await POST(
      jsonRequest({
        request,
        milestones: [target],
        targetId: target.id,
        mode: "custom",
        instruction: "Focus on the cafeteria",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.milestone).toEqual({
      ...rewritten,
      id: target.id,
      locked: false,
    });
  });

  it("requires an instruction for custom mode", async () => {
    const target = draftMilestoneFactory.build();

    const response = await POST(
      jsonRequest({
        request,
        milestones: [target],
        targetId: target.id,
        mode: "custom",
      }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.issues).toEqual([
      { path: "instruction", message: "Custom refine needs an instruction" },
    ]);
  });
});
