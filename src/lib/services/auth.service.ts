import type { User, Session } from "@supabase/supabase-js";

import type { SupabaseClient } from "../../db/supabase.client";
import type { ErrorCode } from "../../types";

/**
 * Authentication service that encapsulates Supabase Auth logic.
 * Handles authentication operations and maps Supabase errors to application errors.
 */

interface AuthServiceError {
  code: ErrorCode;
  message: string;
}

/**
 * Maps Supabase Auth errors to application error codes and messages.
 */
function mapSupabaseAuthError(error: { message: string; status?: number }): AuthServiceError {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return {
      code: "AUTHENTICATION_ERROR",
      message: "Invalid email or password",
    };
  }

  if (message.includes("email not confirmed")) {
    return {
      code: "AUTHENTICATION_ERROR",
      message: "Please confirm your email address",
    };
  }

  if (message.includes("user already registered") || message.includes("already exists")) {
    return {
      code: "CONFLICT",
      message: "An account with this email already exists. Try logging in instead.",
    };
  }

  if (error.status === 429 || message.includes("rate limit")) {
    return {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many attempts. Please try again in a few minutes.",
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "An error occurred. Please try again later.",
  };
}

/**
 * Login user with email and password.
 * @throws {AuthServiceError} If login fails
 */
export async function loginUser(
  email: string,
  password: string,
  supabase: SupabaseClient
): Promise<{ user: User; session: Session }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw mapSupabaseAuthError(error);
  }

  if (!data.user || !data.session) {
    throw {
      code: "INTERNAL_ERROR",
      message: "Authentication failed",
    };
  }

  return {
    user: data.user,
    session: data.session,
  };
}

/**
 * Register a new user with email and password.
 * @throws {AuthServiceError} If registration fails
 */
export async function registerUser(email: string, password: string, supabase: SupabaseClient): Promise<{ user: User }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw mapSupabaseAuthError(error);
  }

  if (!data.user) {
    throw {
      code: "INTERNAL_ERROR",
      message: "Registration failed",
    };
  }

  return {
    user: data.user,
  };
}

/**
 * Logout the current user.
 * @throws {AuthServiceError} If logout fails
 */
export async function logoutUser(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw mapSupabaseAuthError(error);
  }
}

/**
 * Request a password reset email.
 * @throws {AuthServiceError} If request fails
 */
export async function requestPasswordReset(email: string, supabase: SupabaseClient): Promise<void> {
  const redirectTo = `${import.meta.env.SITE || "http://localhost:4321"}/auth/update-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw mapSupabaseAuthError(error);
  }
}

/**
 * Update user password (used after password reset).
 * @throws {AuthServiceError} If update fails
 */
export async function updatePassword(newPassword: string, supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw mapSupabaseAuthError(error);
  }
}
