"use client";

import { useState, useMemo } from "react";
import playersData from "../data/players.json";

interface Player {
  id: number;
  name: string;
  position: string;
  altPositions: string[];
  club: string;
  rating: number;
}

interface AIResponse {
  rating: number;
  tacticalSummary: string;
  keyStrengths: string[];
}

const POSITION_LABELS: Record<string, string> = {
  GK: "Goalkeeper",
  CB: "Centre Back",
  LB: "Left Back",
  RB: "Right Back",
  CDM: "Defensive Mid",
  CM: "Central Mid",
  CAM: "Attacking Mid",
  LW: "Left Wing",
  RW: "Right Wing",
  ST: "Striker",
};

const POSITION_COLORS: Record<string, { bg: string; text: string }> = {
  GK: { bg: "bg-amber-500", text: "text-amber-500" },
  CB: { bg: "bg-sky-500", text: "text-sky-500" },
  LB: { bg: "bg-sky-400", text: "text-sky-400" },
  RB: { bg: "bg-sky-400", text: "text-sky-400" },
  CDM: { bg: "bg-emerald-500", text: "text-emerald-500" },
  CM: { bg: "bg-emerald-400", text: "text-emerald-400" },
  CAM: { bg: "bg-emerald-300", text: "text-emerald-300" },
  LW: { bg: "bg-rose-500", text: "text-rose-500" },
  RW: { bg: "bg-rose-500", text: "text-rose-500" },
  ST: { bg: "bg-rose-400", text: "text-rose-400" },
};

const PITCH_LAYOUT = [
  { slot: 0, position: "ST", x: 50, y: 12, label: "ST" },
  { slot: 1, position: "LW", x: 22, y: 24, label: "LW" },
  { slot: 2, position: "RW", x: 78, y: 24, label: "RW" },
  { slot: 3, position: "CM", x: 32, y: 40, label: "CM" },
  { slot: 4, position: "CDM", x: 50, y: 44, label: "CDM" },
  { slot: 5, position: "CM", x: 68, y: 40, label: "CM" },
  { slot: 6, position: "LB", x: 14, y: 60, label: "LB" },
  { slot: 7, position: "CB", x: 35, y: 64, label: "CB" },
  { slot: 8, position: "CB", x: 65, y: 64, label: "CB" },
  { slot: 9, position: "RB", x: 86, y: 60, label: "RB" },
  { slot: 10, position: "GK", x: 50, y: 84, label: "GK" },
];

