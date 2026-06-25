"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TMDB_POSTER_SM } from "@/types/tmdb";
import { formatDateShort, getInitials, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import type { EntryWithProfile } from "@/types/database";

type FeedEntry = EntryWithProfile;

interface FeedEntriesProps {
  userId: string;
}

export function FeedEntries({ userId }: FeedEntriesProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    // Get people the user follows
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId)
      .then(({ data: follows }) => {
        const followingIds = (follows ?? []).map((f) => (f as unknown as { following_id: string }).following_id);
        // Include own entries too
        const allIds = [...followingIds, userId];

        return supabase
          .from("entries")
          .select("*, profile:profiles(*), media:media(*)")
          .in("user_id", allIds)
          .order("created_at", { ascending: false })
          .limit(20);
      })
      .then(({ data }) => {
        setEntries((data as unknown as FeedEntry[]) || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#f5f5f5] rounded-xl h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-[#f5f5f5] rounded-xl">
        <Users className="w-10 h-10 text-[#e5e7eb] mx-auto mb-3" />
        <p className="text-[#6b7280] font-medium">Лента пуста</p>
        <p className="text-sm text-[#6b7280] mt-1">Подпишитесь на других пользователей, чтобы видеть их активность</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {entries.map((entry) => {
        const mediaHref = entry.media.type === "movie"
          ? `/media/movie/${entry.media.tmdb_id}`
          : `/media/tv/${entry.media.tmdb_id}`;
        return (
          <div key={entry.id} className="flex gap-3 bg-white border border-[#e5e7eb] rounded-xl p-4 hover:border-[#e11d2a]/30 transition-colors">
            {/* Poster */}
            <Link href={mediaHref} className="flex-shrink-0">
              <div className="w-12 h-18 relative rounded-lg overflow-hidden bg-[#f5f5f5]" style={{ height: "72px" }}>
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
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/profile/${entry.profile.username}`}>
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={entry.profile.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[9px]">{getInitials(entry.profile.username)}</AvatarFallback>
                  </Avatar>
                </Link>
                <Link href={`/profile/${entry.profile.username}`} className="text-xs font-medium text-[#1a1a1a] hover:text-[#e11d2a]">
                  {entry.profile.username}
                </Link>
                <span className="text-xs text-[#6b7280]">{formatDateShort(entry.created_at)}</span>
              </div>
              <Link href={mediaHref} className="block">
                <p className="font-semibold text-sm text-[#1a1a1a] hover:text-[#e11d2a] line-clamp-1">{entry.media.title}</p>
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[entry.status]}`}>
                  {STATUS_LABELS[entry.status]}
                </Badge>
                {entry.rating && (
                  <span className="flex items-center gap-0.5 text-xs">
                    <Star className="w-3 h-3 fill-[#d4af37] text-[#d4af37]" />
                    {entry.rating}/10
                  </span>
                )}
              </div>
              {entry.review_text && (
                <p className="text-xs text-[#6b7280] mt-1 line-clamp-2">{entry.review_text}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
