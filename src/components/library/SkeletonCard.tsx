import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-5/6 rounded bg-muted" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="h-8 w-20 rounded bg-muted" />
        <div className="h-8 w-20 rounded bg-muted" />
      </CardFooter>
    </Card>
  );
}
