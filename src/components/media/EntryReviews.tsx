"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDateShort, getInitials, STATUS_LABELS } from "@/lib/utils";
import type { EntryWithProfile } from "@/types/database";

type ReviewEntry = EntryWithProfile;

interface EntryReviewsProps {
  mediaId: string;
  currentUserId: string | null;
}

export function EntryReviews({ mediaId, currentUserId }: EntryReviewsProps) {
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("entries")
      .select("*, profile:profiles(*), media:media(*)")
      .eq("media_id", mediaId)
      .not("review_text", "is", null)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setReviews((data as unknown as ReviewEntry[]) || []);
        setLoading(false);
      });
  }, [mediaId]);

  if (loading) return null;
  if (reviews.length === 0) return (
    <div className="border-t border-[#e5e7eb] pt-8">
      <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">Рецензии</h2>
      <p className="text-[#6b7280] text-sm">Рецензий пока нет. Будьте первым!</p>
    </div>
  );

  return (
    <div className="border-t border-[#e5e7eb] pt-8">
      <h2 className="text-xl font-bold text-[#1a1a1a] mb-6">
        Рецензии <span className="text-[#6b7280] font-normal text-base">({reviews.length})</span>
      </h2>
      <div className="space-y-4">
        {reviews.map((entry) => (
          <div key={entry.id} className="bg-[#f5f5f5] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Link href={`/profile/${entry.profile.username}`}>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={entry.profile.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{getInitials(entry.profile.username)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/profile/${entry.profile.username}`} className="font-medium text-sm text-[#1a1a1a] hover:text-[#e11d2a]">
                    {entry.profile.username}
                  </Link>
                  <Badge variant="secondary" className="text-xs">{STATUS_LABELS[entry.status]}</Badge>
                  {entry.rating && (
                    <span className="flex items-center gap-0.5 text-xs">
                      <Star className="w-3 h-3 fill-[#d4af37] text-[#d4af37]" />
                      {entry.rating}/10
                    </span>
                  )}
                  <span className="text-xs text-[#6b7280] ml-auto">{formatDateShort(entry.created_at)}</span>
                </div>
                <p className="text-sm text-[#1a1a1a]/80 leading-relaxed">{entry.review_text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
