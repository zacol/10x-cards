import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { loginUser, registerUser, logoutUser, requestPasswordReset, updatePassword } from "../auth.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Helper to create mock AuthError
const createMockAuthError = (message: string, status?: number) => {
  return {
    message,
    name: "AuthError",
    status,
    code: status?.toString() || "unknown",
    __isAuthError: true,
  } as unknown as AuthError;
};

// Mock Supabase client with proper typing
const createMockSupabaseClient = () => {
  return {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  } as unknown as SupabaseClient;
};

describe("auth.service", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe("loginUser", () => {
    it("should successfully login user with valid credentials", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";
      const mockUser = { id: "user-123", email } as User;
      const mockSession = { access_token: "token-123" } as Session;

      vi.spyOn(mockSupabase.auth, "signInWithPassword").mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Act
      const result = await loginUser(email, password, mockSupabase);

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it("should throw AUTHENTICATION_ERROR for invalid credentials", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "wrong-password";

      vi.spyOn(mockSupabase.auth, "signInWithPassword").mockResolvedValue({
        data: { user: null, session: null },
        error: createMockAuthError("Invalid login credentials", 400),
      });

      // Act & Assert
      await expect(loginUser(email, password, mockSupabase)).rejects.toMatchObject({
        code: "AUTHENTICATION_ERROR",
        message: "Invalid email or password",
      });
    });

    it("should throw AUTHENTICATION_ERROR for unconfirmed email", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";

      vi.spyOn(mockSupabase.auth, "signInWithPassword").mockResolvedValue({
        data: { user: null, session: null },
        error: createMockAuthError("Email not confirmed", 400),
      });

      // Act & Assert
      await expect(loginUser(email, password, mockSupabase)).rejects.toMatchObject({
        code: "AUTHENTICATION_ERROR",
        message: "Please confirm your email address",
      });
    });

    it("should throw RATE_LIMIT_EXCEEDED for too many attempts", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";

      vi.spyOn(mockSupabase.auth, "signInWithPassword").mockResolvedValue({
        data: { user: null, session: null },
        error: createMockAuthError("Rate limit exceeded", 429),
      });

      // Act & Assert
      await expect(loginUser(email, password, mockSupabase)).rejects.toMatchObject({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many attempts. Please try again in a few minutes.",
      });
    });

    it("should throw INTERNAL_ERROR when user or session is missing in successful response", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";

      vi.spyOn(mockSupabase.auth, "signInWithPassword").mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as unknown as { data: { user: User; session: Session }; error: null });

      // Act & Assert
      await expect(loginUser(email, password, mockSupabase)).rejects.toMatchObject({
        code: "INTERNAL_ERROR",
        message: "Authentication failed",
      });
    });

    it("should throw INTERNAL_ERROR for unknown errors", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";

      vi.spyOn(mockSupabase.auth, "signInWithPassword").mockResolvedValue({
        data: { user: null, session: null },
        error: createMockAuthError("Unknown error occurred", 500),
      });

      // Act & Assert
      await expect(loginUser(email, password, mockSupabase)).rejects.toMatchObject({
        code: "INTERNAL_ERROR",
        message: "An error occurred. Please try again later.",
      });
    });
  });

  describe("registerUser", () => {
    it("should successfully register a new user", async () => {
      // Arrange
      const email = "newuser@example.com";
      const password = "password123";
      const mockUser = { id: "user-456", email } as User;

      vi.spyOn(mockSupabase.auth, "signUp").mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      // Act
      const result = await registerUser(email, password, mockSupabase);

      // Assert
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(result).toEqual({ user: mockUser });
    });

    it("should throw CONFLICT error when email already exists", async () => {
      // Arrange
      const email = "existing@example.com";
      const password = "password123";

      vi.spyOn(mockSupabase.auth, "signUp").mockResolvedValue({
        data: { user: null, session: null },
        error: createMockAuthError("User already registered", 400),
      });

      // Act & Assert
      await expect(registerUser(email, password, mockSupabase)).rejects.toMatchObject({
        code: "CONFLICT",
        message: "An account with this email already exists. Try logging in instead.",
      });
    });

    it("should throw INTERNAL_ERROR when user is missing in successful response", async () => {
      // Arrange
      const email = "newuser@example.com";
      const password = "password123";

      vi.spyOn(mockSupabase.auth, "signUp").mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      // Act & Assert
      await expect(registerUser(email, password, mockSupabase)).rejects.toMatchObject({
        code: "INTERNAL_ERROR",
        message: "Registration failed",
      });
    });

    it("should throw RATE_LIMIT_EXCEEDED for status 429", async () => {
      // Arrange
      const email = "newuser@example.com";
      const password = "password123";

      vi.spyOn(mockSupabase.auth, "signUp").mockResolvedValue({
        data: { user: null, session: null },
        error: createMockAuthError("Too many requests", 429),
      });

      // Act & Assert
      await expect(registerUser(email, password, mockSupabase)).rejects.toMatchObject({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many attempts. Please try again in a few minutes.",
      });
    });
  });

  describe("logoutUser", () => {
    it("should successfully logout user", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signOut").mockResolvedValue({
        error: null,
      });

      // Act
      await logoutUser(mockSupabase);

      // Assert
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("should throw error when logout fails", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signOut").mockResolvedValue({
        error: createMockAuthError("Logout failed", 500),
      });

      // Act & Assert
      await expect(logoutUser(mockSupabase)).rejects.toMatchObject({
        code: "INTERNAL_ERROR",
        message: "An error occurred. Please try again later.",
      });
    });
  });

  describe("requestPasswordReset", () => {
    it("should successfully request password reset", async () => {
      // Arrange
      const email = "user@example.com";

      vi.spyOn(mockSupabase.auth, "resetPasswordForEmail").mockResolvedValue({
        data: {},
        error: null,
      });

      // Act
      await requestPasswordReset(email, mockSupabase);

      // Assert
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
        redirectTo: expect.stringContaining("/auth/update-password"),
      });
    });

    it("should throw error when reset request fails", async () => {
      // Arrange
      const email = "user@example.com";

      vi.spyOn(mockSupabase.auth, "resetPasswordForEmail").mockResolvedValue({
        data: null,
        error: createMockAuthError("Email service unavailable", 500),
      } as Awaited<ReturnType<typeof mockSupabase.auth.resetPasswordForEmail>>);

      // Act & Assert
      await expect(requestPasswordReset(email, mockSupabase)).rejects.toMatchObject({
        code: "INTERNAL_ERROR",
        message: "An error occurred. Please try again later.",
      });
    });

    it("should handle rate limiting", async () => {
      // Arrange
      const email = "user@example.com";

      vi.spyOn(mockSupabase.auth, "resetPasswordForEmail").mockResolvedValue({
        data: null,
        error: createMockAuthError("Rate limit exceeded", 429),
      } as Awaited<ReturnType<typeof mockSupabase.auth.resetPasswordForEmail>>);

      // Act & Assert
      await expect(requestPasswordReset(email, mockSupabase)).rejects.toMatchObject({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many attempts. Please try again in a few minutes.",
      });
    });
  });

  describe("updatePassword", () => {
    it("should successfully update password", async () => {
      // Arrange
      const newPassword = "newPassword123";

      vi.spyOn(mockSupabase.auth, "updateUser").mockResolvedValue({
        data: { user: { id: "user-123" } as User },
        error: null,
      });

      // Act
      await updatePassword(newPassword, mockSupabase);

      // Assert
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });

    it("should throw error when password update fails", async () => {
      // Arrange
      const newPassword = "newPassword123";

      vi.spyOn(mockSupabase.auth, "updateUser").mockResolvedValue({
        data: { user: null },
        error: createMockAuthError("Update failed", 500),
      });

      // Act & Assert
      await expect(updatePassword(newPassword, mockSupabase)).rejects.toMatchObject({
        code: "INTERNAL_ERROR",
        message: "An error occurred. Please try again later.",
      });
    });

    it("should handle invalid credentials error during update", async () => {
      // Arrange
      const newPassword = "newPassword123";

      vi.spyOn(mockSupabase.auth, "updateUser").mockResolvedValue({
        data: { user: null },
        error: createMockAuthError("Invalid credentials", 401),
      });

      // Act & Assert
      await expect(updatePassword(newPassword, mockSupabase)).rejects.toMatchObject({
        code: "AUTHENTICATION_ERROR",
        message: "Invalid email or password",
      });
    });
  });
});
