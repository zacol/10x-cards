import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { LogoutButton } from "../LogoutButton";

// Mock window.location
const originalLocation = window.location;
const mockAssign = vi.fn();

beforeEach(() => {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...originalLocation, href: "", assign: mockAssign },
  });
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(window, "location", {
    writable: true,
    value: originalLocation,
  });
  mockAssign.mockClear();
});

describe("LogoutButton", () => {
  it("should render the button correctly", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("should handle successful logout and redirect", async () => {
    (global.fetch as Mock).mockResolvedValueOnce({ ok: true });

    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logging out/i })).toBeDisabled();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      expect(window.location.href).toBe("/auth/login");
    });
  });

  it("should redirect even on a failed logout attempt", async () => {
    (global.fetch as Mock).mockResolvedValueOnce({ ok: false });

    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logging out/i })).toBeDisabled();
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/auth/login");
    });
  });
});
