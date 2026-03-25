"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Loader2,
  Users,
  Trash2,
  Pencil,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Search,
  X,
  TrendingUp,
  UserCheck,
  UserMinus,
  Sparkles,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  totalSpent: number | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: "default" | "secondary" | "destructive" | "outline"; dot: string; bg: string }
> = {
  lead: { label: "Lead", badge: "secondary", dot: "bg-blue-400", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  prospect: { label: "Prospect", badge: "outline", dot: "bg-yellow-400", bg: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  customer: { label: "Customer", badge: "default", dot: "bg-green-500", bg: "bg-green-50 text-green-700 border-green-200" },
  inactive: { label: "Inactive", badge: "outline", dot: "bg-gray-400", bg: "bg-gray-100 text-gray-600 border-gray-200" },
};

const EMPTY_FORM = {
  name: "", email: "", phone: "", company: "", status: "lead", notes: "",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name: string): string {
  const colors = [
    "bg-violet-500", "bg-blue-500", "bg-green-500", "bg-orange-500",
    "bg-pink-500", "bg-teal-500", "bg-red-500", "bg-indigo-500",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchContacts = async () => {
    const res = await fetch("/api/seller/customers");
    const data = await res.json();
    setContacts(data.contacts ?? []);
  };

  useEffect(() => {
    fetchContacts().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editingId) {
      await fetch("/api/seller/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      });
    } else {
      await fetch("/api/seller/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    await fetchContacts();
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
    setSelected(null);
    setSaving(false);
  };

  const handleEdit = (c: Contact) => {
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", company: c.company ?? "", status: c.status, notes: c.notes ?? "" });
    setEditingId(c.id);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this contact?")) return;
    setDeletingId(id);
    await fetch("/api/seller/customers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchContacts();
    if (selected?.id === id) setSelected(null);
    setDeletingId(null);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
  };

  // Pipeline stats
  const counts = {
    all: contacts.length,
    lead: contacts.filter((c) => c.status === "lead").length,
    prospect: contacts.filter((c) => c.status === "prospect").length,
    customer: contacts.filter((c) => c.status === "customer").length,
    inactive: contacts.filter((c) => c.status === "inactive").length,
  };
  const totalRevenue = contacts.reduce((sum, c) => sum + (c.totalSpent ?? 0), 0);

  // Filtered list
  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q) || (c.company ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">Manage your contacts and customer pipeline.</p>
        </div>
        <Button onClick={() => { setShowForm(true); setSelected(null); setEditingId(null); setForm(EMPTY_FORM); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Contact
        </Button>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="col-span-1 text-center py-3">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-foreground">{counts.all}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Users className="h-3 w-3" /> Total
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-1 text-center py-3">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-blue-600">{counts.lead}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" /> Leads
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-1 text-center py-3">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-yellow-600">{counts.prospect}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" /> Prospects
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-1 text-center py-3">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-green-600">{counts.customer}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <UserCheck className="h-3 w-3" /> Customers
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-1 text-center py-3">
          <CardContent className="p-0">
            <p className="text-lg font-bold text-green-700">
              {(totalRevenue / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <DollarSign className="h-3 w-3" /> Revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline funnel bar */}
      {contacts.length > 0 && (
        <div className="flex rounded-full overflow-hidden h-2.5 gap-0.5">
          {counts.lead > 0 && <div className="bg-blue-400 transition-all" style={{ width: `${(counts.lead / counts.all) * 100}%` }} title={`${counts.lead} leads`} />}
          {counts.prospect > 0 && <div className="bg-yellow-400 transition-all" style={{ width: `${(counts.prospect / counts.all) * 100}%` }} title={`${counts.prospect} prospects`} />}
          {counts.customer > 0 && <div className="bg-green-500 transition-all" style={{ width: `${(counts.customer / counts.all) * 100}%` }} title={`${counts.customer} customers`} />}
          {counts.inactive > 0 && <div className="bg-gray-300 transition-all" style={{ width: `${(counts.inactive / counts.all) * 100}%` }} title={`${counts.inactive} inactive`} />}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts…" className="pl-9 h-9" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {(["all", "lead", "prospect", "customer", "inactive"] as const).map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "ghost"} className="h-8 text-xs capitalize"
              onClick={() => setStatusFilter(s)}>
              {s} {s !== "all" && <span className="ml-1 opacity-70">({counts[s]})</span>}
            </Button>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6 min-h-[500px]">
        {/* Contact list */}
        <div className="col-span-1 space-y-2">
          <p className="text-xs font-medium text-muted-foreground px-1">
            {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
          </p>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-xl">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{contacts.length === 0 ? "No contacts yet" : "No matches"}</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map((c) => {
                const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.lead;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelected(c); setShowForm(false); }}
                    className={`w-full text-left rounded-xl border p-3 hover:border-primary transition-all hover:shadow-sm ${selected?.id === c.id ? "border-primary bg-primary/5 shadow-sm" : "bg-card"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${avatarColor(c.name)}`}>
                        {initials(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-semibold text-sm truncate">{c.name}</p>
                          <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium ${cfg.bg}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {c.company && <p className="text-xs text-muted-foreground truncate">{c.company}</p>}
                        {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                        {(c.totalSpent ?? 0) > 0 && (
                          <p className="text-xs font-semibold text-green-600 mt-1">
                            {((c.totalSpent ?? 0) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="col-span-2">
          {showForm ? (
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{editingId ? "Edit Contact" : "New Contact"}</CardTitle>
                <CardDescription>Fill in the contact details below.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Name *</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Company</Label>
                      <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Pipeline Stage</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {(["lead", "prospect", "customer", "inactive"] as const).map((s) => {
                          const cfg = STATUS_CONFIG[s];
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setForm({ ...form, status: s })}
                              className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${form.status === s ? `border-primary bg-primary/5` : "border-border hover:border-muted-foreground/40"}`}
                            >
                              <div className={`h-2 w-2 rounded-full ${cfg.dot} mx-auto mb-1`} />
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Notes</Label>
                      <textarea
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[90px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Notes about this contact…"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingId ? "Save Changes" : "Add Contact"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : selected ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold ${avatarColor(selected.name)}`}>
                      {initials(selected.name)}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{selected.name}</CardTitle>
                      {selected.company && (
                        <CardDescription className="flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3.5 w-3.5" /> {selected.company}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const cfg = STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.lead;
                      return (
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} mr-1.5`} />
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {selected.email && (
                    <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm rounded-lg border p-3 hover:bg-muted/40 transition-colors">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{selected.email}</span>
                    </a>
                  )}
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm rounded-lg border p-3 hover:bg-muted/40 transition-colors">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{selected.phone}</span>
                    </a>
                  )}
                  <div className="flex items-center gap-2 text-sm rounded-lg border p-3 bg-green-50">
                    <DollarSign className="h-4 w-4 text-green-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-700">
                        {((selected.totalSpent ?? 0) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                      </p>
                      <p className="text-xs text-green-600">Total spent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm rounded-lg border p-3">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium">{STATUS_CONFIG[selected.status]?.label ?? selected.status}</p>
                      <p className="text-xs text-muted-foreground">Pipeline stage</p>
                    </div>
                  </div>
                </div>

                {selected.notes && (
                  <>
                    <Separator />
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Notes</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selected.notes}</p>
                    </div>
                  </>
                )}

                <Separator />
                <p className="text-xs text-muted-foreground">
                  Added {new Date(selected.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(selected)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  {selected.email && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${selected.email}`}>
                        <Mail className="mr-2 h-4 w-4" /> Email
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                    onClick={() => handleDelete(selected.id)} disabled={deletingId === selected.id}>
                    {deletingId === selected.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-xl">
              <Users className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">Select a contact</p>
              <p className="text-sm">or click &ldquo;Add Contact&rdquo; to create one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
