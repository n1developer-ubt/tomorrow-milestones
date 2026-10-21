import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReviewCard } from "@/lib/review/review-reducer";
import { draftMilestoneFactory, milestoneFactory } from "@/test/factories";
import { renderWithIntl } from "@/test/render";
import { MilestoneCard } from "./milestone-card";

function setup(card: Partial<ReviewCard> = {}) {
  const props = {
    onStatus: vi.fn(),
    onEdit: vi.fn(),
    onRevert: vi.fn(),
    onRefine: vi.fn(),
  };
  const fullCard: ReviewCard = {
    milestone: draftMilestoneFactory.build(),
    status: "pending",
    edited: false,
    ...card,
  };
  renderWithIntl(
    <MilestoneCard
      card={fullCard}
      index={0}
      refining={false}
      disabled={false}
      {...props}
    />,
  );
  return { ...props, card: fullCard, user: userEvent.setup() };
}

describe("MilestoneCard", () => {
  it("accepts and rejects", async () => {
    const { onStatus, user } = setup();

    await user.click(screen.getByRole("button", { name: "Accept" }));
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(onStatus.mock.calls).toEqual([["accepted"], ["rejected"]]);
  });

  it("offers undo instead of review actions once decided", async () => {
    const { onStatus, user } = setup({ status: "accepted" });

    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(onStatus).toHaveBeenCalledWith("pending");
  });

  it("validates edits before saving them", async () => {
    const { onEdit, user } = setup();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const description = screen.getByLabelText("Milestone description");
    await user.clear(description);
    await user.type(description, "Too short.");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      screen.getByText("Description needs more detail"),
    ).toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("saves valid edits", async () => {
    const { onEdit, user } = setup();
    const text = milestoneFactory.build();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const title = screen.getByLabelText("Milestone title");
    await user.clear(title);
    await user.type(title, text.title);
    const description = screen.getByLabelText("Milestone description");
    await user.clear(description);
    await user.type(description, text.description);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onEdit).toHaveBeenCalledWith(text);
  });

  it("requests shorter, longer and custom refinements", async () => {
    const { onRefine, user } = setup();

    await user.click(screen.getByRole("button", { name: "Shorter" }));
    await user.click(screen.getByRole("button", { name: "Longer" }));
    await user.click(screen.getByRole("button", { name: "Ask AI" }));
    await user.type(
      screen.getByRole("textbox", { name: "Ask AI" }),
      "Focus on food",
    );
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onRefine.mock.calls).toEqual([
      ["shorter"],
      ["longer"],
      ["custom", "Focus on food"],
    ]);
  });

  it("shows the AI change and lets the reviewer restore the previous version", async () => {
    const previous = draftMilestoneFactory.build();
    const { onRevert, user } = setup({ change: "modified", previous });

    expect(screen.getByText("Changed")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Show previous version" }),
    );
    expect(screen.getByText(previous.title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restore previous" }));

    expect(onRevert).toHaveBeenCalled();
  });
});
