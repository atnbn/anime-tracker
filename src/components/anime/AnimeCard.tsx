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
