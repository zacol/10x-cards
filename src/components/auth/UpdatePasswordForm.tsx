import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { updatePasswordSchema } from "@/lib/schemas/auth.schema";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation with Zod
    const result = updatePasswordSchema.safeParse({ password, confirmPassword });

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
      // TODO: Backend implementation - wywołanie POST /api/auth/update-password
      // const response = await fetch('/api/auth/update-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ password }),
      //   credentials: 'same-origin',
      // });
      //
      // if (!response.ok) {
      //   const data = await response.json();
      //   throw new Error(data.error?.message || 'Failed to update password');
      // }
      //
      // window.location.href = '/auth/login?message=Password updated successfully';

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.log("Password update attempt");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while updating password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Set new password</h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose a strong password for your account.</p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          New Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          disabled={isLoading}
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
        />
        {fieldErrors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          disabled={isLoading}
          aria-invalid={!!fieldErrors.confirmPassword}
          aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
        />
        {fieldErrors.confirmPassword && (
          <p id="confirmPassword-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Updating password..." : "Update password"}
      </Button>
    </form>
  );
}
