import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { generationRequestFactory } from "@/test/factories";
import { renderWithIntl } from "@/test/render";
import { RequestForm } from "@/components/milestones/request-form";

function setup() {
  const onSubmit = vi.fn();
  renderWithIntl(<RequestForm pending={false} onSubmit={onSubmit} />);
  return { onSubmit, user: userEvent.setup() };
}

describe("RequestForm", () => {
  it("shows translated validation errors and does not submit", async () => {
    const { onSubmit, user } = setup();

    await user.click(
      screen.getByRole("button", { name: "Generate milestones" }),
    );

    expect(screen.getByText("Title is too short")).toBeInTheDocument();
    expect(screen.getByText("Brief needs more detail")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed values", async () => {
    const { onSubmit, user } = setup();
    const request = generationRequestFactory.build();

    await user.type(screen.getByLabelText("Title"), `  ${request.title}  `);
    await user.type(screen.getByLabelText("Brief"), request.brief);
    await user.click(
      screen.getByRole("button", { name: "Generate milestones" }),
    );

    expect(onSubmit).toHaveBeenCalledWith(request);
  });

  it("clears a field error while typing", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", { name: "Generate milestones" }),
    );
    await user.type(screen.getByLabelText("Title"), "A");

    expect(screen.queryByText("Title is too short")).not.toBeInTheDocument();
  });
});
