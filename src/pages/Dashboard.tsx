import AnimeCard from "../components/anime/AnimeCard";
import Navbar from "../components/layout/Navbar";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import type { trendingAnime } from "../types/animeTypes";
import {
  useRecommendedAnime,
  useTrendingAnime,
  useSeasonalAnime,
  useAnimesFromIds,
} from "../hooks/useTrendingAnime";
import { useUserData } from "../context/userDataContext";
import type { AnimeStatus } from "../api/supabase/databankCalls";
import { useState } from "react";

const Section = ({
  title,
  data,
  onViewAll,
  onShowLess,
  showLessVisible = false,
}: {
  title: string;
  data: trendingAnime[];
  onViewAll?: () => void;
  onShowLess?: () => void;
  showLessVisible?: boolean;
}) => {
  const { userAnimeData } = useUserData();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <div className="flex items-center gap-3">
          {showLessVisible && onShowLess ? (
            <button
              onClick={onShowLess}
              className="text-sm text-muted hover:text-foreground"
            >
              Show less
            </button>
          ) : null}
          {onViewAll ? (
            <button
              onClick={onViewAll}
              className="text-sm text-accent hover:text-accent"
            >
              View more
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.map((anime: trendingAnime) => (
          <AnimeCard
            key={`${title}-${anime.id}`}
            {...anime}
            status={userAnimeData[anime.id]?.status || ""}
          />
        ))}
      </div>
    </section>
  );
};

const Dashboard = () => {
  const { favorites, userAnimeData } = useUserData();
  const { data: trendingData, isLoading, isError } = useTrendingAnime();
  const { data: recommendedData, isLoading: isRecommendedLoading, error: recommendationError, refetch: retryRecommendations } =
    useRecommendedAnime(favorites);
  const [perPage, setPerPage] = useState(10);

  const today = new Date();
  const season = ["WINTER", "SPRING", "SUMMER", "FALL"][Math.floor(today.getMonth() / 3)];
  const { data: seasonalData, error: seasonalError, refetch: retrySeasonal } = useSeasonalAnime(season, today.getFullYear(), 1, perPage);
  const handleViewAll = () => setPerPage((prevPerPage) => Math.min(50, prevPerPage + 10));
  const handleShowLess = () =>
    setPerPage((prevPerPage) => Math.max(10, prevPerPage - 10));
  const continuingIds = Object.entries(userAnimeData).filter(([, entry]) => entry.status === "watching").map(([id]) => Number(id));
  const { data: continuing = [], error: continueError, refetch: retryContinue } = useAnimesFromIds(continuingIds);
  const animeData = trendingData ?? [];
  const recommendedAnimeData = recommendedData ?? [];
  const seasonalAnimeData = seasonalData ?? [];
  const grouped: Record<AnimeStatus, number[]> = {
    watching: [],
    completed: [],
    planned: [],
    dropped: [],
    onhold: [],
  };
  Object.entries(userAnimeData).forEach(([animeId, anime]) => {
    const status = anime.status as AnimeStatus;
    grouped[status]?.push(Number(animeId));
  });

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-black/20 backdrop-blur">
            <p className="text-sm text-muted">Watching Now</p>
            <p className="mt-2 text-3xl font-extrabold text-foreground">
              {grouped.watching.length}
            </p>
            <Badge status="watching" />
          </article>
          <article
            className="rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-black/20 backdrop-blur"
          >
            <p className="text-sm text-muted">Completed</p>
            <p className="mt-2 text-3xl font-extrabold text-foreground">
              {grouped.completed.length}
            </p>
            <Badge status="completed" />
          </article>
          <article className="rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-black/20 backdrop-blur">
            <p className="text-sm text-muted">Planned</p>
            <p className="mt-2 text-3xl font-extrabold text-foreground">
              {grouped.planned.length}
            </p>
            <Badge status="planned" />
          </article>
          <article className="rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-black/20 backdrop-blur">
            <p className="text-sm text-muted">Library completion</p>
            <p className="mt-2 text-3xl font-extrabold text-foreground">{Object.keys(userAnimeData).length ? Math.round(grouped.completed.length / Object.keys(userAnimeData).length * 100) : 0}%</p>
            <div className="mt-3">
              <ProgressBar value={grouped.completed.length} max={Object.keys(userAnimeData).length || 1} label="Completed titles" />
            </div>
          </article>
        </section>

        {isLoading || isRecommendedLoading ? (
          <section className="rounded-2xl border border-line bg-surface p-6 text-muted">
            Loading anime...
          </section>
        ) : null}

        {isError ? (
          <section className="rounded-2xl border border-red-300/30 bg-red-500/10 p-6 text-danger">
            Could not load anime right now. Please try again.
          </section>
        ) : null}

        {[{ error: recommendationError, retry: retryRecommendations }, { error: seasonalError, retry: retrySeasonal }, { error: continueError, retry: retryContinue }].map(({ error, retry }, index) => error ? <div key={index} role="alert" className="empty-state"><p>{error.message}</p><button onClick={() => void retry()}>Try again</button></div> : null)}
        {continuing.length > 0 && <Section title="Continue watching" data={continuing} />}
        {!isLoading && !isError ? (
          <>
            <Section
              title="New Season"
              data={seasonalAnimeData}
              onViewAll={perPage < 50 ? handleViewAll : undefined}
              onShowLess={handleShowLess}
              showLessVisible={perPage > 10}
            />
            <Section title="Trending" data={animeData} />
            <Section title="Recommended" data={recommendedAnimeData} />
          </>
        ) : null}
      </main>
    </div>
  );
};

export default Dashboard;
