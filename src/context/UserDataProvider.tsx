import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { UserDataContext } from "./userDataContext";
import { useAuth } from "./AuthProvider";
import { getUserAnimeData } from "../api/supabase/databankCalls";

/** Session-scoped query keys prevent one account's library from appearing in another. */
export function UserDataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const user = session?.user ?? null;
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["library", user?.id],
    queryFn: () => getUserAnimeData(),
    enabled: Boolean(user),
    staleTime: 60000,
  });
  const userAnimeData = user ? data ?? {} : {};
  const favorites = Object.entries(userAnimeData).filter(([, entry]) => entry.favorite).map(([id]) => Number(id));
  const refreshUserAnimeData = async () => { if (user) await refetch(); };
  return <UserDataContext.Provider value={{ user, favorites, userAnimeData, refreshFavorites: refreshUserAnimeData, refreshUserAnimeData }}>
    {user && isPending && <div role="status" className="library-notice">Loading your collection…</div>}
    {user && error && <div role="alert" className="library-notice">Your collection could not load. <button onClick={() => void refetch()}>Try again</button></div>}
    {children}
  </UserDataContext.Provider>;
}
