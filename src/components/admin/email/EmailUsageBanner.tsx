"use client";

import { useState, useEffect } from "react";
import { Mail } from "lucide-react";

export default function EmailUsageBanner() {
  const [stats, setStats] = useState<{
    monthlyCount: number;
    limit: number;
    remaining: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/email/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const pct = (stats.monthlyCount / stats.limit) * 100;
  const barColor =
    pct >= 95 ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : "bg-emerald-500";
  const textColor =
    pct >= 95
      ? "text-red-700"
      : pct >= 80
        ? "text-yellow-700"
        : "text-muted-foreground";

  return (
    <div className="flex items-center gap-4 rounded-lg border px-4 py-3">
      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className={textColor}>
            {stats.monthlyCount.toLocaleString()} /{" "}
            {stats.limit.toLocaleString()} emails this month
          </span>
          <span className="text-xs text-muted-foreground">
            {stats.remaining.toLocaleString()} remaining
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
