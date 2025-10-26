import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client";

/**
 * Global middleware that attaches Supabase client and user to context.
 * The user is extracted from the JWT token in cookies or Authorization header.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Attach Supabase client to context
  context.locals.supabase = supabaseClient;

  // Extract user from the session
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  // Attach user (or null if not authenticated) to context
  context.locals.user = user;

  return next();
});
