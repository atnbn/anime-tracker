import type { Database } from "../../types/database";
import { supabase } from "../../lib/supabase";

export type UserAnimeEntry = {
  favorite: boolean | null;
  status: AnimeStatus;
  currentEpisode: number | null;
  episodeNotes?: Record<number, string> | null;
};

export type AnimeStatus =
  | "planned"
  | "watching"
  | "completed"
  | "onhold"
  | "dropped";

export async function saveAnimeStatus(
  animeId: number,
  status: AnimeStatus,
  currentEpisode: number = 0,
  episodeNotes?: Record<number, string> | null,
  favorite?: boolean,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error getting user for saveAnimeStatus:", userError);
    return { data: null, error: userError };
  }

  if (!user) {
    console.warn("No authenticated user found for saveAnimeStatus");
    return { data: null, error: new Error("No authenticated user") };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("user_anime")
    .select("anime_id")
    .eq("user_id", user.id)
    .eq("anime_id", animeId)
    .limit(1);

  if (existingError) {
    console.error("Error checking existing anime entry:", existingError);
    return { data: null, error: existingError };
  }
  const payload: Database["public"]["Tables"]["user_anime"]["Insert"] = {
    user_id: user.id,
    anime_id: animeId,
    status,
    current_episode: currentEpisode,
  };

  if (typeof favorite === "boolean") {
    payload.favorite = favorite;
  }

  if (typeof episodeNotes !== "undefined") {
    payload.episode_notes = episodeNotes;
  }

  if ((existingRows?.length ?? 0) > 0) {
    const { data, error } = await supabase
      .from("user_anime")
      .update(payload)
      .eq("user_id", user.id)
      .eq("anime_id", animeId)
      .select();

    if (error) {
      console.error("Error updating anime status:", error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  const { data, error } = await supabase
    .from("user_anime")
    .insert(payload)
    .select();

  if (error) {
    console.error("Error inserting anime status:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function saveEpisodeNote(
  animeId: number,
  episodeNumber: number,
  note: string,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error getting user for saveEpisodeNote:", userError);
    return { data: null, error: userError };
  }

  if (!user) {
    console.warn("No authenticated user found for saveEpisodeNote");
    return { data: null, error: new Error("No authenticated user") };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("user_anime")
    .select("anime_id, episode_notes")
    .eq("user_id", user.id)
    .eq("anime_id", animeId)
    .limit(1);

  if (existingError) {
    console.error(
      "Error checking existing anime entry for notes:",
      existingError,
    );
    return { data: null, error: existingError };
  }

  const currentNotes = ((existingRows?.[0]?.episode_notes as Record<
    number,
    string
  > | null) ?? {}) as Record<number, string>;
  const nextNotes = { ...currentNotes };

  if (note.trim()) {
    nextNotes[episodeNumber] = note.trim();
  } else {
    delete nextNotes[episodeNumber];
  }

  const payload = {
    episode_notes: nextNotes,
  };

  if ((existingRows?.length ?? 0) > 0) {
    const { data, error } = await supabase
      .from("user_anime")
      .update(payload)
      .eq("user_id", user.id)
      .eq("anime_id", animeId)
      .select();

    if (error) {
      console.error("Error updating episode note:", error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  const { data, error } = await supabase
    .from("user_anime")
    .insert({
      user_id: user.id,
      anime_id: animeId,
      favorite: false,
      status: "planned",
      current_episode: 0,
      episode_notes: nextNotes,
    })
    .select();

  if (error) {
    console.error("Error creating episode note entry:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function toggleFavorite(animeId: number, isFavorite: boolean) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: new Error("Sign in to save favorites.") };

  const { data: existingRows, error: existingError } = await supabase
    .from("user_anime")
    .select("anime_id")
    .eq("user_id", user.id)
    .eq("anime_id", animeId)
    .limit(1);

  if (existingError) return { error: existingError };
  const newFavorite = !isFavorite;

  if ((existingRows?.length ?? 0) > 0) {
    return await supabase
      .from("user_anime")
      .update({ favorite: newFavorite })
      .eq("user_id", user.id)
      .eq("anime_id", animeId);
  }

  return await supabase.from("user_anime").insert({
    user_id: user.id,
    anime_id: animeId,
    favorite: true,
    status: "planned",
    current_episode: 0,
  });
}
export async function getUserAnimeData(): Promise<
  Record<number, UserAnimeEntry>
> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error getting Supabase user:", userError);
    return {};
  }

  const activeUser = user;

  if (!activeUser) {
    console.warn("No authenticated user found for user anime data");
    return {};
  }

  const { data, error } = await supabase
    .from("user_anime")
    .select("anime_id, favorite, status, current_episode, episode_notes")
    .eq("user_id", activeUser.id);

  if (error) {
    throw new Error(error.message);
  }

  const map: Record<number, UserAnimeEntry> = {};

  data?.forEach((item) => {
    map[item.anime_id] = {
      favorite: item.favorite,
      status: (["planned", "watching", "completed", "onhold", "dropped"] as const).find((status) => status === item.status) ?? "planned",
      currentEpisode: item.current_episode,
      episodeNotes: (item.episode_notes as Record<number, string> | null) ?? {},
    };
  });

  return map;
}
