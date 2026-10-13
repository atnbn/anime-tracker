# Engineering review

## Initial findings

The supplied repository is React 19 + Vite 8 + React Router, not Next.js. It already uses Tailwind 4, Supabase, and TanStack Query. No framework migration was necessary.

| Finding | Resolution |
| --- | --- |
| Duplicate library providers and auth contexts | One library provider; shared auth context and hook |
| Login logs email, password, and session | Removed credential logging and render-time connection probes |
| API catches return empty arrays | Typed GraphQL helper propagates HTTP and GraphQL errors |
| Empty initial Browse page | Unfiltered catalog loads immediately |
| Empty ID list can query unrelated titles; lists truncate at 50 | Empty-list guard and bounded batches |
| Favorites can destroy watch data in a duplicate API helper | Removed the destructive helper; update only favorite flag |
| Profile and completion metrics are fabricated | Derive statistics from the signed-in library |
| New episode notes use unsupported “planning” status | Valid planned status; notes do not silently favorite a title |
| Hard-coded season/year and seven-day countdown | Current calendar season and actual supplied airing timestamps |
| Detail fetch races and derived-state effects | Cancelable detail query and local drafts derived from library state |
| Unknown episode totals default to 12 | Preserve unknown totals; allow manual progress |
| Modal lacks focus containment and Escape handling | Native dialog with inert background and restored focus |
| No route fallback, render boundary, or navigation scroll reset | Added all three |
| Missing strict typing and database schema | Strict TS, typed Supabase client, new-project schema with ownership policies |
| Environment secrets not ignored | Ignore local .env files; public-key template provided |

## Design implementation

A neutral charcoal/ivory palette with lime accents, consistent typography, live poster collage, poster grids, restrained transitions, reusable theme tokens, and reduced-motion handling replaces the neon presentation. Theme initialization runs in the HTML head before React mounts. Explicit choices persist through localStorage; the initial default follows the OS. CSS controls layout across mobile, tablet, and desktop.

Complete implementations:

- `src/pages/Home.tsx`: discovery page and live trending cards.
- `src/components/anime/AnimeCard.tsx`: poster fallback, lazy loading, normalized score, validated library badge.
- `src/components/ui/ThemeToggle.tsx`: theme control.
- `src/components/ui/Modal.tsx`: native accessible dialog.
- `src/api/anilist/animeList.ts`: typed catalog requests.
- `src/types/database.ts`: typed public database schema.
- `index.html`: first-paint theme initialization.
- `src/index.css`: theme tokens and responsive styles.

## Validation

- `npm test`: 10 regression tests covering HTTP/GraphQL failures, empty and large libraries, filtering, cancellation signals, favorite preservation, failed favorite existence checks, note creation, and note clearing.
- `npm run lint`: passed with zero warnings.
- `npm run build`: passed with strict TypeScript. Lazy route modules reduce the main JS bundle from about 518 kB to 477 kB; these are build sizes, not measured page-load timings.
- Browser: live trending results, both themes, persisted theme after reload, unfiltered Browse, Fantasy + score filters, page two, search-to-details navigation, episode dialog opening and Escape/focus restoration.
- Browser layouts: desktop at 1440 px, tablet at 768 px, and mobile at 390 px; mobile content fits the viewport without horizontal overflow. Screenshots in `docs/screenshots`.

## Integration limits

The local host runs Node 22.11, below Vite's minimum supported Node 22.12. Builds and the dev server succeeded, but package engines and README now specify Node 22.12+.

No test account was supplied, so email confirmation, authenticated profile contents, and real Supabase writes were not exercised. Mutation regression tests use a mocked client. `supabase/schema.sql` was prepared but was not applied to the existing backend. The configured backend must have compatible columns, unique user/anime keys, and row-level security policies.

Episode-note updates currently merge JSON client-side; simultaneous edits from multiple devices can overwrite each other. Atomic database-side note updates remain a deployment-level improvement. No automated accessibility conformance audit or Core Web Vitals benchmark was performed.

## Complete theme control

The component below works with the early theme initialization in `index.html` and semantic CSS tokens in `src/index.css`.

```tsx
import { useState } from "react";

/** Updates the theme initialized in index.html before the first browser paint. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme ?? "dark",
  );
  const next = theme === "dark" ? "light" : "dark";

  function toggleTheme() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("anitracker-theme", next);
    } catch {
      // The current tab still works when browser storage is unavailable.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${next} mode`}
      onClick={toggleTheme}
    >
      {theme === "dark" ? "☀" : "☾"}
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
```

## Complete card implementation

```tsx
import type { trendingAnime } from "../../types/animeTypes";
import { Link } from "react-router-dom";
import Badge, { type BadgeStatus } from "../ui/Badge";
const statuses: BadgeStatus[] = ["watching", "completed", "planned", "dropped", "onhold"];
export default function AnimeCard({ id, title, genres, coverImage, averageScore, status }: trendingAnime) {
  const name = title.english || title.romaji || "Untitled";
  const libraryStatus = statuses.find((value) => value === status);
  return <article className="anime-card"><Link to={`/anime/${id}`}>
    <div className="anime-cover"><img src={coverImage.extraLarge || coverImage.large || coverImage.medium || "/favicon.svg"} alt={name} loading="lazy" decoding="async" />
    {averageScore != null && <span className="anime-score">★ {(averageScore / 10).toFixed(1)}</span>}</div>
    <div className="anime-info"><h3>{name}</h3><p>{genres?.slice(0, 2).join(" · ") || "Explore this title"}</p>{libraryStatus && <Badge status={libraryStatus} />}</div>
  </Link></article>;
}
```

## Complete catalog API implementation

```ts
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
```
