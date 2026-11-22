import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Check,
  Clock,
  FastForward,
  Pause,
  Pencil,
  Play,
  Rewind,
  X
} from "lucide-react";
import type { SimDateStore } from "../../hooks/useSimDateStore";
import SimDateReadout from "./SimDateReadout";

const QUICK_SPEED_PRESETS = [
  { label: "Pause", value: 0 },
  { label: "1 d/s", value: 1 },
  { label: "10 d/s", value: 10 },
  { label: "30 d/s", value: 30 },
  { label: "1 yr/s", value: 365 }
] as const;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
] as const;

const MIN_YEAR = -3000;
const MAX_YEAR = 3000;

function getDaysInUtcMonth(year: number, month1Based: number): number {
  const probe = new Date(0);
  probe.setUTCFullYear(year, month1Based, 0);
  probe.setUTCHours(12, 0, 0, 0);
  return probe.getUTCDate();
}

function buildUtcNoonEpochMs(year: number, month1Based: number, day: number): number {
  const clampedYear = Math.min(MAX_YEAR, Math.max(MIN_YEAR, Math.trunc(year)));
  const clampedMonth = Math.min(12, Math.max(1, Math.trunc(month1Based)));
  const maxDay = getDaysInUtcMonth(clampedYear, clampedMonth);
  const clampedDay = Math.min(maxDay, Math.max(1, Math.trunc(day)));

  const date = new Date(0);
  date.setUTCFullYear(clampedYear, clampedMonth - 1, clampedDay);
  date.setUTCHours(12, 0, 0, 0);
  return date.getTime();
}

interface TimeDrawerProps {
  speed: number;
  speedStr: string;
  isPaused: boolean;
  simDateStore: SimDateStore;
  focusRing: string;
  onSlower: () => void;
  onFaster: () => void;
  onTogglePause: () => void;
  onSelectSpeed: (value: number) => void;
  onClose: () => void;
}

