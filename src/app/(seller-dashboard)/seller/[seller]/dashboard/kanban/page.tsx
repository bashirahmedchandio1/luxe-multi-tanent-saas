"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Plus,
  Trash2,
  Kanban,
  MoreHorizontal,
  Edit2,
  X,
  Check,
  Calendar,
  GripVertical,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface KanbanCard {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  position: number;
  columnId: string;
}

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  position: number;
  cards: KanbanCard[];
}

interface KanbanBoard {
  id: string;
  name: string;
  columns: KanbanColumn[];
}

const PRIORITY_CONFIG: Record<
  string,
  { label: string; badge: string; border: string }
> = {
  low: {
    label: "Low",
    badge: "bg-blue-50 text-blue-600 border-blue-200",
    border: "border-l-blue-400",
  },
  medium: {
    label: "Medium",
    badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
    border: "border-l-yellow-400",
  },
  high: {
    label: "High",
    badge: "bg-orange-50 text-orange-600 border-orange-200",
    border: "border-l-orange-400",
  },
  urgent: {
    label: "Urgent",
    badge: "bg-red-50 text-red-600 border-red-200",
    border: "border-l-red-500",
  },
};

const COLUMN_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
];

const EMPTY_FORM = { title: "", description: "", priority: "medium", dueDate: "" };

