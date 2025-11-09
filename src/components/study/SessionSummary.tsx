import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SessionStats } from "@/types";

interface SessionSummaryProps {
  stats: SessionStats;
  onBackToLibrary: () => void;
}

export function SessionSummary({ stats, onBackToLibrary }: SessionSummaryProps) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-6 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Session Complete!</CardTitle>
          <CardDescription>Great job! Here&apos;s how you did:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics */}
          <div className="space-y-3 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total reviewed:</span>
              <span className="text-lg font-bold">{stats.reviewed}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">Don&apos;t know:</span>
              <span className="font-semibold text-red-600">{stats.again}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">I know:</span>
              <span className="font-semibold">{stats.good}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Very easy:</span>
              <span className="font-semibold text-green-600">{stats.easy}</span>
            </div>
          </div>

          {/* Back button */}
          <Button onClick={onBackToLibrary} className="w-full" size="lg">
            Back to Library
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
