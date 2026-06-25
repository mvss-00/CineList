import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, Clock, Calendar, Users } from "lucide-react";
import { getMovieDetails } from "@/lib/tmdb";
import { TMDB_BACKDROP, TMDB_POSTER_LG, TMDB_PROFILE } from "@/types/tmdb";
import { createClient } from "@/lib/supabase/server";
import { AddToListButton } from "@/components/media/AddToListButton";
import { Badge } from "@/components/ui/badge";
import { EntryReviews } from "@/components/media/EntryReviews";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await getMovieDetails(parseInt(id));
    return { title: `${movie.title} — CineList` };
  } catch {
    return { title: "Фильм — CineList" };
  }
}

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tmdbId = parseInt(id);

  if (isNaN(tmdbId)) notFound();

  let movie;
  try {
    movie = await getMovieDetails(tmdbId);
  } catch {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get existing DB media record and average rating
  const { data: mediaRecordRaw } = await supabase
    .from("media")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .eq("type", "movie")
    .maybeSingle();

  const mediaRecord = mediaRecordRaw as { id: string } | null;

  type RatingRow = { rating: number | null };
  const { data: ratingDataRaw } = mediaRecord
    ? await supabase
        .from("entries")
        .select("rating")
        .eq("media_id", mediaRecord.id)
        .not("rating", "is", null)
    : { data: null };

  const ratingData = ratingDataRaw as RatingRow[] | null;

  const avgRating =
    ratingData && ratingData.length > 0
      ? (ratingData.reduce((sum: number, e: RatingRow) => sum + (e.rating || 0), 0) / ratingData.length).toFixed(1)
      : null;

  const backdropUrl = movie.backdrop_path ? `${TMDB_BACKDROP}${movie.backdrop_path}` : null;
  const posterUrl = movie.poster_path ? `${TMDB_POSTER_LG}${movie.poster_path}` : null;

  const director = movie.credits?.crew.find((c) => c.job === "Director");
  const cast = movie.credits?.cast.slice(0, 8) || [];

  // Prepare media object for the button
  const mediaForButton = {
    id: mediaRecord?.id || "",
    tmdb_id: tmdbId,
    title: movie.title,
    type: "movie" as const,
    poster_url: movie.poster_path ? `${TMDB_POSTER_LG}${movie.poster_path}` : null,
    release_year: movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : null,
    genres: movie.genres.map((g) => g.name),
    overview: movie.overview,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen">
      {/* Backdrop */}
      {backdropUrl && (
        <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
          <Image src={backdropUrl} alt={movie.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-white" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <div className="w-48 sm:w-56 md:w-64 mx-auto md:mx-0">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  width={256}
                  height={384}
                  className="rounded-2xl shadow-xl w-full"
                  priority
                />
              ) : (
                <div className="w-full aspect-[2/3] rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
                  <span className="text-white/40">Нет постера</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <Badge variant="default">Фильм</Badge>
              {movie.release_date && (
                <span className="text-sm text-[#6b7280] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {movie.release_date.slice(0, 4)}
                </span>
              )}
              {movie.runtime && (
                <span className="text-sm text-[#6b7280] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {movie.runtime} мин
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-2 leading-tight">
              {movie.title}
            </h1>

            {movie.tagline && (
              <p className="text-[#6b7280] italic mb-4">{movie.tagline}</p>
            )}

            {/* Ratings */}
            <div className="flex items-center gap-4 mb-4">
              {movie.vote_average > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-[#d4af37] text-[#d4af37]" />
                  <span className="font-bold text-lg text-[#1a1a1a]">{movie.vote_average.toFixed(1)}</span>
                  <span className="text-sm text-[#6b7280]">TMDB</span>
                </div>
              )}
              {avgRating && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-[#6b7280]" />
                  <span className="font-bold text-[#1a1a1a]">{avgRating}</span>
                  <span className="text-sm text-[#6b7280]">в CineList ({ratingData?.length ?? 0})</span>
                </div>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres.map((g) => (
                <Badge key={g.id} variant="secondary">{g.name}</Badge>
              ))}
            </div>

            {/* Overview */}
            {movie.overview && (
              <p className="text-[#1a1a1a]/80 leading-relaxed mb-6">{movie.overview}</p>
            )}

            {/* Director */}
            {director && (
              <p className="text-sm text-[#6b7280] mb-6">
                <span className="font-medium text-[#1a1a1a]">Режиссёр: </span>
                {director.name}
              </p>
            )}

            <AddToListButton media={mediaForButton} userId={user?.id || null} />
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">В ролях</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {cast.map((person) => (
                <div key={person.id} className="text-center">
                  <div className="w-full aspect-square rounded-full overflow-hidden bg-[#f5f5f5] mb-1 relative">
                    {person.profile_path ? (
                      <Image
                        src={`${TMDB_PROFILE}${person.profile_path}`}
                        alt={person.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-[#6b7280]">
                        👤
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-[#1a1a1a] line-clamp-1">{person.name}</p>
                  <p className="text-xs text-[#6b7280] line-clamp-1">{person.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {mediaRecord?.id && (
          <div className="mt-12">
            <EntryReviews mediaId={mediaRecord.id} currentUserId={user?.id || null} />
          </div>
        )}
      </div>
    </div>
  );
}
