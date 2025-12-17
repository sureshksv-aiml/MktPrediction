import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Market Pulse Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Real-time volatility prediction powered by AI
        </p>
      </header>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="flex-1 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="h-64 bg-muted rounded" />
      </div>
    </div>
  );
}
