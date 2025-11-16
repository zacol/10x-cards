import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { RegisterForm } from "../RegisterForm";

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

describe("RegisterForm", () => {
  it("should render the registration form correctly", () => {
    render(<RegisterForm />);
    expect(screen.getByRole("heading", { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("should display validation errors for mismatched passwords", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "ValidPass1" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "WrongPass1" } });

    await fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("should handle successful registration and redirect", async () => {
    (global.fetch as Mock).mockResolvedValueOnce({ ok: true });

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "newuser@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "ValidPass123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "ValidPass123" } });

    await fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "newuser@example.com", password: "ValidPass123" }),
        credentials: "same-origin",
      });
      expect(window.location.href).toBe("/library");
    });
  });

  it("should display an error message if email already exists", async () => {
    const errorMessage = "An account with this email already exists.";
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: errorMessage } }),
    });

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "existing@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "ValidPass123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "ValidPass123" } });

    await fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /sign up/i })).not.toBeDisabled();
  });
});
