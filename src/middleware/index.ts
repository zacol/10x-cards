import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client";

// Public paths - Auth pages and API endpoints
const PUBLIC_PATHS = [
  // Auth pages (server-rendered)
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/update-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
  "/api/auth/update-password",
];

// Auth pages that should redirect to /library if user is logged in
const AUTH_PAGES = ["/auth/login", "/auth/register", "/auth/reset-password"];

/**
 * Global middleware that attaches Supabase client and user to context.
 * Handles authentication state and redirects based on user status.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Create SSR-compatible Supabase instance for this request
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Attach Supabase client to context
  context.locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Attach user (or null if not authenticated) to context
  context.locals.user = user;

  // Redirect logged-in users away from auth pages to /library
  if (user && AUTH_PAGES.includes(context.url.pathname)) {
    return context.redirect("/library");
  }

  // Redirect unauthenticated users from protected pages to login
  if (!user && !PUBLIC_PATHS.includes(context.url.pathname)) {
    return context.redirect("/auth/login");
  }

  return next();
});
