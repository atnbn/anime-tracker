import Navbar from "../components/layout/Navbar";
import { useUserData } from "../context/userDataContext";
import { Link } from "react-router-dom";
export default function Profile() {
  const { user, userAnimeData, favorites } = useUserData();
  const username: unknown = user?.user_metadata.username;
  const name = typeof username === "string" ? username : "Anime fan";
  const entries = Object.values(userAnimeData);
  const stats = ["watching", "completed", "planned", "onhold", "dropped"].map((status) => ({ label: status, value: entries.filter((entry) => entry.status === status).length }));
  return <><Navbar /><main className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><p className="eyebrow">YOUR CORNER OF THE ANIME WORLD</p><h1 className="text-4xl font-bold">{name}</h1><p className="muted mt-3">{user?.email}</p>
    <div className="grid gap-4 sm:grid-cols-3 mt-8">{[...stats, { label: "favorites", value: favorites.length }].map((stat) => <Link key={stat.label} to={stat.label === "favorites" ? "/favorites" : `/watchlist?status=${stat.label}`} className="stat-card"><p className="capitalize muted">{stat.label}</p><strong>{stat.value}</strong></Link>)}</div>
    <section className="stat-card mt-8"><h2 className="text-xl font-semibold">Your collection</h2><p className="muted mt-2">{entries.reduce((sum, entry) => sum + (entry.currentEpisode ?? 0), 0)} episodes tracked across {entries.length} titles.</p><Link className="secondary-link" to="/watchlist">Open your watchlist →</Link></section>
  </main></>;
}