function RatingBadge({ rating }: { rating: number }) {
  const color =
    rating >= 93
      ? "from-yellow-400 to-amber-500 text-amber-950"
      : rating >= 90
      ? "from-emerald-400 to-teal-500 text-teal-950"
      : "from-slate-200 to-slate-300 text-slate-700";
  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br font-bold text-sm ${color}`}
    >
      {rating}
    </span>
  );
}

export default function Home() {
  const players = useMemo(() => playersData as Player[], []);
  const [squad, setSquad] = useState<(Player | null)[]>(Array(11).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filledCount = squad.filter((p) => p !== null).length;

  const filteredPlayers = useMemo(() => {
    const usedPlayerIds = new Set(
      squad.filter((p): p is Player => p !== null).map((p) => p.id)
    );
    const q = searchQuery.toLowerCase();
    const slotPosition = selectedSlot !== null ? PITCH_LAYOUT[selectedSlot].position : null;

    return players.filter((p) => {
      if (usedPlayerIds.has(p.id)) return false;
      const fitsPosition = slotPosition
        ? p.position === slotPosition || p.altPositions.includes(slotPosition)
        : true;
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.altPositions.some((ap) => ap.toLowerCase().includes(q)) ||
        p.club.toLowerCase().includes(q);
      return fitsPosition && matchesSearch;
    });
  }, [players, squad, searchQuery, selectedSlot]);

  const handleSlotClick = (slotIndex: number) => {
    setSelectedSlot(slotIndex === selectedSlot ? null : slotIndex);
  };

  const handlePlayerSelect = (player: Player) => {
    if (selectedSlot === null) return;
    const newSquad = [...squad];
    newSquad[selectedSlot] = player;
    setSquad(newSquad);
    setSelectedSlot(null);
    setSearchQuery("");
  };

  const handleRemovePlayer = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSquad = [...squad];
    newSquad[slotIndex] = null;
    setSquad(newSquad);
  };

  const handleRateSquad = async () => {
    if (filledCount < 11) {
      setError("Fill all 11 positions before rating your squad.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAiResponse(null);
    try {
      const res = await fetch("/api/rate-squad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squad }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to rate squad");
      }
      setAiResponse(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0d1321]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l9-9 9 9M3 3h18v18H3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">PL All-Time XI</h1>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-widest">Squad Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-400">{filledCount}/11 Players</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Left: Pitch + Controls */}
          <div className="flex-1 min-w-0">
            {/* Pitch Card */}
            <div className="rounded-2xl bg-[#111827] border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/40">
              <div className="p-1">
                <div
                  className="relative rounded-xl overflow-hidden"
                  style={{ aspectRatio: "1.6 / 1" }}
                >
                  {/* Pitch Background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#1a5c2a] via-[#1d6b30] to-[#1a5c2a]" />
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)",
                    }}
                  />

                  {/* Pitch Markings */}
                  <div className="absolute inset-[3%] border border-white/20 rounded-sm" />
                  <div className="absolute left-1/2 top-[3%] bottom-[3%] w-px bg-white/20" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/20 rounded-full" />
                  {/* Penalty areas */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-[3%] w-[36%] h-[18%] border border-white/20 rounded-b-sm" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[3%] w-[36%] h-[18%] border border-white/20 rounded-t-sm" />
                  {/* Goal areas */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-[3%] w-[18%] h-[8%] border border-white/20 rounded-b-sm" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[3%] w-[18%] h-[8%] border border-white/20 rounded-t-sm" />
                  {/* Penalty dots */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-[14%] w-1.5 h-1.5 bg-white/30 rounded-full" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[14%] w-1.5 h-1.5 bg-white/30 rounded-full" />

                  {/* Pitch Slots */}
                  {PITCH_LAYOUT.map((layout) => {
                    const player = squad[layout.slot];
                    const isSelected = selectedSlot === layout.slot;
                    const posColor = POSITION_COLORS[layout.position];

                    return (
                      <div
                        key={layout.slot}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSlotClick(layout.slot)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            handleSlotClick(layout.slot);
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group"
                        style={{ left: `${layout.x}%`, top: `${layout.y}%` }}
                      >
                        {player ? (
                          <div
                            className={`relative w-[76px] rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                              isSelected
                                ? "scale-110 ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30"
                                : "hover:scale-105 hover:shadow-lg hover:shadow-black/40"
                            }`}
                          >
                            <div className="bg-[#1a2332] backdrop-blur-sm border border-white/10 rounded-xl px-2 py-2.5 flex flex-col items-center gap-0.5">
                              <div
                                className={`w-full h-1 rounded-full ${posColor.bg} opacity-80 mb-1`}
                              />
                              <span className="text-white font-bold text-[13px] leading-tight text-center truncate w-full">
                                {player.name.split(" ").pop()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                {player.position}
                              </span>
                              <RatingBadge rating={player.rating} />
                            </div>
                            <button
                              onClick={(e) => handleRemovePlayer(layout.slot, e)}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400 shadow"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`w-[76px] h-[88px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                              isSelected
                                ? "border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20 scale-105"
                                : "border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]"
                            }`}
                          >
                            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                              {layout.label}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rate Button */}
            <button
              onClick={handleRateSquad}
              disabled={isLoading || filledCount < 11}
              className={`mt-6 w-full h-14 rounded-xl font-semibold text-[15px] transition-all duration-300 flex items-center justify-center gap-2.5 ${
                isLoading || filledCount < 11
                  ? "bg-white/[0.04] text-slate-500 border border-white/[0.06] cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing your squad...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Rate Squad
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="mt-4 px-5 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            {/* AI Response */}
            {aiResponse && (
              <div className="mt-6 rounded-2xl bg-[#111827] border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/40">
                {/* Rating Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-purple-600/10 border-b border-white/[0.06]">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <span className="text-3xl font-black text-amber-950">
                          {aiResponse.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-md bg-[#111827] border border-white/10 text-[10px] font-bold text-slate-400 uppercase">
                        /10
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Tactical Analysis
                      </h3>
                      <p className="text-slate-300 text-[15px] leading-relaxed">
                        {aiResponse.tacticalSummary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Strengths */}
                <div className="px-8 py-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                    Key Strengths
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {aiResponse.keyStrengths.map((strength, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                      >
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-300 leading-snug">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="w-full xl:w-[380px] flex-shrink-0">
            <div className="sticky top-20 rounded-2xl bg-[#111827] border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/40">
              {/* Sidebar Header */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                    {selectedSlot !== null
                      ? `Select ${PITCH_LAYOUT[selectedSlot].label}`
                      : "Player Pool"}
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {filteredPlayers.length} available
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-10 rounded-xl bg-white/[0.04] text-white placeholder-slate-500 text-sm border border-white/[0.06] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                {selectedSlot === null && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(["All", "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSearchQuery(filter === "All" ? "" : filter)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          (filter === "All" && searchQuery === "") ||
                          searchQuery === filter
                            ? "bg-purple-600 text-white shadow-sm shadow-purple-500/25"
                            : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Player List */}
              <div className="p-3 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
                {filteredPlayers.length === 0 ? (
                  <div className="py-12 text-center">
                    <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                    <p className="text-sm text-slate-500">No players match your search</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredPlayers.map((player) => {
                      const posColor = POSITION_COLORS[player.position];
                      const isDisabled = selectedSlot === null;

                      return (
                        <button
                          key={player.id}
                          onClick={() => handlePlayerSelect(player)}
                          disabled={isDisabled}
                          className={`w-full p-3 rounded-xl text-left transition-all duration-200 group ${
                            isDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : "bg-white/[0.02] border border-transparent hover:bg-white/[0.06] hover:border-white/[0.08] cursor-pointer active:scale-[0.98]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-10 rounded-full ${posColor.bg} opacity-60`} />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white text-[13px] truncate">
                                {player.name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${posColor.text}`}>
                                  {player.position}
                                </span>
                                {player.altPositions.length > 0 && (
                                  <>
                                    <span className="text-[10px] text-slate-600">•</span>
                                    <span className="text-[9px] text-slate-500">
                                      {player.altPositions.join(", ")}
                                    </span>
                                  </>
                                )}
                                <span className="text-[10px] text-slate-600">•</span>
                                <span className="text-[11px] text-slate-500 truncate">
                                  {player.club}
                                </span>
                              </div>
                            </div>
                            <RatingBadge rating={player.rating} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Hint */}
              {selectedSlot === null && filledCount < 11 && (
                <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.591" />
                      </svg>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Click any slot on the pitch, then select a player from the list above.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
}
