import { z } from "zod";

/**
 * Backend validation schemas for authentication endpoints.
 * These are separate from frontend schemas to avoid coupling.
 */

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export type LoginCommand = z.infer<typeof loginSchema>;
export type RegisterCommand = z.infer<typeof registerSchema>;
export type ResetPasswordCommand = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordCommand = z.infer<typeof updatePasswordSchema>;
