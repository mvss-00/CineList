export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  genres?: TMDBGenre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  media_type?: "movie";
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  genres?: TMDBGenre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  number_of_seasons?: number;
  media_type?: "tv";
}

export type TMDBMedia = (TMDBMovie | TMDBTVShow) & { media_type: "movie" | "tv" };

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBSearchResult<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovieDetail extends TMDBMovie {
  genres: TMDBGenre[];
  runtime: number | null;
  tagline: string;
  status: string;
  credits?: {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
  };
}

export interface TMDBTVDetail extends TMDBTVShow {
  genres: TMDBGenre[];
  episode_run_time: number[];
  tagline: string;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  credits?: {
    cast: TMDBCastMember[];
    crew: TMDBCrewMember[];
  };
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
export const TMDB_POSTER_SM = `${TMDB_IMAGE_BASE}/w342`;
export const TMDB_POSTER_MD = `${TMDB_IMAGE_BASE}/w500`;
export const TMDB_POSTER_LG = `${TMDB_IMAGE_BASE}/w780`;
export const TMDB_BACKDROP = `${TMDB_IMAGE_BASE}/w1280`;
export const TMDB_PROFILE = `${TMDB_IMAGE_BASE}/w185`;
