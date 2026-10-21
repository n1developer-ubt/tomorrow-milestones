import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { reviewCardFactory } from "@/test/factories";
import { planDto } from "@/test/plan-dto-factory";
import { renderWithIntl } from "@/test/render";
import { PlanList } from "./plan-list";

describe("PlanList", () => {
  it("shows an empty state with a link to create a plan", () => {
    renderWithIntl(<PlanList plans={[]} />);

    expect(screen.getByText("No plans yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New plan" })).toHaveAttribute(
      "href",
      "/new",
    );
  });

  it("links each plan with its status and review progress", () => {
    const plan = planDto(
      {
        status: "published",
        milestones: [
          reviewCardFactory.build({ status: "accepted" }),
          reviewCardFactory.build({ status: "rejected" }),
        ],
      },
      "plan-7",
    );
    renderWithIntl(<PlanList plans={[plan]} />);

    const link = screen.getByRole("link", { name: /Design a zero-waste/ });
    expect(link).toHaveAttribute("href", "/plans/plan-7");
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 accepted/)).toBeInTheDocument();
  });
});
