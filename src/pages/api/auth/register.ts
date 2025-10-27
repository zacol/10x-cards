import type { APIRoute } from "astro";

import type { ErrorResponse } from "../../../types";
import { registerUser } from "../../../lib/services/auth.service";
import { registerSchema } from "./auth.schema";

export const prerender = false;

/**
 * POST /api/auth/register
 * Registers a new user with email and password.
 * User is automatically logged in after successful registration.
 *
 * Request body:
 * {
 *   email: string;
 *   password: string;
 * }
 *
 * Response 201:
 * {
 *   user: {
 *     id: string;
 *     email: string;
 *   }
 * }
 *
 * Errors:
 * - 400: Validation error
 * - 409: Email already exists
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
  const result = registerSchema.safeParse(body);

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

  // Attempt to register user
  try {
    const { user } = await registerUser(email, password, supabase);

    // User is automatically logged in after successful registration
    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle auth service errors
    const authError = error as { code: import("../../../types").ErrorCode; message: string };
    const statusCode = authError.code === "CONFLICT" ? 409 : authError.code === "RATE_LIMIT_EXCEEDED" ? 429 : 500;

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