export default function KanbanPage() {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);

  // Add card
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newCard, setNewCard] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Edit card modal
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);

  // Delete
  const [deletingCard, setDeletingCard] = useState<string | null>(null);
  const [deletingColumn, setDeletingColumn] = useState<string | null>(null);

  // Drag and drop
  const [dragging, setDragging] = useState<{ cardId: string; fromColumnId: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Add column
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [addingColSaving, setAddingColSaving] = useState(false);

  // Rename column
  const [renamingColumn, setRenamingColumn] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  const fetchBoard = async () => {
    const res = await fetch("/api/seller/kanban");
    const data = await res.json();
    setBoard(data.board);
  };

  useEffect(() => {
    fetchBoard().finally(() => setLoading(false));
  }, []);

  // ── Card operations ──────────────────────────────────────────────────────────

  const handleAddCard = async (columnId: string) => {
    if (!newCard.title.trim()) return;
    setSaving(true);
    await fetch("/api/seller/kanban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "card",
        columnId,
        title: newCard.title.trim(),
        description: newCard.description || null,
        priority: newCard.priority,
        dueDate: newCard.dueDate || null,
      }),
    });
    await fetchBoard();
    setNewCard(EMPTY_FORM);
    setAddingToColumn(null);
    setSaving(false);
  };

  const openEditCard = (card: KanbanCard) => {
    setEditingCard(card);
    setEditForm({
      title: card.title,
      description: card.description ?? "",
      priority: card.priority,
      dueDate: card.dueDate ? card.dueDate.split("T")[0] : "",
    });
  };

  const handleUpdateCard = async () => {
    if (!editingCard || !editForm.title.trim()) return;
    setEditSaving(true);
    await fetch("/api/seller/kanban", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "card",
        id: editingCard.id,
        title: editForm.title.trim(),
        description: editForm.description || null,
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
      }),
    });
    await fetchBoard();
    setEditingCard(null);
    setEditSaving(false);
  };

  const handleDeleteCard = async (id: string) => {
    setDeletingCard(id);
    await fetch("/api/seller/kanban", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "card", id }),
    });
    await fetchBoard();
    setDeletingCard(null);
  };

  // ── Drag and Drop ────────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, cardId: string, fromColumnId: string) => {
    setDragging({ cardId, fromColumnId });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOver !== columnId) setDragOver(columnId);
  };

  const handleDrop = async (e: React.DragEvent, toColumnId: string) => {
    e.preventDefault();
    if (!dragging || dragging.fromColumnId === toColumnId) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    await fetch("/api/seller/kanban", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "card", id: dragging.cardId, columnId: toColumnId }),
    });
    await fetchBoard();
    setDragging(null);
    setDragOver(null);
  };

  // ── Column operations ────────────────────────────────────────────────────────

  const handleAddColumn = async () => {
    if (!newColumnName.trim() || !board) return;
    setAddingColSaving(true);
    const color = COLUMN_COLORS[board.columns.length % COLUMN_COLORS.length];
    await fetch("/api/seller/kanban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "column", boardId: board.id, name: newColumnName.trim(), color }),
    });
    await fetchBoard();
    setNewColumnName("");
    setAddingColumn(false);
    setAddingColSaving(false);
  };

  const handleRenameColumn = async (columnId: string) => {
    if (!renameValue.trim()) return;
    setRenameSaving(true);
    await fetch("/api/seller/kanban", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "column", id: columnId, name: renameValue.trim() }),
    });
    await fetchBoard();
    setRenamingColumn(null);
    setRenameSaving(false);
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Delete this column and all its cards?")) return;
    setDeletingColumn(columnId);
    await fetch("/api/seller/kanban", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "column", id: columnId }),
    });
    await fetchBoard();
    setDeletingColumn(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Kanban className="h-12 w-12 mb-3 opacity-30" />
        <p>Could not load board. Please refresh.</p>
      </div>
    );
  }

  return (
    <>
      {/* Edit Card Modal */}
      <AnimatePresence>
        {editingCard && (
          <motion.div
            key="edit-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setEditingCard(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Edit Card</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setEditingCard(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Title
                  </label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Card title"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleUpdateCard()}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    placeholder="Optional description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Priority
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Due Date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={() => setEditingCard(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateCard}
                  disabled={editSaving || !editForm.title.trim()}
                >
                  {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board */}
      <div className="flex flex-col h-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
            <p className="text-muted-foreground mt-1">
              Drag cards between columns to update their status.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setAddingColumn(true);
              setNewColumnName("");
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </Button>
        </div>

        {/* Columns */}
        <div
          className="overflow-x-auto pb-6 -mx-1 px-1"
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOver(null);
            }
          }}
        >
          <div
            className="flex gap-4 items-start"
            style={{
              minWidth: `${(board.columns.length + (addingColumn ? 1 : 0)) * 308}px`,
            }}
          >
            {board.columns.map((col) => {
              const isDropTarget = dragOver === col.id;
              return (
                <div
                  key={col.id}
                  className={`flex-shrink-0 w-72 rounded-xl border-2 flex flex-col transition-all duration-150 ${
                    isDropTarget
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-transparent bg-muted/40"
                  }`}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  {/* Column Header */}
                  <div className="flex items-center gap-2 px-3 py-3 border-b border-border/60">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: col.color }}
                    />

                    {renamingColumn === col.id ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-7 text-sm py-0 flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameColumn(col.id);
                            if (e.key === "Escape") setRenamingColumn(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0 text-green-600 hover:text-green-700"
                          onClick={() => handleRenameColumn(col.id)}
                          disabled={renameSaving}
                        >
                          {renameSaving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => setRenamingColumn(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-sm flex-1 truncate">{col.name}</span>
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0 h-5 shrink-0"
                        >
                          {col.cards.length}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0"
                              disabled={deletingColumn === col.id}
                            >
                              {deletingColumn === col.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => {
                                setAddingToColumn(col.id);
                                setNewCard(EMPTY_FORM);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Card
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setRenamingColumn(col.id);
                                setRenameValue(col.name);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteColumn(col.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Column
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>

                  {/* Cards List */}
                  <div className="flex-1 p-2 space-y-2 min-h-[100px]">
                    <AnimatePresence initial={false}>
                      {col.cards.map((card) => {
                        const pCfg = PRIORITY_CONFIG[card.priority] ?? PRIORITY_CONFIG.medium;
                        const isDragging = dragging?.cardId === card.id;
                        return (
                          <motion.div
                            key={card.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            draggable
                            onDragStart={(e) =>
                              handleDragStart(
                                e as unknown as React.DragEvent,
                                card.id,
                                col.id
                              )
                            }
                            onDragEnd={() => {
                              setDragging(null);
                              setDragOver(null);
                            }}
                            className={`rounded-lg border-l-4 bg-white border border-border/60 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group ${pCfg.border}`}
                          >
                            <div className="flex items-start gap-1.5">
                              <GripVertical className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-start justify-between gap-1">
                                  <p className="font-medium text-sm leading-snug flex-1">
                                    {card.title}
                                  </p>
                                  <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => openEditCard(card)}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteCard(card.id)}
                                      disabled={deletingCard === card.id}
                                    >
                                      {deletingCard === card.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {card.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {card.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between gap-2 pt-0.5">
                                  <span
                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${pCfg.badge}`}
                                  >
                                    {pCfg.label}
                                  </span>
                                  {card.dueDate && (
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(card.dueDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Empty drop zone */}
                    {col.cards.length === 0 && addingToColumn !== col.id && (
                      <div
                        className={`flex items-center justify-center h-20 rounded-lg border-2 border-dashed transition-colors ${
                          isDropTarget
                            ? "border-primary/60 bg-primary/5"
                            : "border-border/50"
                        }`}
                      >
                        <p className="text-xs text-muted-foreground/60">Drop cards here</p>
                      </div>
                    )}

                    {/* Add Card inline form */}
                    <AnimatePresence>
                      {addingToColumn === col.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="rounded-lg border bg-white p-3 space-y-2 shadow-sm"
                        >
                          <Input
                            placeholder="Card title..."
                            value={newCard.title}
                            onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                            autoFocus
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddCard(col.id);
                              if (e.key === "Escape") setAddingToColumn(null);
                            }}
                          />
                          <textarea
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                            placeholder="Description (optional)"
                            value={newCard.description}
                            onChange={(e) =>
                              setNewCard({ ...newCard, description: e.target.value })
                            }
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                              value={newCard.priority}
                              onChange={(e) =>
                                setNewCard({ ...newCard, priority: e.target.value })
                              }
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                            <input
                              type="date"
                              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                              value={newCard.dueDate}
                              onChange={(e) =>
                                setNewCard({ ...newCard, dueDate: e.target.value })
                              }
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleAddCard(col.id)}
                              disabled={saving || !newCard.title.trim()}
                            >
                              {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                              Add Card
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setAddingToColumn(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Add card footer button */}
                  {addingToColumn !== col.id && (
                    <div className="p-2 border-t border-border/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground hover:text-foreground h-8 text-xs gap-1"
                        onClick={() => {
                          setAddingToColumn(col.id);
                          setNewCard(EMPTY_FORM);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add card
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Column inline form */}
            {addingColumn && (
              <div className="flex-shrink-0 w-72 rounded-xl border-2 border-dashed border-border bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">New column</p>
                <Input
                  placeholder="Column name..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddColumn();
                    if (e.key === "Escape") setAddingColumn(false);
                  }}
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleAddColumn}
                    disabled={addingColSaving || !newColumnName.trim()}
                  >
                    {addingColSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    Add Column
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setAddingColumn(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
