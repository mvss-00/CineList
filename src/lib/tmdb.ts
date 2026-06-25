import type {
  TMDBMovieDetail,
  TMDBTVDetail,
  TMDBSearchResult,
  TMDBMedia,
  TMDBGenre,
} from "@/types/tmdb";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.TMDB_READ_ACCESS_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`;
  }
  return headers;
}

function buildUrl(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  if (!process.env.TMDB_READ_ACCESS_TOKEN && process.env.NEXT_PUBLIC_TMDB_API_KEY) {
    url.searchParams.set("api_key", process.env.NEXT_PUBLIC_TMDB_API_KEY);
  }
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

export async function searchMulti(
  query: string,
  page = 1
): Promise<TMDBSearchResult<TMDBMedia>> {
  const url = buildUrl("/search/multi", {
    query,
    page: String(page),
    include_adult: "false",
    language: "ru-RU",
  });
  const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);
  const data = await res.json();
  data.results = data.results.filter(
    (r: TMDBMedia) => r.media_type === "movie" || r.media_type === "tv"
  );
  return data;
}

export async function getTrending(
  timeWindow: "day" | "week" = "week"
): Promise<TMDBMedia[]> {
  const url = buildUrl(`/trending/all/${timeWindow}`, { language: "ru-RU" });
  const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB trending failed: ${res.status}`);
  const data = await res.json();
  return data.results;
}

export async function getMovieDetails(id: number): Promise<TMDBMovieDetail> {
  const url = buildUrl(`/movie/${id}`, {
    language: "ru-RU",
    append_to_response: "credits",
  });
  const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`TMDB movie details failed: ${res.status}`);
  return res.json();
}

export async function getTVDetails(id: number): Promise<TMDBTVDetail> {
  const url = buildUrl(`/tv/${id}`, {
    language: "ru-RU",
    append_to_response: "credits",
  });
  const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`TMDB TV details failed: ${res.status}`);
  return res.json();
}

export async function getMovieGenres(): Promise<TMDBGenre[]> {
  const url = buildUrl("/genre/movie/list", { language: "ru-RU" });
  const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.genres;
}

export async function getTVGenres(): Promise<TMDBGenre[]> {
  const url = buildUrl("/genre/tv/list", { language: "ru-RU" });
  const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.genres;
}

export function getMediaTitle(media: TMDBMedia): string {
  return "title" in media ? media.title : media.name;
}

export function getMediaYear(media: TMDBMedia): string {
  const date = "release_date" in media ? media.release_date : media.first_air_date;
  return date ? date.slice(0, 4) : "";
}
