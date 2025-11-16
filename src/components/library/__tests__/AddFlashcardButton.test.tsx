import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from "vitest";

import { QuickStartAddButton } from "../AddFlashcardButton";

// 1. Mock the child component
const { CreateFlashcardModal } = vi.hoisted(() => {
  return { CreateFlashcardModal: vi.fn() };
});

vi.mock("../CreateFlashcardModal", () => ({ CreateFlashcardModal }));

describe("QuickStartAddButton", () => {
  // 2. Safely mock window.location
  let locationDescriptor: PropertyDescriptor;

  beforeAll(() => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "location");
    if (!descriptor) {
      throw new Error("Could not get window.location property descriptor");
    }
    locationDescriptor = descriptor;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", locationDescriptor);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = "";
  });

  it("should render the button correctly", () => {
    render(<QuickStartAddButton />);
    expect(screen.getByRole("button", { name: /add manually/i })).toBeInTheDocument();
  });

  it("should render the modal as closed initially, and open it on click", () => {
    render(<QuickStartAddButton />);
    expect(CreateFlashcardModal).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: false }), undefined);

    const addButton = screen.getByRole("button", { name: /add manually/i });
    fireEvent.click(addButton);

    expect(CreateFlashcardModal).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: true }), undefined);
  });

  it("should handle modal creation callback and redirect", () => {
    render(<QuickStartAddButton />);
    fireEvent.click(screen.getByRole("button", { name: /add manually/i }));

    // Get the `onCreate` prop from the mocked component's last call
    const lastCall = vi.mocked(CreateFlashcardModal).mock.calls.pop();
    const onCreate = lastCall?.[0].onCreate;
    expect(onCreate).toBeInstanceOf(Function);

    // Call the `onCreate` callback within `act` because it triggers a state update
    act(() => {
      onCreate?.();
    });

    // Assert that the modal is closed and the page redirects
    expect(CreateFlashcardModal).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: false }), undefined);
    expect(window.location.href).toBe("/library");
  });

  it("should handle modal close callback", () => {
    render(<QuickStartAddButton />);
    fireEvent.click(screen.getByRole("button", { name: /add manually/i }));

    // Get the `onOpenChange` prop
    const lastCall = vi.mocked(CreateFlashcardModal).mock.calls.pop();
    const onOpenChange = lastCall?.[0].onOpenChange;
    expect(onOpenChange).toBeInstanceOf(Function);

    // Call the `onOpenChange` callback to simulate closing the modal
    act(() => {
      onOpenChange?.(false);
    });

    // Assert the modal is now closed
    expect(CreateFlashcardModal).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: false }), undefined);
  });
});
