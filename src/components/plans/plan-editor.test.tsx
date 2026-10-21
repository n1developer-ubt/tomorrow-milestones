import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reviewCardFactory } from "@/test/factories";
import { planDto } from "@/test/plan-dto-factory";
import { renderWithIntl } from "@/test/render";
import { PlanEditor } from "./plan-editor";

function mockFetch(response: unknown) {
  const fetchMock = vi.fn<
    (url: string, init?: RequestInit) => Promise<Response>
  >(async () => new Response(JSON.stringify(response)));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PlanEditor", () => {
  it("sends a review command and shows the server state", async () => {
    const plan = planDto();
    const first = plan.milestones[0]!;
    const accepted = {
      ...plan,
      milestones: [{ ...first, status: "accepted" }, plan.milestones[1]],
    };
    const fetchMock = mockFetch({ success: true, data: accepted });
    const user = userEvent.setup();
    renderWithIntl(<PlanEditor initialPlan={plan} />);

    const card = screen.getByRole("article", { name: first.milestone.title });
    await user.click(within(card).getByRole("button", { name: "Accept" }));

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/milestone-plans/${plan.id}/review`,
      expect.objectContaining({
        body: JSON.stringify({
          type: "setStatus",
          milestoneId: first.milestone.id,
          status: "accepted",
        }),
      }),
    );
    expect(await within(card).findByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 accepted")).toBeInTheDocument();
  });

  it("disables publishing until a milestone is accepted", () => {
    renderWithIntl(<PlanEditor initialPlan={planDto()} />);

    expect(screen.getByRole("button", { name: "Publish plan" })).toBeDisabled();
  });

  it("publishes and switches to read-only", async () => {
    const plan = planDto({
      milestones: [reviewCardFactory.build({ status: "accepted" })],
    });
    mockFetch({
      success: true,
      data: {
        ...plan,
        status: "published",
        publishedAt: "2026-10-21T12:00:00.000Z",
      },
    });
    const user = userEvent.setup();
    renderWithIntl(<PlanEditor initialPlan={plan} />);

    await user.click(screen.getByRole("button", { name: "Publish plan" }));

    expect(await screen.findByText("Published")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Refine all" }),
    ).not.toBeInTheDocument();
  });

  it("shows the server error and keeps the current state", async () => {
    const plan = planDto();
    mockFetch({
      success: false,
      error: {
        code: "timeout",
        message: "The AI took too long to respond. Please try again.",
      },
    });
    const user = userEvent.setup();
    renderWithIntl(<PlanEditor initialPlan={plan} />);

    await user.type(
      screen.getByLabelText("Refine all milestones"),
      "Make it hands-on",
    );
    await user.click(screen.getByRole("button", { name: "Refine all" }));

    expect(
      await screen.findByText(
        "The AI took too long to respond. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
});
