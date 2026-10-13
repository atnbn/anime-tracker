import type { AnimeDetailsInt, trendingAnime } from "../../types/animeTypes";
export type AnimeSearchResult = { id: number; title: { romaji: string | null; english: string | null }; coverImage: { medium: string | null } };
type Page = { media: trendingAnime[]; pageInfo: { total: number; hasNextPage: boolean } | null };
const fields = `id title { romaji english } coverImage { large medium extraLarge } averageScore genres status`;
/** Propagates HTTP and GraphQL failures so query consumers can display retryable errors. */
async function request<T>(query: string, variables: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
  const response = await fetch("https://graphql.anilist.co", { method: "POST", signal, headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables }) });
  if (!response.ok) throw new Error(response.status === 429 ? "AniList is busy. Please try again in a minute." : `AniList request failed (${response.status}).`);
  const result: { data?: T; errors?: { message: string }[] } = await response.json();
  if (result.errors?.length || !result.data) throw new Error(result.errors?.[0]?.message ?? "AniList returned no data.");
  return result.data;
}
export async function searchAnimes(search: string, signal?: AbortSignal): Promise<AnimeSearchResult[]> {
  if (!search.trim()) return [];
  const data = await request<{ Page: { media: AnimeSearchResult[] } }>(`query ($search: String) { Page(page: 1, perPage: 6) { media(search: $search, type: ANIME, isAdult: false) { id title { romaji english } coverImage { medium } } } }`, { search }, signal);
  return data.Page.media;
}
export async function getAnimeDetails(id: number, signal?: AbortSignal): Promise<AnimeDetailsInt | null> {
  const data = await request<{ Media: AnimeDetailsInt | null }>(`query ($id: Int) { Media(id: $id, type: ANIME) { ${fields} bannerImage description episodes nextAiringEpisode { episode airingAt timeUntilAiring } startDate { year month day } } }`, { id }, signal);
  return data.Media;
}
export async function getTrendingAnimes(): Promise<trendingAnime[]> {
  return (await getAnimeByGenre([], 1, 8, "TRENDING_DESC")).media;
}
/** Fetches all pages in bounded batches; an empty library never queries the full catalog. */
export async function getAnimesFromIds(ids: number[]): Promise<trendingAnime[]> {
  const unique = [...new Set(ids)].filter((id) => Number.isSafeInteger(id) && id > 0);
  const items: trendingAnime[] = [];
  for (let offset = 0; offset < unique.length; offset += 50) {
    const data = await request<{ Page: Page }>(`query ($ids: [Int]) { Page(page: 1, perPage: 50) { media(id_in: $ids, type: ANIME) { ${fields} } } }`, { ids: unique.slice(offset, offset + 50) });
    items.push(...data.Page.media);
  }
  return items;
}
export async function getRecommendedAnimes(ids: number[] = []): Promise<trendingAnime[]> {
  if (!ids.length) return getTrendingAnimes();
  const favorites = await getAnimesFromIds(ids);
  const genres = [...new Set(favorites.flatMap((anime) => anime.genres ?? []))];
  if (!genres.length) return getTrendingAnimes();
  const data = await request<{ Page: Page }>(`query ($genres: [String], $ids: [Int]) { Page(page: 1, perPage: 8) { media(type: ANIME, isAdult: false, genre_in: $genres, id_not_in: $ids, sort: POPULARITY_DESC) { ${fields} } } }`, { genres, ids });
  return data.Page.media;
}
export async function getSeasonalAnimes(season: string, seasonYear: number, page: number, perPage: number): Promise<trendingAnime[]> {
  const data = await request<{ Page: Page }>(`query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { media(season: $season, seasonYear: $seasonYear, type: ANIME, isAdult: false, sort: POPULARITY_DESC) { ${fields} } } }`, { season, seasonYear, page, perPage });
  return data.Page.media;
}
export async function getGenres(): Promise<string[]> {
  return (await request<{ GenreCollection: string[] }>(`query { GenreCollection }`)).GenreCollection;
}
export async function getAnimeByGenre(genres: string[], page: number, perPage: number, sort = "POPULARITY_DESC"): Promise<Page> {
  return (await request<{ Page: Page }>(`query ($genres: [String], $page: Int, $perPage: Int, $sort: [MediaSort]) { Page(page: $page, perPage: $perPage) { pageInfo { total hasNextPage } media(genre_in: $genres, type: ANIME, isAdult: false, sort: $sort) { ${fields} } } }`, { genres: genres.length ? genres : undefined, page, perPage, sort: [sort] })).Page;
}
