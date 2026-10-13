import AnimeCard from "../components/anime/AnimeCard";
import Navbar from "../components/layout/Navbar";
import { useMemo, useState } from "react";
import { useGenres, useAnimesByGenre } from "../hooks/useTrendingAnime";
import type { trendingAnime } from "../types/animeTypes";

const Browse = () => {
  const { data: genresData = [] } = useGenres();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [appliedGenres, setAppliedGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("POPULARITY_DESC");
  const [appliedSortBy, setAppliedSortBy] = useState("POPULARITY_DESC");

  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();

    genresData.forEach((genre) => genreSet.add(genre));

    return Array.from(genreSet).sort();
  }, [genresData]);

  const [page, setPage] = useState(1);

  const { data: genreResult, isPending, error, refetch, isFetching } = useAnimesByGenre(
    appliedGenres,
    page,
    20,
    appliedSortBy,
  );
  const filteredAnime: trendingAnime[] = genreResult?.media ?? [];
  const pageInfo = genreResult?.pageInfo ?? null;

  const toggleGenre = (genre: string) => {
    setSelectedGenres((currentGenres) =>
      currentGenres.includes(genre)
        ? currentGenres.filter((selectedGenre) => selectedGenre !== genre)
        : [...currentGenres, genre],
    );
  };

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedGenres(selectedGenres);
    setAppliedSortBy(sortBy);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="h-fit space-y-5 rounded-2xl border border-line bg-surface p-5 backdrop-blur">
          <h1 className="text-2xl font-bold text-foreground">Browse</h1>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">Genre</p>
              {selectedGenres.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGenres([]);
                    setAppliedGenres([]);
                    setPage(1);
                  }}
                  className="text-xs font-medium text-accent transition hover:text-accent"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map((genre) => {
                const isSelected = selectedGenres.includes(genre);

                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    aria-pressed={isSelected}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      isSelected
                        ? "border-cyan-400/60 bg-cyan-400/15 text-accent"
                        : "border-line bg-surface text-muted hover:border-cyan-400/40 hover:text-foreground"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted">Sort by</p>
            <select
              aria-label="Sort anime"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-foreground outline-none focus:ring-2 focus:ring-cyan-400/35"
            >
              <option value="POPULARITY_DESC">Most Popular</option>
              <option value="SCORE_DESC">Highest Rated</option>
              <option value="TRENDING_DESC">Trending Now</option>
              <option value="FAVOURITES_DESC">Most Favorited</option>
              <option value="UPDATED_AT_DESC">Recently Updated</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleApplyFilters}
            className="w-full rounded-xl bg-[#c5ed83] px-4 py-2.5 text-sm font-semibold text-[#20251c] transition hover:bg-[#b3df6c]"
          >
            Apply Filters
          </button>
        </aside>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Results</h2>
            <p className="text-sm text-muted">
              {pageInfo?.total ?? filteredAnime.length} anime found
            </p>
          </div>
          {isPending && <p role="status">Loading anime…</p>}
          {error && <div role="alert"><p>{error.message}</p><button onClick={() => void refetch()}>Try again</button></div>}
          {!isPending && !error && !filteredAnime.length && <p>No titles match these filters. Try another genre.</p>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAnime.map((anime) => (
              <AnimeCard key={`${anime.id}-${anime.title.romaji}`} {...anime} />
            ))}
          </div>

          {pageInfo ? (
            <div className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
              <button
                type="button"
                onClick={() =>
                  setPage((currentPage) => Math.max(1, currentPage - 1))
                }
                disabled={page === 1 || isFetching}
                className="rounded-lg border border-line px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span>Page {page}</span>

              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={!pageInfo.hasNextPage || isFetching}
                className="rounded-lg border border-line px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default Browse;
