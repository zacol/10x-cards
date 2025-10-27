import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Redirect to login page after successful logout
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Logout error:", err);
      // Even if there's an error, redirect to login as a fallback
      window.location.href = "/auth/login";
    }
    // Note: No finally block needed since we're redirecting
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? "Logging out..." : "Sign out"}
    </Button>
  );
}
