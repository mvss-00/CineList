"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  className?: string;
}

export function StarRating({ rating, maxRating = 10, className }: StarRatingProps) {
  const stars = 5;
  const filled = (rating / maxRating) * stars;

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: stars }).map((_, i) => {
        const isFull = i < Math.floor(filled);
        const isHalf = !isFull && i < filled;
        return (
          <Star
            key={i}
            className={cn(
              "w-4 h-4",
              isFull && "fill-[#d4af37] text-[#d4af37]",
              isHalf && "fill-[#d4af37]/50 text-[#d4af37]",
              !isFull && !isHalf && "text-[#e5e7eb] fill-[#e5e7eb]"
            )}
          />
        );
      })}
      <span className="ml-1 text-sm font-medium text-[#1a1a1a]">{rating.toFixed(1)}</span>
    </div>
  );
}
