import { createClient } from "@/lib/supabase/server";
import { getTrending } from "@/lib/tmdb";
import { MediaCard } from "@/components/media/MediaCard";
import { FeedEntries } from "@/components/layout/FeedEntries";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, Rss, Film } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let trending: import("@/types/tmdb").TMDBMedia[] = [];
  try {
    trending = await getTrending("week");
  } catch {
    trending = [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero for anonymous users */}
      {!user && (
        <div className="relative overflow-hidden rounded-2xl bg-[#1a1a1a] text-white px-8 py-12 md:py-16">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#e11d2a] rounded-lg flex items-center justify-center">
                <Film className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl">Cine<span className="text-[#e11d2a]">List</span></span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
              Ваш личный<br />
              <span className="text-[#e11d2a]">кинодневник</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-lg">
              Отслеживайте просмотренные фильмы и сериалы, ставьте оценки, пишите рецензии и следите за вкусами друзей.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register">
                <Button size="lg" className="bg-[#e11d2a] hover:bg-[#c41a25]">
                  Начать бесплатно
                </Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50">
                  Искать фильмы
                </Button>
              </Link>
            </div>
          </div>
          {/* Background pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 hidden md:block">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="absolute w-24 h-36 bg-white rounded-lg transform rotate-6"
                style={{ right: `${(i % 3) * 28 + 5}%`, top: `${Math.floor(i / 3) * 50 + 10}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* Social feed */}
      {user && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Rss className="w-5 h-5 text-[#e11d2a]" />
            <h2 className="text-xl font-bold text-[#1a1a1a]">Лента подписок</h2>
          </div>
          <FeedEntries userId={user.id} />
        </section>
      )}

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#e11d2a]" />
            <h2 className="text-xl font-bold text-[#1a1a1a]">Популярное на этой неделе</h2>
          </div>
          <Link href="/search">
            <Button variant="ghost" size="sm" className="text-[#e11d2a]">
              Больше →
            </Button>
          </Link>
        </div>
        {trending.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {trending.slice(0, 12).map((item) => (
              <MediaCard key={`${item.media_type}-${item.id}`} media={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[#6b7280]">
            <Film className="w-12 h-12 text-[#e5e7eb] mx-auto mb-4" />
            <p>Не удалось загрузить тренды. Проверьте TMDB API ключ.</p>
          </div>
        )}
      </section>
    </div>
  );
}
