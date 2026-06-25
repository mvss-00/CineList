import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TMDB_POSTER_MD } from "@/types/tmdb";
import type { TMDBMedia } from "@/types/tmdb";
import { getMediaTitle, getMediaYear } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  media: TMDBMedia;
  className?: string;
}

export function MediaCard({ media, className }: MediaCardProps) {
  const title = getMediaTitle(media);
  const year = getMediaYear(media);
  const isTV = media.media_type === "tv";
  const href = isTV ? `/media/tv/${media.id}` : `/media/movie/${media.id}`;
  const posterUrl = media.poster_path ? `${TMDB_POSTER_MD}${media.poster_path}` : null;

  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#f5f5f5] shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:ring-2 group-hover:ring-[#e11d2a]">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 15vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
            <span className="text-white/40 text-sm text-center px-2 font-medium">{title}</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={isTV ? "info" : "default"} className="text-xs shadow">
            {isTV ? "Сериал" : "Фильм"}
          </Badge>
        </div>

        {/* Rating */}
        {media.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 rounded-full px-2 py-0.5">
            <Star className="w-3 h-3 fill-[#d4af37] text-[#d4af37]" />
            <span className="text-white text-xs font-medium">
              {media.vote_average.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 space-y-0.5">
        <h3 className="text-sm font-semibold text-[#1a1a1a] line-clamp-2 group-hover:text-[#e11d2a] transition-colors">
          {title}
        </h3>
        {year && <p className="text-xs text-[#6b7280]">{year}</p>}
      </div>
    </Link>
  );
}
