// UserDataContext.ts
import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { UserAnimeEntry } from "../api/supabase/databankCalls";

type UserDataContextType = {
  user: User | null;
  favorites: number[];
  userAnimeData: Record<number, UserAnimeEntry>;
  refreshFavorites: () => Promise<void>;
  refreshUserAnimeData: () => Promise<void>;
};

export const UserDataContext = createContext<UserDataContextType | undefined>(
  undefined,
);

export const useUserData = () => {
  const context = useContext(UserDataContext);

  if (!context) {
    throw new Error("useUserData must be used inside UserDataProvider");
  }

  return context;
};
