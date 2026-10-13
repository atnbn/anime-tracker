import { useEffect, useMemo, useState } from "react";
import type { AnimeDetailsStartDate } from "../../types/animeTypes";

type NextAiringEpisode = {
  episode: number | null;
  airingAt: number | null;
  timeUntilAiring: number | null;
};

type CountdownTimerProps = {
  status?: string | null;
  startDate?: AnimeDetailsStartDate | null;
  nextAiringEpisode?: NextAiringEpisode | null;
  currentEpisode?: number | null;
};

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
};

const formatDateLabel = (startDate: AnimeDetailsStartDate) => {
  if (!startDate.year || !startDate.month || !startDate.day) {
    return null;
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(startDate.year, startDate.month - 1, startDate.day));
};

const buildTargetDate = (
  status: string | null | undefined,
  startDate: AnimeDetailsStartDate | null | undefined,
  nextAiringEpisode: NextAiringEpisode | null | undefined,
) => {
  const normalizedStatus = status?.toUpperCase() ?? "";

  if (nextAiringEpisode?.airingAt) {
    const target = new Date(nextAiringEpisode.airingAt * 1000);
    return target;
  }

  if (normalizedStatus === "NOT_YET_RELEASED") {
    if (startDate?.year && startDate?.month && startDate?.day) {
      const release = new Date(
        startDate.year,
        startDate.month - 1,
        startDate.day,
        0,
        0,
        0,
      );

      return release;
    }
    return null;
  }

  return null;
};

const CountdownTimer = ({
  status,
  startDate,
  nextAiringEpisode,
  currentEpisode,
}: CountdownTimerProps) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const targetDate = useMemo(
    () => buildTargetDate(status, startDate, nextAiringEpisode),
    [status, startDate, nextAiringEpisode],
  );

  const formattedReleaseDate = useMemo(
    () => (startDate ? formatDateLabel(startDate) : null),
    [startDate],
  );

  const nextEpisodeNumber =
    nextAiringEpisode?.episode != null
      ? nextAiringEpisode.episode
      : currentEpisode != null
        ? currentEpisode + 1
        : undefined;

  const timeLeftMs = targetDate ? targetDate.getTime() - now : 0;
  const countdown = formatCountdown(timeLeftMs);

  const isCountdownActive = Boolean(targetDate && timeLeftMs > 0);

  const statusLabel =
    status === "NOT_YET_RELEASED"
      ? "Release Countdown"
      : status === "RELEASING" || status === "CURRENT" || status === "AIRING"
        ? "Nächste Folge"
        : "Countdown";

  const message =
    status === "NOT_YET_RELEASED"
      ? formattedReleaseDate
        ? `Startet am ${formattedReleaseDate}`
        : "Startdatum nicht verfügbar"
      : status === "RELEASING" || status === "CURRENT" || status === "AIRING"
        ? nextEpisodeNumber
          ? `Episode ${nextEpisodeNumber} in `
          : "Nächste Folge bald"
        : "Countdown nicht verfügbar";

  return (
    <div className="max-w-[380px] w-full overflow-hidden rounded-3xl border border-line bg-surface p-5 backdrop-blur-xl shadow-2xl">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                {statusLabel}
              </p>
            </span>
            <p className="mt-1 text-base font-medium text-foreground">
              {message}
            </p>
          </div>

          {isCountdownActive && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
            </span>
          )}
        </div>

        {/* Timer Grid */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Tage", value: countdown.days },
            { label: "Std", value: countdown.hours },
            { label: "Min", value: countdown.minutes },
            { label: "Sek", value: countdown.seconds },
          ].map((item, idx) => (
            <div
              key={item.label}
              className="relative flex flex-col items-center"
            >
              {/* Separator Line (except for the last item) */}
              {idx !== 3 && (
                <div className="absolute -right-2 top-1/4 h-1/2 w-[1px] bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
              )}

              <span className="font-mono text-3xl font-light tracking-tighter text-foreground tabular-nums">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
