"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OtherUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LastMessage {
  text: string;
  createdAt: string;
  senderId: string;
}

interface Conversation {
  id: string;
  buyerId: string;
  sellerId: string;
  subject: string | null;
  updatedAt: string;
  otherUser: OtherUser | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
  myRole: "buyer" | "seller";
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  status: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCENTS = [
  "from-amber-500/20 via-orange-500/10 to-transparent",
  "from-sky-500/20 via-cyan-500/10 to-transparent",
  "from-emerald-500/20 via-lime-500/10 to-transparent",
  "from-rose-500/20 via-pink-500/10 to-transparent",
  "from-violet-500/20 via-purple-500/10 to-transparent",
  "from-blue-500/20 via-indigo-500/10 to-transparent",
];

function accentFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return ACCENTS[hash % ACCENTS.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SellerMessagesPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const convPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;

  // ── Fetch conversations ──
  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/messages/conversations");
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations ?? []);
  }, []);

  // ── Fetch messages ──
  const fetchMessages = useCallback(async (convId: string) => {
    const res = await fetch(`/api/messages?conversationId=${convId}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, []);

  // ── Conversation polling (3s) ──
  useEffect(() => {
    if (!userId) return;
    fetchConversations().finally(() => setLoadingConvs(false));
    convPollRef.current = setInterval(fetchConversations, 3000);
    return () => {
      if (convPollRef.current) clearInterval(convPollRef.current);
    };
  }, [userId, fetchConversations]);

  // ── Message polling (2s) when conversation open ──
  useEffect(() => {
    if (msgPollRef.current) clearInterval(msgPollRef.current);
    if (!activeConvId) return;

    setLoadingMsgs(true);
    fetchMessages(activeConvId).finally(() => setLoadingMsgs(false));

    msgPollRef.current = setInterval(() => fetchMessages(activeConvId), 2000);
    return () => {
      if (msgPollRef.current) clearInterval(msgPollRef.current);
    };
  }, [activeConvId, fetchMessages]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send ──
  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeConvId || sending) return;
    setSending(true);
    setDraft("");
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeConvId, text }),
    });
    await fetchMessages(activeConvId);
    await fetchConversations();
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Derived ──
  const filteredConvs = conversations.filter((c) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      c.otherUser?.name.toLowerCase().includes(q) ||
      c.otherUser?.email.toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((n, c) => n + c.unreadCount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.22),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.18),_transparent_35%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge className="w-fit border border-white/15 bg-white/10 text-white hover:bg-white/10">
              Seller Inbox
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
              <p className="text-sm leading-6 text-slate-200 sm:text-base">
                Respond to buyers in real-time. New messages appear automatically — no refresh needed.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Threads</p>
              <p className="mt-2 text-2xl font-semibold">{conversations.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Unread</p>
              <p className="mt-2 text-2xl font-semibold">{totalUnread}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Status</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-400">Live</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Conversation List */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Buyer Threads
                </CardTitle>
                <CardDescription>
                  Messages from your customers
                </CardDescription>
              </div>
              <Badge variant="secondary">{filteredConvs.length}</Badge>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search buyers..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[780px] overflow-y-auto">
              {loadingConvs ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                  {conversations.length === 0
                    ? "No messages yet. Buyers will appear here when they reach out."
                    : "No buyers matched your search."}
                </div>
              ) : (
                filteredConvs.map((conv) => {
                  const other = conv.otherUser;
                  const isActive = conv.id === activeConvId;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setActiveConvId(conv.id)}
                      className={cn(
                        "flex w-full items-start gap-4 border-b px-6 py-5 text-left transition hover:bg-muted/40",
                        isActive && "bg-muted/60"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br text-sm font-semibold",
                          accentFor(other?.id ?? conv.buyerId)
                        )}
                      >
                        {initials(other?.name ?? "?")}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {other?.name ?? "Unknown Buyer"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {other?.email}
                            </p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground shrink-0">
                            {conv.lastMessage && (
                              <p>{timeLabel(conv.lastMessage.createdAt)}</p>
                            )}
                            {conv.unreadCount > 0 && (
                              <Badge className="mt-1 rounded-full px-2.5">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="line-clamp-1 text-sm text-muted-foreground">
                          {conv.lastMessage?.text ?? "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card>
          {activeConv ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br text-base font-semibold",
                      accentFor(activeConv.otherUser?.id ?? activeConv.buyerId)
                    )}
                  >
                    {initials(activeConv.otherUser?.name ?? "?")}
                  </div>
                  <div className="space-y-1">
                    <CardTitle>{activeConv.otherUser?.name ?? "Unknown Buyer"}</CardTitle>
                    <CardDescription>{activeConv.otherUser?.email}</CardDescription>
                    <Badge variant="secondary" className="text-xs">Buyer</Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex min-h-[640px] flex-1 flex-col gap-0 p-0">
                <div className="border-b bg-muted/30 px-6 py-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 ring-1 ring-border text-sm">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Live buyer-seller conversation
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,1))] px-6 py-6 min-h-[480px] max-h-[480px]">
                  {loadingMsgs && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                      <p className="text-sm">No messages yet. Reply to start the conversation.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === userId;
                      return (
                        <div
                          key={msg.id}
                          className={cn("flex items-end gap-3", isMine && "justify-end")}
                        >
                          {!isMine && (
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-gradient-to-br text-xs font-semibold",
                                accentFor(activeConv.otherUser?.id ?? activeConv.buyerId)
                              )}
                            >
                              {initials(activeConv.otherUser?.name ?? "?")}
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[85%] rounded-3xl px-4 py-3 shadow-sm sm:max-w-[70%]",
                              isMine
                                ? "rounded-br-md bg-slate-900 text-white"
                                : "rounded-bl-md border bg-white text-slate-900"
                            )}
                          >
                            <p className="text-sm leading-6">{msg.text}</p>
                            <div
                              className={cn(
                                "mt-1.5 flex items-center gap-2 text-[11px]",
                                isMine ? "text-slate-300" : "text-muted-foreground"
                              )}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isMine && (
                                <span className="capitalize">{msg.status}</span>
                              )}
                            </div>
                          </div>
                          {isMine && (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <UserRound className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t bg-background px-6 py-5">
                  <div className="rounded-3xl border bg-muted/20 p-3 shadow-sm">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Reply to ${activeConv.otherUser?.name ?? "buyer"}…`}
                      rows={3}
                      className="w-full resize-none border-0 bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground"
                    />
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <p className="text-xs text-muted-foreground">
                        Enter to send · Shift+Enter for new line
                      </p>
                      <Button
                        onClick={handleSend}
                        disabled={!draft.trim() || sending}
                        size="sm"
                      >
                        {sending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex min-h-[720px] items-center justify-center p-6 text-center">
              <div className="max-w-sm space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold">Select a buyer thread</h2>
                <p className="text-sm text-muted-foreground">
                  Pick a conversation from the left panel to start replying to your customers.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
