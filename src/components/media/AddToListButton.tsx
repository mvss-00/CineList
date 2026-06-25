"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { STATUS_LABELS } from "@/lib/utils";
import type { EntryStatus, Media } from "@/types/database";

interface AddToListButtonProps {
  media: Media;
  userId: string | null;
}

export function AddToListButton({ media, userId }: AddToListButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<EntryStatus>("plan_to_watch");
  const [rating, setRating] = useState<string>("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingEntry, setExistingEntry] = useState<{ id: string; status: EntryStatus } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!userId || !media.id) return;
    setChecking(true);
    const supabase = createClient();
    supabase
      .from("entries")
      .select("id, status")
      .eq("user_id", userId)
      .eq("media_id", media.id)
      .maybeSingle()
      .then(({ data }) => {
        setExistingEntry(data as { id: string; status: EntryStatus } | null);
        if (data) setStatus(data.status);
        setChecking(false);
      });
  }, [userId, media.id]);

  async function handleSave() {
    if (!userId) {
      toast({ title: "Требуется авторизация", description: "Войдите, чтобы добавить в список", variant: "destructive" });
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const payload = {
      user_id: userId,
      media_id: media.id,
      status,
      rating: rating ? parseInt(rating) : null,
      review_text: review || null,
      watched_at: status === "completed" ? new Date().toISOString() : null,
    };

    const { error } = existingEntry
      ? await supabase.from("entries").update(payload as never).eq("id", existingEntry.id)
      : await supabase.from("entries").insert(payload as never);

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: existingEntry ? "Запись обновлена" : "Добавлено в список", variant: "success" as "default" });
      setOpen(false);
    }
    setLoading(false);
  }

  if (!userId) {
    return (
      <Button variant="outline" onClick={() => toast({ title: "Войдите в аккаунт", description: "Авторизуйтесь, чтобы добавить в список" })}>
        <Plus className="w-4 h-4 mr-2" /> В список
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={checking}>
        {checking ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : existingEntry ? (
          <Check className="w-4 h-4 mr-2" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        {existingEntry ? STATUS_LABELS[existingEntry.status] : "В список"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{existingEntry ? "Обновить запись" : "Добавить в список"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EntryStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [EntryStatus, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Оценка (1–10)</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Не оценено" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Не оценено</SelectItem>
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Рецензия (необязательно)</Label>
              <Textarea
                placeholder="Ваши впечатления..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
