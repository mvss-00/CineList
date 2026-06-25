import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, Calendar, Users, Layers } from "lucide-react";
import { getTVDetails } from "@/lib/tmdb";
import { TMDB_BACKDROP, TMDB_POSTER_LG, TMDB_PROFILE } from "@/types/tmdb";
import { createClient } from "@/lib/supabase/server";
import { AddToListButton } from "@/components/media/AddToListButton";
import { Badge } from "@/components/ui/badge";
import { EntryReviews } from "@/components/media/EntryReviews";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const show = await getTVDetails(parseInt(id));
    return { title: `${show.name} — CineList` };
  } catch {
    return { title: "Сериал — CineList" };
  }
}

export default async function TVDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tmdbId = parseInt(id);
  if (isNaN(tmdbId)) notFound();

  let show;
  try {
    show = await getTVDetails(tmdbId);
  } catch {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: mediaRecordRaw } = await supabase
    .from("media")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .eq("type", "series")
    .maybeSingle();

  const mediaRecord = mediaRecordRaw as { id: string } | null;

  type RatingRow = { rating: number | null };
  const { data: ratingDataRaw } = mediaRecord
    ? await supabase.from("entries").select("rating").eq("media_id", mediaRecord.id).not("rating", "is", null)
    : { data: null };

  const ratingData = ratingDataRaw as RatingRow[] | null;

  const avgRating =
    ratingData && ratingData.length > 0
      ? (ratingData.reduce((sum: number, e: RatingRow) => sum + (e.rating || 0), 0) / ratingData.length).toFixed(1)
      : null;

  const backdropUrl = show.backdrop_path ? `${TMDB_BACKDROP}${show.backdrop_path}` : null;
  const posterUrl = show.poster_path ? `${TMDB_POSTER_LG}${show.poster_path}` : null;
  const cast = show.credits?.cast.slice(0, 8) || [];

  const mediaForButton = {
    id: mediaRecord?.id || "",
    tmdb_id: tmdbId,
    title: show.name,
    type: "series" as const,
    poster_url: show.poster_path ? `${TMDB_POSTER_LG}${show.poster_path}` : null,
    release_year: show.first_air_date ? parseInt(show.first_air_date.slice(0, 4)) : null,
    genres: show.genres.map((g) => g.name),
    overview: show.overview,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen">
      {backdropUrl && (
        <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
          <Image src={backdropUrl} alt={show.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-white" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <div className="w-48 sm:w-56 md:w-64 mx-auto md:mx-0">
              {posterUrl ? (
                <Image src={posterUrl} alt={show.name} width={256} height={384} className="rounded-2xl shadow-xl w-full" priority />
              ) : (
                <div className="w-full aspect-[2/3] rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
                  <span className="text-white/40">Нет постера</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <Badge variant="info">Сериал</Badge>
              {show.first_air_date && (
                <span className="text-sm text-[#6b7280] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {show.first_air_date.slice(0, 4)}
                </span>
              )}
              {show.number_of_seasons && (
                <span className="text-sm text-[#6b7280] flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {show.number_of_seasons} сез.
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-2 leading-tight">{show.name}</h1>
            {show.tagline && <p className="text-[#6b7280] italic mb-4">{show.tagline}</p>}

            <div className="flex items-center gap-4 mb-4">
              {show.vote_average > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-[#d4af37] text-[#d4af37]" />
                  <span className="font-bold text-lg">{show.vote_average.toFixed(1)}</span>
                  <span className="text-sm text-[#6b7280]">TMDB</span>
                </div>
              )}
              {avgRating && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-[#6b7280]" />
                  <span className="font-bold">{avgRating}</span>
                  <span className="text-sm text-[#6b7280]">в CineList ({ratingData?.length ?? 0})</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {show.genres.map((g) => (
                <Badge key={g.id} variant="secondary">{g.name}</Badge>
              ))}
            </div>

            {show.overview && <p className="text-[#1a1a1a]/80 leading-relaxed mb-6">{show.overview}</p>}

            <AddToListButton media={mediaForButton} userId={user?.id || null} />
          </div>
        </div>

        {cast.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">В ролях</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {cast.map((person) => (
                <div key={person.id} className="text-center">
                  <div className="w-full aspect-square rounded-full overflow-hidden bg-[#f5f5f5] mb-1 relative">
                    {person.profile_path ? (
                      <Image src={`${TMDB_PROFILE}${person.profile_path}`} alt={person.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-[#6b7280]">👤</div>
                    )}
                  </div>
                  <p className="text-xs font-medium line-clamp-1">{person.name}</p>
                  <p className="text-xs text-[#6b7280] line-clamp-1">{person.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {mediaRecord?.id && (
          <div className="mt-12">
            <EntryReviews mediaId={mediaRecord.id} currentUserId={user?.id || null} />
          </div>
        )}
      </div>
    </div>
  );
}
