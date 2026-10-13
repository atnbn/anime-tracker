import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { BadgeStatus } from "../components/ui/Badge";
import Navbar from "../components/layout/Navbar";
import { useUserData } from "../context/userDataContext";
import { useAnimesFromIds } from "../hooks/useTrendingAnime";
import AnimeCard from "../components/anime/AnimeCard";

const Watchlist = () => {
  const [searchParams] = useSearchParams();
  const candidate = searchParams.get("status");
  const statuses: BadgeStatus[] = ["planned", "watching", "completed", "onhold", "dropped"];
  const selectedStatus = statuses.find((status) => status === candidate) ?? null;
  const { userAnimeData } = useUserData();

  const animeIds = useMemo(() => {
    return Object.entries(userAnimeData)
      .filter(([, animeData]) =>
        selectedStatus ? animeData.status === selectedStatus : true,
      )
      .map(([id]) => Number(id));
  }, [userAnimeData, selectedStatus]);

  const { data: watchlistItems, isPending, error, refetch } = useAnimesFromIds(animeIds);
  const filteredItems = watchlistItems ?? [];

  const heading = selectedStatus
    ? `${selectedStatus.charAt(0).toUpperCase()}${selectedStatus.slice(1)}`
    : "Watchlist";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{heading}</h1>
          <p className="text-sm text-muted">
            {selectedStatus
              ? `Showing your ${selectedStatus} anime.`
              : "Track your current anime list and progress."}
          </p>
        </div>

        {isPending && <p role="status">Loading your watchlist…</p>}
        {error && <div role="alert"><p>{error.message}</p><button onClick={() => void refetch()}>Try again</button></div>}
        {!isPending && !error &&
          <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredItems.length === 0 ? (
                <p className="rounded-2xl border border-line bg-surface p-4 text-muted">
                  No anime found for this status yet.
                </p>
              ) : (
                filteredItems.map((item) => {
                  return (
                    <AnimeCard
                      key={item.id}
                      {...item}
                      status={userAnimeData[item.id]?.status || ""}
                    />
                  );
                })
              )}
            </div>
          </div>
        }
      </main>
    </div>
  );
};

export default Watchlist;
