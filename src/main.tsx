import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { isSupabaseConfigured } from "./lib/supabase";

import { AuthProvider } from "./context/AuthProvider.tsx";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isSupabaseConfigured ? <AuthProvider>
      <App />
    </AuthProvider> : <main className="empty-state m-6"><h1>Set up AniTracker</h1><p>Copy .env.example to .env and configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.</p></main>}
  </StrictMode>,
);
