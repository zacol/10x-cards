import type { APIRoute } from "astro";

import type { ErrorResponse } from "../../../types";
import { loginUser } from "../../../lib/services/auth.service";
import { loginSchema } from "./auth.schema";

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticates a user with email and password.
 *
 * Request body:
 * {
 *   email: string;
 *   password: string;
 * }
 *
 * Response 200:
 * {
 *   user: {
 *     id: string;
 *     email: string;
 *   }
 * }
 *
 * Errors:
 * - 400: Validation error
 * - 401: Invalid credentials
 * - 500: Internal error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON in request body",
        },
      } satisfies ErrorResponse),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate request body with Zod
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid data. Please check the form.",
          details: errors,
        },
      } satisfies ErrorResponse),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { email, password } = result.data;

  // Attempt to login user
  try {
    const { user } = await loginUser(email, password, supabase);

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle auth service errors
    const authError = error as { code: import("../../../types").ErrorCode; message: string };

    const statusCode =
      authError.code === "AUTHENTICATION_ERROR" ? 401 : authError.code === "RATE_LIMIT_EXCEEDED" ? 429 : 500;

    return new Response(
      JSON.stringify({
        error: {
          code: authError.code,
          message: authError.message,
        },
      } satisfies ErrorResponse),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
