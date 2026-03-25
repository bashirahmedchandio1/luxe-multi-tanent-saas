"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait until session resolves
    if (isPending) return;

    // Not logged in at all — redirect immediately
    if (!session) {
      router.replace("/store/auth");
      return;
    }

    // Verify against ADMIN_EMAIL on the server (email never exposed to client)
    fetch("/api/admin/verify")
      .then((res) => {
        if (res.ok) {
          setAuthorized(true);
        } else {
          router.replace("/store/auth");
        }
      })
      .catch(() => router.replace("/store/auth"));
  }, [session, isPending, router]);

  // Still loading session or waiting for verify response
  if (isPending || authorized === null) return null;

  // Blocked (shouldn't render — redirect already fired, but guard the render)
  if (!authorized) return null;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 !h-4" />
            <span className="text-sm font-medium text-muted-foreground">
              Admin Dashboard
            </span>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
