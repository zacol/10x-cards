import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { PaginationControls } from "../PaginationControls";
import type { PaginationMeta } from "@/types";

// Mock UI components
vi.mock("@/components/ui/pagination", () => ({
  Pagination: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaginationContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaginationEllipsis: () => <span>...</span>,
  PaginationItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaginationLink: ({
    children,
    onClick,
    isActive,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    isActive?: boolean;
  }) => (
    <button onClick={onClick} data-active={isActive}>
      {children}
    </button>
  ),
  PaginationNext: ({ onClick, "aria-disabled": disabled }: { onClick: () => void; "aria-disabled": boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      Next
    </button>
  ),
  PaginationPrevious: ({ onClick, "aria-disabled": disabled }: { onClick: () => void; "aria-disabled": boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      Previous
    </button>
  ),
}));

describe("PaginationControls", () => {
  const mockOnPageChange = vi.fn();

  it("should not render if total pages are less than or equal to 1", () => {
    const pagination: PaginationMeta = { total: 10, limit: 10, offset: 0, has_more: false };
    render(<PaginationControls pagination={pagination} onPageChange={mockOnPageChange} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should call onPageChange with the correct page number", () => {
    const pagination: PaginationMeta = { total: 100, limit: 10, offset: 0, has_more: true };
    render(<PaginationControls pagination={pagination} onPageChange={mockOnPageChange} />);
    fireEvent.click(screen.getByText("2"));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it("should call onPageChange with the previous page number", () => {
    const pagination: PaginationMeta = { total: 100, limit: 10, offset: 10, has_more: true }; // Current page is 2
    render(<PaginationControls pagination={pagination} onPageChange={mockOnPageChange} />);
    fireEvent.click(screen.getByText("Previous"));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it("should call onPageChange with the next page number", () => {
    const pagination: PaginationMeta = { total: 100, limit: 10, offset: 0, has_more: true }; // Current page is 1
    render(<PaginationControls pagination={pagination} onPageChange={mockOnPageChange} />);
    fireEvent.click(screen.getByText("Next"));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it("should disable the Previous button on the first page", () => {
    const pagination: PaginationMeta = { total: 100, limit: 10, offset: 0, has_more: true };
    render(<PaginationControls pagination={pagination} onPageChange={mockOnPageChange} />);
    expect(screen.getByText("Previous")).toBeDisabled();
  });

  it("should disable the Next button when has_more is false", () => {
    const pagination: PaginationMeta = { total: 20, limit: 10, offset: 10, has_more: false };
    render(<PaginationControls pagination={pagination} onPageChange={mockOnPageChange} />);
    expect(screen.getByText("Next")).toBeDisabled();
  });
});
