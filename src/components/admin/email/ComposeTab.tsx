"use client";

import { useState } from "react";
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
import { Loader2, Send, CheckCircle, AlertCircle } from "lucide-react";
import UserAutocomplete from "./UserAutocomplete";

interface ComposeTabProps {
  initialSubject?: string;
  initialHtml?: string;
  initialTemplateKey?: string;
}

export default function ComposeTab({
  initialSubject,
  initialHtml,
  initialTemplateKey,
}: ComposeTabProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [body, setBody] = useState(initialHtml ?? "");
  const [templateKey] = useState(initialTemplateKey);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSend = async () => {
    if (!to || !subject || !body) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          html: body,
          templateKey: templateKey || undefined,
        }),
      });
      if (res.ok) {
        setResult({ type: "success", message: `Email sent to ${to}` });
        setTo("");
        setSubject(initialSubject ?? "");
        setBody(initialHtml ?? "");
      } else {
        const data = await res.json();
        setResult({
          type: "error",
          message: data.error || "Failed to send email",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Email</CardTitle>
        <CardDescription>
          Send a direct email to any user on the platform.
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
          <Label htmlFor="to">To</Label>
          <UserAutocomplete value={to} onChange={setTo} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here. HTML is supported."
            rows={10}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={sending || !to || !subject || !body}
          className="w-full"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send Email
        </Button>
      </CardContent>
    </Card>
  );
}
