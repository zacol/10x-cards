import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { LoginForm } from "../LoginForm";

const originalLocation = window.location;

beforeEach(() => {
  global.fetch = vi.fn();
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...originalLocation, href: "" },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(window, "location", {
    writable: true,
    value: originalLocation,
  });
});

describe("LoginForm", () => {
  it("should render the login form correctly", () => {
    render(<LoginForm />);
    expect(screen.getByRole("heading", { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /forgot password/i })).toBeInTheDocument();
  });

  it("should display validation errors for invalid inputs", async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "" } });

    fireEvent.submit(screen.getByTestId("login-form"));

    expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
  });

  it("should handle successful login and redirect", async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });

    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
        credentials: "same-origin",
      });
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/library");
    });
  });

  it("should display an error message on failed login", async () => {
    const errorMessage = "Invalid email or password";
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: errorMessage } }),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "wrong@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpassword" } });

    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled();
  });
});