export default function TimeDrawer({
  speed,
  speedStr,
  isPaused,
  simDateStore,
  focusRing,
  onSlower,
  onFaster,
  onTogglePause,
  onSelectSpeed,
  onClose
}: TimeDrawerProps) {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [monthInput, setMonthInput] = useState(1);
  const [dayInput, setDayInput] = useState("1");
  const [yearInput, setYearInput] = useState("2000");
  const yearInputRef = useRef<HTMLInputElement>(null);

  const openDateEditor = () => {
    const current = new Date(simDateStore.getEpochMs());
    setMonthInput(current.getUTCMonth() + 1);
    setDayInput(String(current.getUTCDate()));
    setYearInput(String(current.getUTCFullYear()));
    setIsEditingDate(true);
  };

  useEffect(() => {
    if (!isEditingDate) return;
    // Focus & select the year field for fast keyboard entry
    const id = window.requestAnimationFrame(() => {
      yearInputRef.current?.focus();
      yearInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [isEditingDate]);

  const handleDateSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedYear = Number.parseInt(yearInput, 10);
    const parsedDay = Number.parseInt(dayInput, 10);
    if (!Number.isFinite(parsedYear) || !Number.isFinite(parsedDay)) {
      return;
    }
    const targetMs = buildUtcNoonEpochMs(parsedYear, monthInput, parsedDay);
    simDateStore.requestJump(targetMs);
    setIsEditingDate(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Time simulation controls"
      className="pointer-events-auto mb-2 w-full max-w-sm sm:w-80 rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.95),rgba(20,28,40,0.9))] p-3 shadow-[0_18px_42px_rgba(0,0,0,0.75)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/40 pb-2 mb-2.5 px-1">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-primary-accent">
          <Clock className="h-3.5 w-3.5 text-primary-accent" />
          Time Control
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => (isEditingDate ? setIsEditingDate(false) : openDateEditor())}
            className={`group flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums transition active:scale-95 ${focusRing} ${
              isEditingDate
                ? "border-primary-accent/70 bg-primary-accent/20 shadow-[0_0_8px_rgba(99,102,241,0.35)]"
                : "border-slate-700/55 bg-white/[0.04] hover:border-primary-accent/55 hover:bg-white/[0.1]"
            }`}
            title="Click to enter a custom date"
            aria-label="Edit simulation date"
            aria-expanded={isEditingDate}
          >
            <SimDateReadout store={simDateStore} />
            <Pencil className="h-2.5 w-2.5 text-slate-400 group-hover:text-primary-accent transition-colors" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition ${focusRing}`}
            aria-label="Close time controls"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Custom Date Editor */}
      {isEditingDate && (
        <form
          onSubmit={handleDateSubmit}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              e.preventDefault();
              setIsEditingDate(false);
            }
          }}
          className="mb-2.5 rounded-xl border border-primary-accent/35 bg-slate-950/65 p-2.5"
        >
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-primary-accent">
              Jump to Date (UTC)
            </span>
            <span className="text-[9px] text-slate-400 tabular-nums">
              -3000 to 3000
            </span>
          </div>

          <div className="grid grid-cols-[1.05fr_0.7fr_1.1fr_auto] gap-1.5 items-center">
            <select
              aria-label="Month"
              value={monthInput}
              onChange={(e) => setMonthInput(Number(e.target.value))}
              className={`h-8 rounded-lg border border-slate-700/70 bg-slate-900/90 px-1.5 text-[11px] font-semibold text-white outline-none focus:border-primary-accent/80 ${focusRing}`}
            >
              {MONTHS.map((label, idx) => (
                <option key={label} value={idx + 1}>
                  {label}
                </option>
              ))}
            </select>

            <input
              type="number"
              aria-label="Day"
              inputMode="numeric"
              min={1}
              max={31}
              value={dayInput}
              onChange={(e) => setDayInput(e.target.value)}
              placeholder="Day"
              className={`h-8 w-full rounded-lg border border-slate-700/70 bg-slate-900/90 px-2 text-[11px] font-semibold text-white tabular-nums outline-none focus:border-primary-accent/80 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${focusRing}`}
            />

            <input
              ref={yearInputRef}
              type="number"
              aria-label="Year"
              inputMode="numeric"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              placeholder="Year"
              className={`h-8 w-full rounded-lg border border-slate-700/70 bg-slate-900/90 px-2 text-[11px] font-semibold text-white tabular-nums outline-none focus:border-primary-accent/80 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${focusRing}`}
            />

            <button
              type="submit"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border border-primary-accent/70 bg-primary-accent/30 text-white hover:bg-primary-accent/45 active:scale-95 transition ${focusRing}`}
              title="Apply date"
              aria-label="Apply custom date"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Primary Transport Controls */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5">
        <button
          type="button"
          onClick={onSlower}
          className={`flex h-9 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/[0.04] text-slate-200 hover:bg-white/[0.1] hover:text-white active:scale-95 transition ${focusRing}`}
          aria-label="Slow down simulation"
          title="Slow down"
        >
          <Rewind className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onTogglePause}
          className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-[11px] font-bold uppercase tracking-wider transition active:scale-95 ${focusRing} ${
            isPaused
              ? "border-slate-600/70 bg-slate-800/70 text-slate-200 hover:text-white"
              : "border-primary-accent/70 bg-primary-accent/25 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
          }`}
        >
          {isPaused ? (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span className="tabular-nums">{speedStr}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onFaster}
          className={`flex h-9 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/[0.04] text-slate-200 hover:bg-white/[0.1] hover:text-white active:scale-95 transition ${focusRing}`}
          aria-label="Speed up simulation"
          title="Speed up"
        >
          <FastForward className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Speed Presets */}
      <div className="grid grid-cols-5 gap-1">
        {QUICK_SPEED_PRESETS.map((preset) => {
          const isPresetActive = Math.abs(speed - preset.value) < 1e-6;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSelectSpeed(preset.value)}
              className={`rounded-lg py-1.5 text-[10px] font-bold tracking-wide transition active:scale-95 ${focusRing} ${
                isPresetActive
                  ? "bg-primary-accent/25 border border-primary-accent/70 text-white shadow-[0_0_10px_rgba(99,102,241,0.35)]"
                  : "bg-white/[0.04] border border-slate-700/50 text-slate-300 hover:bg-white/[0.09] hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
