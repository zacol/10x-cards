import type { APIRoute } from "astro";

import type { ErrorResponse } from "../../../types";
import { logoutUser } from "../../../lib/services/auth.service";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Logs out the current user and clears session.
 *
 * Response 204: No Content (success)
 *
 * Errors:
 * - 500: Internal error
 */
export const POST: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

  try {
    await logoutUser(supabase);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle auth service errors
    const authError = error as { code: import("../../../types").ErrorCode; message: string };

    return new Response(
      JSON.stringify({
        error: {
          code: authError.code,
          message: authError.message,
        },
      } satisfies ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
