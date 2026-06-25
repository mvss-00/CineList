import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MediaInsert = Database["public"]["Tables"]["media"]["Insert"];
type EntryInsert = Database["public"]["Tables"]["entries"]["Insert"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { media, status, rating, review_text } = body;

  const mediaPayload: MediaInsert = {
    tmdb_id: media.tmdb_id,
    title: media.title,
    type: media.type,
    poster_url: media.poster_url,
    release_year: media.release_year,
    genres: media.genres || [],
    overview: media.overview,
  };

  const { data: mediaData, error: mediaError } = await supabase
    .from("media")
    .upsert(mediaPayload, { onConflict: "tmdb_id,type" })
    .select()
    .single();

  if (mediaError || !mediaData) {
    return NextResponse.json({ error: mediaError?.message || "Failed to upsert media" }, { status: 500 });
  }

  const entryPayload: EntryInsert = {
    user_id: user.id,
    media_id: (mediaData as { id: string }).id,
    status,
    rating: rating || null,
    review_text: review_text || null,
    watched_at: status === "completed" ? new Date().toISOString() : null,
  };

  const { data: entry, error: entryError } = await supabase
    .from("entries")
    .upsert(entryPayload, { onConflict: "user_id,media_id" })
    .select()
    .single();

  if (entryError) {
    return NextResponse.json({ error: entryError.message }, { status: 500 });
  }

  return NextResponse.json({ entry, media: mediaData });
}
