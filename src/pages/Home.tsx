import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import AnimeCard from "../components/anime/AnimeCard";
import { useTrendingAnime } from "../hooks/useTrendingAnime";
export default function Home() {
  const { data = [], isPending, error, refetch } = useTrendingAnime();
  return <><Navbar /><main className="home-main">
    <section className="hero-section"><div className="hero-copy"><p className="eyebrow"><span className="live-dot" /> A LITTLE LESS SEARCHING. A LOT MORE WATCHING.</p>
      <h1>Your next story<br />starts <span>here.</span></h1>
      <p className="hero-description">Discover something unforgettable. Keep the anime you love, the episodes you watch, and the stories still waiting—all in one place.</p>
      <div className="hero-actions"><Link to="/browse" className="primary-link">Explore anime <span>↗</span></Link><Link to="/signup" className="secondary-link">Build your watchlist →</Link></div>
      <div className="hero-footnote"><span>✦ Powered by AniList</span><span>Made for your watching journey</span></div>
    </div><div className="hero-art"><div className="hero-poster-collage" aria-hidden="true">{data.slice(0, 3).map((anime) => <img key={anime.id} src={anime.coverImage.extraLarge || anime.coverImage.large} alt="" fetchPriority="high" />)}</div><div className="art-caption"><span>EVERY STORY IS A NEW WORLD</span><strong>Find the one that stays with you.</strong></div></div></section>
    <section className="discovery-section"><div className="section-heading"><div><p className="eyebrow">THE COMMUNITY’S CURRENT OBSESSION</p><h2>Trending now<span className="accent">.</span></h2></div><Link className="secondary-link" to="/browse">Discover more ↗</Link></div>
      {isPending && <p role="status" className="muted">Finding your next favorite…</p>}
      {error && <div role="alert" className="empty-state"><p>{error.message}</p><button onClick={() => void refetch()}>Try again →</button></div>}
      <div className="home-anime-grid">{data.map((anime) => <AnimeCard key={anime.id} {...anime} />)}</div>
    </section>
    <section className="feature-strip">{[{ n: "01", title: "Find your next favorite", text: "Explore the catalog by genre, popularity, and score." }, { n: "02", title: "Make it your collection", text: "Keep favorites and every watch status in one library." }, { n: "03", title: "Pick up where you left off", text: "Save episode progress and notes as you watch." }].map((feature) => <article key={feature.n}><span>{feature.n}</span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</section>
    <footer className="site-footer"><Link className="brand" to="/home">anitracker.</Link><p>A home for the stories you love.</p><Link to="/browse">Keep exploring ↗</Link></footer>
  </main></>;
}
