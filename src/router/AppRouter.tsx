import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams, useLocation } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";

const AnimeDetails = lazy(() => import("../pages/AnimeDetails"));
const Browse = lazy(() => import("../pages/Browse"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Favorites = lazy(() => import("../pages/Favorites"));
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Profile = lazy(() => import("../pages/Profile"));
const Signup = lazy(() => import("../pages/Signup"));
const Watchlist = lazy(() => import("../pages/Watchlist"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function DetailRoute() { const { id } = useParams(); return <AnimeDetails key={id} />; }

const AppRouter = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<main className="empty-state m-6" role="status">Loading your next story…</main>}><Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        <Route path="/home" element={<Home />} />
        <Route path="/anime/:id" element={<DetailRoute />} />
        <Route path="/browse" element={<Browse />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />

        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <Watchlist />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<main className="empty-state m-6"><h1>Page not found</h1><a href="/home">Return home →</a></main>} />
      </Routes></Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
