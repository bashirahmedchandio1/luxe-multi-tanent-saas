"use client";

import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";

export default function AdminAccountPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Account</h1>
        <p className="text-muted-foreground">Your platform administrator profile.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{session?.user?.name || "Administrator"}</CardTitle>
              <CardDescription>{session?.user?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Role</p>
              <Badge variant="outline" className="mt-1 capitalize">
                {session?.user?.role || "admin"}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">User ID</p>
              <p className="font-mono text-xs mt-1 text-muted-foreground">
                {session?.user?.id?.slice(0, 16) ?? "—"}&hellip;
              </p>
            </div>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Admin role is managed via the Better Auth admin plugin. To modify
            roles, update the database directly or use the Better Auth admin
            API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
