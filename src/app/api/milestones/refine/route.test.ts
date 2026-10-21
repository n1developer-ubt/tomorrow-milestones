import { describe, expect, it, vi } from "vitest";
import { getLlm } from "@/lib/ai/chat-model";
import { fakeLlm } from "@/test/fake-model";
import {
  draftMilestoneFactory,
  generationRequestFactory,
  toOutput,
} from "@/test/factories";
import { jsonRequest } from "@/test/http";
import { POST } from "./route";

vi.mock("@/lib/ai/chat-model", () => ({ getLlm: vi.fn() }));

describe("POST /api/milestones/refine", () => {
  it("returns refined milestones with changes", async () => {
    const milestones = draftMilestoneFactory.buildList(2);
    vi.mocked(getLlm).mockReturnValue(
      fakeLlm({ milestones: milestones.map(toOutput) }).llm,
    );

    const response = await POST(
      jsonRequest({
        request: generationRequestFactory.build(),
        milestones,
        instruction: "Keep everything as it is",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.changes.map((c: { kind: string }) => c.kind)).toEqual([
      "unchanged",
      "unchanged",
    ]);
  });

  it("rejects a missing instruction", async () => {
    const response = await POST(
      jsonRequest({
        request: generationRequestFactory.build(),
        milestones: draftMilestoneFactory.buildList(2),
      }),
    );

    expect(response.status).toBe(400);
  });
});
