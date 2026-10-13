import AnimeCard from "../components/anime/AnimeCard";
import Navbar from "../components/layout/Navbar";
import { useUserData } from "../context/userDataContext";
import { useAnimesFromIds } from "../hooks/useTrendingAnime";
import { Link } from "react-router-dom";
export default function Favorites() {
  const { favorites } = useUserData();
  const { data = [], isPending, error, refetch } = useAnimesFromIds(favorites);
  return <><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><p className="eyebrow">THE STORIES THAT STAY WITH YOU</p><h1 className="text-3xl font-bold mb-6">Favorites</h1>
    {isPending ? <p role="status">Loading favorites…</p> : error ? <div role="alert"><p>{error.message}</p><button onClick={() => void refetch()}>Try again</button></div> : !data.length ? <div className="empty-state"><h2>No favorites yet.</h2><p>Discover a story you love and tap its star to keep it here.</p><Link to="/browse">Explore anime →</Link></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{data.map((anime) => <AnimeCard key={anime.id} {...anime} />)}</div>}
  </main></>;
}
