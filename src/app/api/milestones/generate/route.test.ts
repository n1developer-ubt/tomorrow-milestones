import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLlm } from "@/lib/ai/chat-model";
import { fakeLlm } from "@/test/fake-model";
import { generationRequestFactory, milestoneFactory } from "@/test/factories";
import { jsonRequest } from "@/test/http";
import { POST } from "./route";

vi.mock("@/lib/ai/chat-model", () => ({ getLlm: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/milestones/generate", () => {
  it("returns generated milestones and token usage", async () => {
    vi.mocked(getLlm).mockReturnValue(
      fakeLlm({ milestones: milestoneFactory.buildList(3) }).llm,
    );

    const response = await POST(jsonRequest(generationRequestFactory.build()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.milestones).toHaveLength(3);
    expect(body.data.usage.totalTokens).toBe(150);
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(jsonRequest("{not json"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "invalid_json",
        message: "The request could not be read. Please try again.",
      },
    });
  });

  it("returns translated validation issues", async () => {
    const response = await POST(
      jsonRequest(generationRequestFactory.build({ brief: "short" })),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "validation",
        message: "Some fields are not valid. Please check them.",
        issues: [{ path: "brief", message: "Brief needs more detail" }],
      },
    });
  });

  it("maps AI timeouts to 504", async () => {
    const timeout = Object.assign(new Error("timed out"), {
      name: "TimeoutError",
    });
    vi.mocked(getLlm).mockReturnValue(fakeLlm(timeout).llm);

    const response = await POST(jsonRequest(generationRequestFactory.build()));

    expect(response.status).toBe(504);
    expect((await response.json()).error).toEqual({
      code: "timeout",
      message: "The AI took too long to respond. Please try again.",
    });
  });

  it("maps unusable AI output to 502", async () => {
    vi.mocked(getLlm).mockReturnValue(fakeLlm("bad", "bad").llm);

    const response = await POST(jsonRequest(generationRequestFactory.build()));

    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("invalid_output");
  });
});
