import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExitConfirmModal } from "../ExitConfirmModal";

describe("ExitConfirmModal", () => {
  const onConfirmMock = vi.fn();
  const onCancelMock = vi.fn();

  it("should render the modal with title, description, and buttons when open", () => {
    render(<ExitConfirmModal isOpen={true} onConfirm={onConfirmMock} onCancel={onCancelMock} />);

    expect(screen.getByText("Exit session?")).toBeInTheDocument();
    expect(screen.getByText("Your progress will be lost. Are you sure you want to exit?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exit" })).toBeInTheDocument();
  });

  it("should not render the modal when closed", () => {
    render(<ExitConfirmModal isOpen={false} onConfirm={onConfirmMock} onCancel={onCancelMock} />);

    expect(screen.queryByText("Exit session?")).not.toBeInTheDocument();
  });

  it("should call onConfirm when the Exit button is clicked", () => {
    render(<ExitConfirmModal isOpen={true} onConfirm={onConfirmMock} onCancel={onCancelMock} />);

    fireEvent.click(screen.getByRole("button", { name: "Exit" }));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when the Cancel button is clicked", () => {
    render(<ExitConfirmModal isOpen={true} onConfirm={onConfirmMock} onCancel={onCancelMock} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});
