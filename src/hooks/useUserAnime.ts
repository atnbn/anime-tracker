import { useContext } from "react";
import { UserDataContext } from "../context/userDataContext";

export function useUserAnime() {
  const context = useContext(UserDataContext);

  if (!context) {
    throw new Error("useUserAnime must be used inside UserAnimeProvider");
  }
  return context;
}
