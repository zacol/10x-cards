import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MinimalHeader } from "../MinimalHeader";

describe("MinimalHeader", () => {
  const onExitMock = vi.fn();

  it("should render the logo and the exit button", () => {
    render(<MinimalHeader onExit={onExitMock} />);

    expect(screen.getByText("10xCards")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exit study session" })).toBeInTheDocument();
  });

  it("should call onExit when the exit button is clicked", () => {
    render(<MinimalHeader onExit={onExitMock} />);

    fireEvent.click(screen.getByRole("button", { name: "Exit study session" }));
    expect(onExitMock).toHaveBeenCalledTimes(1);
  });
});
