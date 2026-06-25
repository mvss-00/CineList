"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2, Film, Tv } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MediaCard } from "@/components/media/MediaCard";
import type { TMDBMedia } from "@/types/tmdb";

export function SearchContent({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [results, setResults] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");

  const search = useCallback(async (q: string, page: number) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${page}`);
      const data = await res.json();
      setResults(data.results || []);
      setTotalPages(data.total_pages || 0);
      setCurrentPage(page);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = params.get("q");
    if (q) {
      setQuery(q);
      search(q, parseInt(params.get("page") || "1"));
    }
  }, [params, search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}&page=1`);
  }

  const filtered = filter === "all" ? results : results.filter(r => r.media_type === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-6">Поиск</h1>
        <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <Input
              type="search"
              placeholder="Название фильма или сериала..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Найти"}
          </Button>
        </form>
      </div>

      {results.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-[#6b7280]">Тип:</span>
            {(["all", "movie", "tv"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-[#e11d2a] text-white"
                    : "bg-[#f5f5f5] text-[#6b7280] hover:bg-[#e5e7eb]"
                }`}
              >
                {f === "movie" && <Film className="w-3 h-3" />}
                {f === "tv" && <Tv className="w-3 h-3" />}
                {f === "all" ? "Все" : f === "movie" ? "Фильмы" : "Сериалы"}
              </button>
            ))}
            <Badge variant="secondary" className="ml-2">{filtered.length} результатов</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((item) => (
              <MediaCard key={`${item.media_type}-${item.id}`} media={item} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`)}
              >
                Назад
              </Button>
              <span className="flex items-center text-sm text-[#6b7280] px-4">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`)}
              >
                Вперёд
              </Button>
            </div>
          )}
        </>
      )}

      {!loading && !results.length && params.get("q") && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-[#e5e7eb] mx-auto mb-4" />
          <p className="text-[#6b7280]">Ничего не найдено по запросу «{params.get("q")}»</p>
        </div>
      )}

      {!params.get("q") && (
        <div className="text-center py-16">
          <Film className="w-12 h-12 text-[#e5e7eb] mx-auto mb-4" />
          <p className="text-[#6b7280]">Введите название фильма или сериала</p>
        </div>
      )}
    </div>
  );
}
