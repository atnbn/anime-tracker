export type AnimeSearchResult = {
  id: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    medium: string;
    large: string;
    extraLarge: string;
  };
};

export type AnimeDetailsInt = {
  id: number;
  bannerImage: string | null;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    large: string;
    extraLarge: string;
    medium: string;
  };
  description: string | null;
  episodes: number | null;
  status: string | null;
  genres: string[] | null;
  averageScore: number | null;
  startDate?: AnimeDetailsStartDate | null;
  nextAiringEpisode?: {
    episode: number | null;
    airingAt: number | null;
    timeUntilAiring: number | null;
  } | null;
};

export type AnimeDetailsStartDate = {
  year: number | null;
  month: number | null;
  day: number | null;
};

export type trendingAnime = {
  id: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    large: string;
    medium: string;
    extraLarge: string;
  };
  averageScore: number | null;
  genres: string[] | null;
  status: string | null;
  startDate?: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
};

export type UserAnimeEntry = {
  favorite: boolean | null;
  status: string;
  currentEpisode: number | null;
};

type AnimeStatus = "watching" | "completed" | "planned" | "dropped";

export type AnimeEntry = {
  status: AnimeStatus;
};
