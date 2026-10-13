import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import CountdownTimer from "../components/anime/CountdownTimer";
import { useParams } from "react-router-dom";
import type { AnimeDetailsInt } from "../types/animeTypes";
import { getAnimeDetails } from "../api/anilist/animeList";
import {
  saveAnimeStatus,
  saveEpisodeNote,
  toggleFavorite,
  type AnimeStatus,
} from "../api/supabase/databankCalls";
import { useUserData } from "../context/userDataContext";

const AnimeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { favorites, refreshFavorites, userAnimeData, refreshUserAnimeData } =
    useUserData();

  const currentAnimeEntry = userAnimeData[Number(id ?? 0)];
  const [progressDraft, setProgress] = useState<number | null>(null);
  const progress = progressDraft ?? currentAnimeEntry?.currentEpisode ?? 0;
  const [statusDraft, setSelectedStatus] = useState<AnimeStatus | null>(null);
  const selectedStatus = statusDraft ?? currentAnimeEntry?.status ?? null;
  const statusOptions: Array<{ value: AnimeStatus; label: string }> = [
    { value: "watching", label: "Watching" },
    { value: "planned", label: "Plan to Watch" },
    { value: "completed", label: "Completed" },
    { value: "onhold", label: "On Hold" },
    { value: "dropped", label: "Dropped" },
  ];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toggleEpsModal, setOpenEpsModal] = useState(false);
  const [noteOverrides, setEpisodeNotes] = useState<Record<number, string>>({});
  const episodeNotes = { ...currentAnimeEntry?.episodeNotes, ...noteOverrides };
  const [currEps, setCurrEps] = useState<number | null>(null);
  const [episodeNoteDraft, setEpisodeNoteDraft] = useState("");
  const [episodeTime, setEpisodeTime] = useState("");
  const [isEditingEpisode, setIsEditingEpisode] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(
    null,
  );
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaveError, setNoteSaveError] = useState("");
  const [isFavoritePending, setIsFavoritePending] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusSaveError, setStatusSaveError] = useState<string | null>(null);
  const animeId = Number(id);
  const isFavorite = optimisticFavorite ?? favorites.includes(animeId);
  const { data: animeDetails, isPending, error, refetch } = useQuery<AnimeDetailsInt | null>({
    queryKey: ["anime", animeId],
    queryFn: ({ signal }) => getAnimeDetails(animeId, signal),
    enabled: Number.isSafeInteger(animeId) && animeId > 0,
    staleTime: 900000,
  });

  const bannerImage = animeDetails?.bannerImage;
  const coverImage =
    animeDetails?.coverImage.extraLarge ||
    animeDetails?.coverImage.large ||
    animeDetails?.coverImage.medium;
  const episodeCount = animeDetails?.episodes ?? Math.max(progress, (animeDetails?.nextAiringEpisode?.episode ?? 1) - 1);
  const titleText = animeDetails?.title.english || animeDetails?.title.romaji;
  const statusLabel = selectedStatus
    ? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)
    : "Not selected";

  const handleProgressChange = (value: number) => {
    setProgress(Number.isFinite(value) ? Math.max(0, Math.min(animeDetails?.episodes ?? 10000, Math.floor(value))) : 0);
  };

  const handleSaveStatus = async () => {
    if (!animeId || !selectedStatus) {
      const warningMessage = "Choose a watch status before saving progress.";
      setStatusSaveError(warningMessage);
      return false;
    }

    setIsSavingStatus(true);
    setStatusSaveError(null);

    try {
      const result = await saveAnimeStatus(
        animeId,
        selectedStatus,
        progress,
        currentAnimeEntry?.episodeNotes ?? undefined,
        undefined,
      );

      if (result?.error) {
        console.error("Status save failed:", result.error);
        setStatusSaveError(result.error.message || "Speichern fehlgeschlagen");
        return false;
      }

      await refreshUserAnimeData();
      return true;
    } catch (error) {
      console.error("handleSaveStatus caught error:", error);
      setStatusSaveError(
        error instanceof Error
          ? error.message
          : "Could not save progress. Please try again.",
      );
      return false;
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!animeId || isFavoritePending) return;
    setIsFavoritePending(true);
    setOptimisticFavorite(!isFavorite);
    try {
      const result = await toggleFavorite(animeId, isFavorite);
      if (result?.error) throw result.error;
      await refreshFavorites();
    } catch (error) { setStatusSaveError(error instanceof Error ? error.message : "Could not save favorite."); }
    finally { setOptimisticFavorite(null); setIsFavoritePending(false); }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleOpenEpisodeModal = (episodeNumber: number) => {
    setNoteSaveError("");
    setCurrEps(episodeNumber);
    setEpisodeNoteDraft(episodeNotes[episodeNumber] ?? "");
    setEpisodeTime("");
    setIsEditingEpisode(false);
    setOpenEpsModal(true);
  };

  const handleSaveEpisodeNote = async () => {
    if (!animeId || currEps === null || isSavingNote) return;
    const episode = currEps;
    const noteText = [episodeTime, episodeNoteDraft].filter(Boolean).join("\n");
    setIsSavingNote(true); setNoteSaveError("");
    try {
      const result = await saveEpisodeNote(animeId, episode, noteText);
      if (result.error) throw result.error;
      await refreshUserAnimeData();
      setEpisodeNotes((previous) => ({ ...previous, [episode]: noteText.trim() }));
      setIsEditingEpisode(false);
    } catch (error) { setNoteSaveError(error instanceof Error ? error.message : "Could not save this note."); }
    finally { setIsSavingNote(false); }
  };

  const progressInput = useMemo(() => progress.toString(), [progress]);

  if (!Number.isSafeInteger(animeId) || animeId < 1) return <><Navbar /><main className="empty-state m-6">Invalid anime ID.</main></>;
  if (isPending) return <><Navbar /><main className="empty-state m-6" role="status">Loading anime…</main></>;
  if (error || !animeDetails) return <><Navbar /><main className="empty-state m-6" role="alert"><p>{error?.message ?? "Anime not found."}</p><button onClick={() => void refetch()}>Try again</button></main></>;
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl shadow-black/25 backdrop-blur">
            <button
              aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
              aria-pressed={isFavorite}
              disabled={isFavoritePending}
              onClick={() => {
                handleToggleFavorite();
              }}
              className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className={`w-6 h-6 transition-all duration-300 ${
                  isFavorite
                    ? "fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,1)] scale-110"
                    : "fill-transparent stroke-white/60"
                }`}
              >
                <path
                  d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                  strokeWidth="1.5"
                  className={isFavorite ? "stroke-none" : "stroke-current"}
                />
              </svg>
            </button>
            <div className="aspect-1063/460 w-full overflow-hidden bg-surface">
              {bannerImage ? (
                <img
                  src={bannerImage}
                  alt="Anime banner"
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-r from-slate-900 to-slate-800 text-sm text-muted">
                  No banner available
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <div className="flex items-end gap-4">
                <div className="pointer-events-auto hidden w-36 shrink-0 overflow-hidden rounded-xl border border-line bg-surface shadow-xl shadow-black/40 sm:block">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt="Anime poster"
                      className="aspect-2/3 w-full object-cover object-center"
                    />
                  ) : null}
                </div>
                <div className="pointer-events-auto">
                  <p className="text-xs uppercase tracking-[0.2em] text-accent">
                    Anime Details
                  </p>
                  <h1 className="mt-1 text-2xl font-extrabold text-foreground sm:text-4xl">
                    {animeDetails?.title.english ||
                      animeDetails?.title.romaji ||
                      "Unknown Title"}
                  </h1>
                  <p className="mt-1 text-sm text-foreground sm:text-base">
                    {animeDetails?.genres?.join(", ") || "Unknown Genres"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5 rounded-3xl border border-line bg-surface p-6 shadow-2xl shadow-black/25 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-accent">
                  {animeDetails?.status}
                </span>
                <h2 className="text-2xl font-bold text-foreground">Overview</h2>
                <p className="mt-2 max-w-2xl text-muted">{titleText}</p>
              </div>
              <div className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-wide text-accent">
                  Score
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {animeDetails?.averageScore ?? "N/A"}
                </p>
              </div>
            </div>
            {animeDetails?.status !== "FINISHED" ? (
              <div className="mt-6">
                <CountdownTimer
                  status={animeDetails?.status}
                  startDate={animeDetails?.startDate}
                  nextAiringEpisode={animeDetails?.nextAiringEpisode}
                  currentEpisode={progress}
                />
              </div>
            ) : (
              ""
            )}
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-3xl border border-cyan-400/20 bg-surface p-5 shadow-lg shadow-cyan-950/20">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-accent">
                      My List
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-foreground">
                      Keep track of this anime
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-muted">
                      {isFavorite
                        ? `Saved as ${statusLabel.toLowerCase()} with ${progress} episode${progress === 1 ? "" : "s"} watched.`
                        : "Add it to your list, choose a status, and save your progress in one clear flow."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
                  <p className="text-sm font-medium text-foreground">
                    Choose your status
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {statusOptions.map((option) => {
                      const isActive = selectedStatus === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedStatus(option.value)}
                          aria-pressed={isActive}
                          className={`rounded-full px-3 py-2 text-sm font-medium transition-all ${
                            isActive
                              ? "bg-cyan-400/20 text-accent ring-1 ring-cyan-400/40"
                              : "bg-surface text-muted hover:bg-slate-800"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                    <span>Current selection</span>
                    <span
                      className={`rounded-full px-2 py-1 ${
                        selectedStatus
                          ? "bg-fuchsia-400/15 text-accent"
                          : "bg-surface text-muted"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <Button
                    onClick={handleSaveStatus}
                    disabled={!selectedStatus || isSavingStatus}
                  >
                    {isSavingStatus ? "Saving..." : "Save to List"}
                  </Button>
                  {statusSaveError ? (
                    <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-danger">
                      {statusSaveError}
                    </p>
                  ) : null}
                </div>
              </div>

              <aside className="space-y-4 rounded-3xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Episode Progress
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      Keep your place easily
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm text-accent">
                    {progress}/{animeDetails.episodes ?? "?"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: episodeCount }, (_, index) => (
                    <button
                      type="button"
                      aria-label={`Open notes for episode ${index + 1}`}
                      onClick={() => handleOpenEpisodeModal(index + 1)}
                      className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:right-0 before:w-3 before:h-3 before:bg-yellow-400 before:[clip-path:polygon(100%_0,0_0,100%_100%)] ${
                        index < progress ? "bg-[#c5ed83] text-[#20251c]" : "bg-slate-700/50"
                      }
                          ${episodeNotes[index + 1] ? "before:block" : "before:hidden"}
                        `}
                      key={index}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <input
                  aria-label="Episodes watched"
                  type="range"
                  min={0}
                  max={episodeCount}
                  value={progress}
                  onChange={(event) =>
                    handleProgressChange(Number(event.target.value))
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-cyan-400"
                />
                <div className="rounded-2xl border border-line bg-surface p-3 text-sm text-muted">
                  <p className="font-medium text-foreground">Quick tip</p>
                  <p className="mt-1">
                    A clear status plus progress makes it easier to resume
                    later.
                  </p>
                </div>
                <Button variant="secondary" onClick={handleOpenModal}>
                  Update Progress
                </Button>
              </aside>
            </div>
            <article className="space-y-3 rounded-3xl border border-line bg-surface p-5">
              <h2 className="text-xl font-bold text-foreground">Synopsis</h2>
              <p className="leading-relaxed text-muted">
                {animeDetails?.description?.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]+>/g, "") || "No synopsis available."}
              </p>
            </article>
          </section>
        </div>
      </main>

      <Modal
        isOpen={toggleEpsModal}
        title={currEps ? `Episode ${currEps}` : "Episode Note"}
        onClose={() => {
          setOpenEpsModal(false);
          setCurrEps(null);
          setEpisodeNoteDraft("");
          setEpisodeTime("");
          setIsEditingEpisode(false);
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {currEps
                ? `Overview and notes for episode ${currEps}.`
                : "Select an episode first."}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {!isEditingEpisode && (
                <button
                  type="button"
                  onClick={() => setIsEditingEpisode(true)}
                  className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-sm text-accent"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {!isEditingEpisode ? (
            <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
              {episodeNotes[currEps ?? -1] ? (
                <p className="whitespace-pre-wrap">
                  {episodeNotes[currEps ?? -1]}
                </p>
              ) : (
                <p className="text-muted">No notes yet for this episode.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                label="Timestamp"
                type="text"
                placeholder="e.g. 3:45"
                value={episodeTime}
                onChange={(event) => setEpisodeTime(event.target.value)}
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-muted">
                  Notes
                </span>
                <textarea
                  value={episodeNoteDraft}
                  onChange={(event) => setEpisodeNoteDraft(event.target.value)}
                  placeholder="Write your thoughts, summary, or reminder..."
                  className="min-h-32 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                />
              </label>
              <div className="flex gap-2">
                {noteSaveError && <p role="alert">{noteSaveError}</p>}
                <Button fullWidth disabled={isSavingNote} onClick={handleSaveEpisodeNote}>
                  {isSavingNote ? "Saving…" : "Save Note"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditingEpisode(false);
                    setEpisodeNoteDraft(episodeNotes[currEps ?? -1] ?? "");
                    setEpisodeTime("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        title="Update Progress"
        onClose={handleCloseModal}
      >
        <div className="space-y-4">
          <Input
            label="Episode"
            type="number"
            min={0}
            max={animeDetails.episodes ?? undefined}
            value={progressInput}
            onChange={(event) =>
              handleProgressChange(Number(event.target.value))
            }
          />
          {statusSaveError && <p role="alert">{statusSaveError}</p>}
          <Button
            fullWidth
            disabled={isSavingStatus || !selectedStatus}
            onClick={async () => {
              if (await handleSaveStatus()) handleCloseModal();
            }}
          >
            Save Progress
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AnimeDetails;
