import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { AuthShell } from "./auth-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AuthShell>{children}</AuthShell>
    </Suspense>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh">
      <div className="hidden w-64 flex-col gap-2 border-r p-4 md:flex">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}