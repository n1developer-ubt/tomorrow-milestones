import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generationRequestFactory } from "@/test/factories";
import { renderWithIntl } from "@/test/render";
import { NewPlanForm } from "@/components/plans/new-plan-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
});

async function submit() {
  const user = userEvent.setup();
  const request = generationRequestFactory.build();
  await user.type(screen.getByLabelText("Title"), request.title);
  await user.type(screen.getByLabelText("Brief"), request.brief);
  await user.click(screen.getByRole("button", { name: "Generate milestones" }));
}

describe("NewPlanForm", () => {
  it("creates a draft and opens it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: true, data: { id: "p9" } })),
      ),
    );
    renderWithIntl(<NewPlanForm />);

    await submit();

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/plans/p9"));
  });

  it("shows a network error and stays on the form", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    renderWithIntl(<NewPlanForm />);

    await submit();

    expect(
      await screen.findByText(
        "Could not reach the server. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
