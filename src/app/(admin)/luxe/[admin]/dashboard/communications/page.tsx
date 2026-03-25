"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare, Search, Send } from "lucide-react";

interface SupportTicket {
  id: string;
  userId: string;
  userRole: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_FILTERS = ["all", "open", "in-progress", "resolved"];

const STATUS_BADGE: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "destructive",
  "in-progress": "outline",
  resolved: "default",
};

export default function CommunicationsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("in-progress");
  const [saving, setSaving] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    fetch("/api/admin/communications")
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filtered = tickets.filter((t) => {
    const matchesSearch =
      !search ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/communications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          status: newStatus,
          adminReply: reply,
        }),
      });
      if (res.ok) {
        const { ticket } = await res.json();
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? ticket : t))
        );
        setSelected(ticket);
        setReply("");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
        <p className="text-muted-foreground">
          Support tickets and user contact requests.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left panel — ticket list */}
        <div className="space-y-3 lg:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets…"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="capitalize text-xs"
              >
                {s}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tickets found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelected(t);
                    setReply(t.adminReply ?? "");
                    setNewStatus(t.status);
                  }}
                  className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                    selected?.id === t.id ? "border-primary bg-muted/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight line-clamp-1">
                      {t.subject}
                    </p>
                    <Badge
                      variant={STATUS_BADGE[t.status] ?? "secondary"}
                      className="shrink-0 text-xs"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {t.userRole}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right panel — ticket detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a ticket to view details</p>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{selected.subject}</CardTitle>
                    <CardDescription>
                      From a{" "}
                      <span className="capitalize font-medium">
                        {selected.userRole}
                      </span>{" "}
                      &mdash;{" "}
                      {new Date(selected.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant={STATUS_BADGE[selected.status] ?? "secondary"}>
                    {selected.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-muted p-4 text-sm">
                  {selected.message}
                </div>

                {selected.adminReply && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Previous reply
                      </p>
                      <div className="rounded-md bg-primary/5 border border-primary/20 p-4 text-sm">
                        {selected.adminReply}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium">Reply</p>
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply…"
                    rows={4}
                  />

                  <div className="flex items-center gap-3">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>

                    <Button
                      onClick={handleReply}
                      disabled={saving || !reply.trim()}
                      size="sm"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
