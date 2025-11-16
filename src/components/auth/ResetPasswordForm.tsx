import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { resetPasswordSchema } from "@/lib/schemas/auth.schema";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
  }>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    // Client-side validation with Zod
    const result = resetPasswordSchema.safeParse({ email });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Backend implementation - wywołanie POST /api/auth/reset-password
      // const response = await fetch('/api/auth/reset-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      //   credentials: 'same-origin',
      // });
      //
      // if (!response.ok) {
      //   const data = await response.json();
      //   throw new Error(data.error?.message || 'Failed to send reset email');
      // }
      //
      // setSuccess(true);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.log("Password reset request:", { email });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while sending reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Check your email</h2>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
          If an account with that email exists, we&apos;ve sent you a password reset link. Please check your inbox.
        </div>
        <div className="pt-4">
          <a href="/auth/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reset your password</h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          disabled={isLoading}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send reset link"}
      </Button>

      <div className="text-center">
        <a href="/auth/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Back to sign in
        </a>
      </div>
    </form>
  );
}
