"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Star, Edit2, Trash2, Filter, SortAsc, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { STATUS_LABELS, STATUS_COLORS, formatDateShort, cn } from "@/lib/utils";
import { TMDB_POSTER_SM } from "@/types/tmdb";
import type { EntryWithMedia, EntryStatus } from "@/types/database";

type DiaryEntry = EntryWithMedia;

interface DiaryContentProps {
  entries: DiaryEntry[];
  userId: string;
}

export function DiaryContent({ entries: initialEntries, userId }: DiaryContentProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>(initialEntries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "rating" | "title">("created_at");
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [editStatus, setEditStatus] = useState<EntryStatus>("watching");
  const [editRating, setEditRating] = useState("");
  const [editReview, setEditReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = entries
    .filter((e) => {
      const matchSearch = e.media.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "title") return a.media.title.localeCompare(b.media.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  function openEdit(entry: DiaryEntry) {
    setEditingEntry(entry);
    setEditStatus(entry.status);
    setEditRating(entry.rating ? String(entry.rating) : "");
    setEditReview(entry.review_text || "");
  }

  async function saveEdit() {
    if (!editingEntry) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("entries")
      .update({
        status: editStatus,
        rating: editRating ? parseInt(editRating) : null,
        review_text: editReview || null,
        watched_at: editStatus === "completed" ? new Date().toISOString() : (editingEntry.watched_at ?? null),
      })
      .eq("id", editingEntry.id)
      .select("*, media:media(*)")
      .single();

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      setEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? (data as unknown as DiaryEntry) : e)));
      toast({ title: "Запись обновлена" });
      setEditingEntry(null);
    }
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Запись удалена" });
    }
    setDeletingId(null);
  }

  const stats = {
    total: entries.length,
    completed: entries.filter((e) => e.status === "completed").length,
    watching: entries.filter((e) => e.status === "watching").length,
    plan: entries.filter((e) => e.status === "plan_to_watch").length,
    avgRating: entries.filter((e) => e.rating).length
      ? (entries.reduce((sum, e) => sum + (e.rating || 0), 0) / entries.filter((e) => e.rating).length).toFixed(1)
      : null,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="w-6 h-6 text-[#e11d2a]" />
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Мой дневник</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Всего записей", value: stats.total, color: "text-[#1a1a1a]" },
          { label: "Просмотрено", value: stats.completed, color: "text-green-600" },
          { label: "Смотрю", value: stats.watching, color: "text-blue-600" },
          { label: "Средняя оценка", value: stats.avgRating ? `${stats.avgRating}/10` : "—", color: "text-[#d4af37]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#e5e7eb] rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-[#6b7280] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {(Object.entries(STATUS_LABELS) as [EntryStatus, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-40">
            <SortAsc className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">По дате</SelectItem>
            <SelectItem value="rating">По оценке</SelectItem>
            <SelectItem value="title">По названию</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-[#6b7280] mb-4">{filtered.length} записей</p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-[#e5e7eb] mx-auto mb-4" />
          <p className="text-[#6b7280]">
            {entries.length === 0 ? "Ваш дневник пуст. Добавьте первый фильм!" : "Ничего не найдено"}
          </p>
          {entries.length === 0 && (
            <Link href="/search" className="mt-4 inline-block">
              <Button>Найти фильмы</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const mediaHref = entry.media.type === "movie"
              ? `/media/movie/${entry.media.tmdb_id}`
              : `/media/tv/${entry.media.tmdb_id}`;

            return (
              <div key={entry.id} className="flex gap-4 bg-white border border-[#e5e7eb] rounded-xl p-4 hover:border-[#e11d2a]/30 transition-colors">
                {/* Poster */}
                <Link href={mediaHref} className="flex-shrink-0">
                  <div className="relative w-12 rounded-lg overflow-hidden bg-[#f5f5f5]" style={{ height: "72px" }}>
                    {entry.media.poster_url ? (
                      <Image
                        src={entry.media.poster_url.startsWith("http") ? entry.media.poster_url : `${TMDB_POSTER_SM}${entry.media.poster_url}`}
                        alt={entry.media.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1a1a1a]" />
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={mediaHref}>
                        <h3 className="font-semibold text-[#1a1a1a] hover:text-[#e11d2a] transition-colors line-clamp-1">
                          {entry.media.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[entry.status])}>
                          {STATUS_LABELS[entry.status]}
                        </Badge>
                        {entry.media.release_year && (
                          <span className="text-xs text-[#6b7280]">{entry.media.release_year}</span>
                        )}
                        <span className="text-xs text-[#6b7280]">{formatDateShort(entry.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {entry.rating && (
                        <span className="flex items-center gap-0.5 text-sm font-medium">
                          <Star className="w-3.5 h-3.5 fill-[#d4af37] text-[#d4af37]" />
                          {entry.rating}/10
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(entry)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteEntry(entry.id)}
                        disabled={deletingId === entry.id}
                      >
                        {deletingId === entry.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {entry.review_text && (
                    <p className="text-xs text-[#6b7280] mt-1.5 line-clamp-2">{entry.review_text}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать запись</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as EntryStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [EntryStatus, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Оценка (1–10)</Label>
              <Select value={editRating} onValueChange={setEditRating}>
                <SelectTrigger><SelectValue placeholder="Не оценено" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Не оценено</SelectItem>
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Рецензия</Label>
              <Textarea value={editReview} onChange={(e) => setEditReview(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>Отмена</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
