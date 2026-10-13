import { useQuery } from "@tanstack/react-query";
import {
  getRecommendedAnimes,
  getTrendingAnimes,
  getAnimesFromIds,
  getSeasonalAnimes,
  getGenres,
  getAnimeByGenre,
} from "../api/anilist/animeList";
import type { trendingAnime } from "../types/animeTypes";

type AnimeByGenreResponse = {
  media: trendingAnime[];
  pageInfo: {
    total: number;
    hasNextPage: boolean;
  } | null;
};

export function useTrendingAnime() {
  return useQuery<trendingAnime[]>({
    queryKey: ["trending"],
    queryFn: getTrendingAnimes,
    staleTime: 1000 * 60 * 15,
  });
}

export function useRecommendedAnime(favoriteIds: number[]) {
  return useQuery<trendingAnime[]>({
    queryKey: ["recommended", favoriteIds.join(",")],
    queryFn: () => getRecommendedAnimes(favoriteIds),
    staleTime: 1000 * 60 * 15,
  });
}

export function useWatchlistAnime(favoriteIds: number[]) {
  return useQuery<trendingAnime[]>({
    queryKey: ["watchlist", favoriteIds.join(",")],
    queryFn: () => getAnimesFromIds(favoriteIds),
    staleTime: 1000 * 60 * 15,
  });
}

export function useSeasonalAnime(
  season: string,
  seasonYear: number,
  page: number,
  perPage: number,
) {
  return useQuery<trendingAnime[]>({
    queryKey: ["seasonal", season, seasonYear, page, perPage],
    queryFn: () => getSeasonalAnimes(season, seasonYear, page, perPage),
    staleTime: 1000 * 60 * 15,
  });
}

export function useAnimesFromIds(ids: number[]) {
  return useQuery<trendingAnime[]>({
    queryKey: ["animesFromIds", ids.join(",")],
    queryFn: () => getAnimesFromIds(ids),
    staleTime: 1000 * 60 * 15,
  });
}

export function useGenres() {
  return useQuery<string[]>({
    queryKey: ["genres"],
    queryFn: getGenres,
    staleTime: 1000 * 60 * 15,
  });
}

export function useAnimesByGenre(
  genres: string[],
  page: number,
  perPage: number,
  sort: string = "POPULARITY_DESC",
) {
  return useQuery<AnimeByGenreResponse>({
    queryKey: ["animesByGenre", genres.join(","), page, perPage, sort],
    queryFn: () => getAnimeByGenre(genres, page, perPage, sort),
    staleTime: 1000 * 60 * 15,
  });
}
