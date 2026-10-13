import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  searchAnimes,
  type AnimeSearchResult,
} from "../../api/anilist/animeList";
import Input from "../ui/Input";
import ThemeToggle from "../ui/ThemeToggle";
import { supabase } from "../../lib/supabase";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthProvider";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/browse", label: "Browse" },
  { to: "/profile", label: "Profile" },
];

const myAreaLinks = [
  { to: "/watchlist?status=planned", label: "Planned" },
  { to: "/watchlist?status=watching", label: "Watching" },
  { to: "/watchlist?status=dropped", label: "Dropped" },
  { to: "/watchlist?status=completed", label: "Completed" },
  { to: "/favorites", label: "Favorites" },
];

const Navbar = () => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [results, setResults] = useState<AnimeSearchResult[]>([]);
  const [searchError, setSearchError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMyAreaOpen, setIsMyAreaOpen] = useState(false);
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");
  const myAreaMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchValue.trim() === "") return;

    let cancelled = false;
    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setSearchError("");
      try {
        const fetchedResults = await searchAnimes(searchValue, controller.signal);
        if (!cancelled) setResults(fetchedResults);
      } catch (error) {
        if (!cancelled) { setResults([]); setSearchError(error instanceof Error ? error.message : "Search unavailable."); }
      } finally { if (!cancelled) setIsLoading(false); }
    }, 500);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchValue]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsMyAreaOpen(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        myAreaMenuRef.current &&
        !myAreaMenuRef.current.contains(event.target as Node)
      ) {
        setIsMyAreaOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown =
    searchValue.trim().length > 0 &&
    isInputFocused;
  const isMyAreaActive =
    location.pathname === "/favorites" || location.pathname === "/watchlist";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/home" className="brand"><span className="brand-icon">A</span>ani<span>tracker</span><span className="brand-dot">.</span></Link>
          <ThemeToggle />
          {!session ? (
            <div className="flex items-center gap-2 ">
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-[#c5ed83] px-3 py-2 text-sm font-semibold text-slate-950"
              >
                Signup
              </Link>
            </div>
          ) : (
            <Button
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) setLogoutError(error.message);
                else navigate("/login", { replace: true });
              }}
            >
              Logout
            </Button>
          )}
        </div>

        {logoutError && <p role="alert">{logoutError}</p>}
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
          <div
            className="relative"
            onFocus={() => setIsInputFocused(true)}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsInputFocused(false); }}
            onKeyDown={(event) => { if (event.key === "Escape") setIsInputFocused(false); }}
          >
            <Input
              placeholder="Search for your next anime…"
              aria-label="Search anime"
              value={searchValue}
              onChange={(e) => {
                const value = e.target.value;
                setSearchValue(value);
                setResults([]);
                setSearchError("");
                setIsLoading(Boolean(value.trim()));

                if (value.trim() === "") {
                  setResults([]);
                  setIsLoading(false);
                }
              }}
            />

            {showDropdown ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/60 backdrop-blur-xl">
                {isLoading ? (
                  <p className="px-4 py-3 text-sm text-muted">
                    Searching...
                  </p>
                ) : null}

                {!isLoading && results.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted">
                    {searchError || "No anime found."}
                  </p>
                ) : null}

                {!isLoading ? (
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {results.map((anime) => {
                      const title =
                        anime.title.english || anime.title.romaji || "Untitled";

                      return (
                        <li key={anime.id}>
                          <Link
                            to={`/anime/${anime.id}`}
                            className="flex items-center gap-3 px-3 py-2 transition hover:bg-surface"
                            onClick={() => {
                              setSearchValue("");
                              setResults([]);
                            }}
                          >
                            <img
                              src={anime.coverImage.medium || ""}
                              alt={title}
                              className="h-12 w-9 rounded-md object-cover ring-1 ring-line"
                            />
                            <span className="line-clamp-2 text-sm font-medium text-foreground">
                              {title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          <nav className="flex flex-wrap items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-surface text-accent"
                      : "text-muted hover:bg-surface hover:text-foreground",
                  ].join(" ")
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="relative" ref={myAreaMenuRef}>
              <button
                onKeyDown={(event) => { if (event.key === "Escape") setIsMyAreaOpen(false); }}
                type="button"
                onClick={() => setIsMyAreaOpen((prev) => !prev)}
                className={[
                  "flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition",
                  isMyAreaActive
                    ? "bg-surface text-accent"
                    : "text-muted hover:bg-surface hover:text-foreground",
                ].join(" ")}
                aria-expanded={isMyAreaOpen}
                aria-controls="library-links"
              >
                <span>My library</span>
                <svg
                  className={`h-4 w-4 transition ${isMyAreaOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M5.25 7.5 10 12.25 14.75 7.5H5.25Z" />
                </svg>
              </button>

              {isMyAreaOpen ? (
                <div id="library-links" className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-48 rounded-2xl border border-line bg-surface p-2 shadow-2xl shadow-black/60 backdrop-blur-xl">
                  {myAreaLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMyAreaOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-surface hover:text-foreground"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-muted">↗</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
