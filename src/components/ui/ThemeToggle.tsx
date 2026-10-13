import { useState } from "react";

/** Updates the theme initialized in index.html before the first browser paint. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme ?? "dark",
  );
  const next = theme === "dark" ? "light" : "dark";

  function toggleTheme() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("anitracker-theme", next);
    } catch {
      // The current tab still works when browser storage is unavailable.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${next} mode`}
      onClick={toggleTheme}
    >
      {theme === "dark" ? "☀" : "☾"}
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
