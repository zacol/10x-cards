import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // TODO: Backend implementation - wywołanie POST /api/auth/logout
      // const response = await fetch('/api/auth/logout', {
      //   method: 'POST',
      //   credentials: 'same-origin',
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Logout failed');
      // }
      //
      // window.location.href = '/auth/login';

      console.log("Logout attempt");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? "Logging out..." : "Sign out"}
    </Button>
  );
}
