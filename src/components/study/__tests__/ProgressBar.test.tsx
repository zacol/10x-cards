import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressBar } from "../ProgressBar";

describe("ProgressBar", () => {
  it("should render the progress and percentage correctly", () => {
    render(<ProgressBar current={5} total={10} />);

    expect(screen.getByText("5 / 10")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should handle the case where total is 0", () => {
    render(<ProgressBar current={0} total={0} />);

    expect(screen.getByText("0 / 0")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("should round the percentage correctly", () => {
    render(<ProgressBar current={1} total={3} />);

    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
  });
});
