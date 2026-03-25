"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

type RecipientType = "buyers" | "sellers" | "all";

export default function BulkEmailTab() {
  const [recipientType, setRecipientType] = useState<RecipientType>("buyers");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const role = recipientType === "all" ? "" : recipientType.slice(0, -1); // buyers->buyer
    const params = new URLSearchParams({ countOnly: "true" });
    if (role) params.set("role", role);
    fetch(`/api/admin/email/users?${params}`)
      .then((r) => r.json())
      .then((d) => setRecipientCount(d.count ?? 0))
      .catch(() => setRecipientCount(0));
  }, [recipientType]);

  const handleSendClick = () => {
    if (!subject || !body) return;
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientType, subject, html: body }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          type: "success",
          message: `Sent to ${data.sent} recipients${data.failed > 0 ? ` (${data.failed} failed)` : ""}`,
        });
        setSubject("");
        setBody("");
      } else {
        setResult({
          type: "error",
          message: data.error || "Failed to send bulk email",
        });
      }
    } catch {
      setResult({
        type: "error",
        message: "Network error — please try again",
      });
    } finally {
      setSending(false);
    }
  };

  const typeLabels: Record<RecipientType, string> = {
    buyers: "All Buyers",
    sellers: "All Sellers",
    all: "All Users",
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bulk Email</CardTitle>
          <CardDescription>
            Send an email to a group of platform users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && (
            <div
              className={`flex items-start gap-3 rounded-md p-3 text-sm ${
                result.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {result.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              {result.message}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Recipients</Label>
            <div className="flex gap-2">
              {(["buyers", "sellers", "all"] as RecipientType[]).map((type) => (
                <Button
                  key={type}
                  variant={recipientType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecipientType(type)}
                >
                  {typeLabels[type]}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-subject">Subject</Label>
            <Input
              id="bulk-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-body">Message</Label>
            <Textarea
              id="bulk-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here. HTML is supported."
              rows={10}
            />
          </div>

          <Button
            onClick={handleSendClick}
            disabled={sending || !subject || !body || recipientCount === 0}
            className="w-full"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {sending ? "Sending..." : `Send to ${typeLabels[recipientType]}`}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Bulk Send
            </DialogTitle>
            <DialogDescription>
              You are about to send an email to{" "}
              <strong>{recipientCount}</strong> recipients. This will use{" "}
              {recipientCount} of your monthly email quota.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">To:</span>{" "}
              <Badge variant="secondary">{typeLabels[recipientType]}</Badge>
            </p>
            <p>
              <span className="text-muted-foreground">Subject:</span> {subject}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSend}>
              <Send className="h-4 w-4 mr-2" />
              Send to {recipientCount} users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
