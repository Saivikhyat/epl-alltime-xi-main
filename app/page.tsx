"use client";

import { useState, useMemo } from "react";
import playersData from "../data/players.json";

interface Player {
  id: number;
  name: string;
  position: string;
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
  CB: "Center Back",
  LB: "Left Back",
  RB: "Right Back",
  CDM: "Defensive Mid",
  CM: "Central Mid",
  CAM: "Attacking Mid",
  LW: "Left Wing",
  RW: "Right Wing",
  ST: "Striker",
};

const PITCH_LAYOUT = [
  { slot: 0, position: "ST", x: 50, y: 15, label: "ST" },
  { slot: 1, position: "LW", x: 25, y: 25, label: "LW" },
  { slot: 2, position: "RW", x: 75, y: 25, label: "RW" },
  { slot: 3, position: "CM", x: 35, y: 40, label: "CM" },
  { slot: 4, position: "CDM", x: 50, y: 45, label: "CDM" },
  { slot: 5, position: "CM", x: 65, y: 40, label: "CM" },
  { slot: 6, position: "LB", x: 15, y: 60, label: "LB" },
  { slot: 7, position: "CB", x: 35, y: 65, label: "CB" },
  { slot: 8, position: "CB", x: 65, y: 65, label: "CB" },
  { slot: 9, position: "RB", x: 85, y: 60, label: "RB" },
  { slot: 10, position: "GK", x: 50, y: 85, label: "GK" },
];

export default function Home() {
  const players = useMemo(() => playersData as Player[], []);
  const [squad, setSquad] = useState<(Player | null)[]>(
    Array(11).fill(null)
  );
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredPlayers = useMemo(() => {
    const usedPlayerIds = new Set(
      squad.filter((p): p is Player => p !== null).map((p) => p.id)
    );
    return players.filter(
      (p) =>
        !usedPlayerIds.has(p.id) &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.club.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [players, squad, searchQuery]);

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

  const handleRemovePlayer = (slotIndex: number) => {
    const newSquad = [...squad];
    newSquad[slotIndex] = null;
    setSquad(newSquad);
  };

  const handleRateSquad = async () => {
    const filledCount = squad.filter((p) => p !== null).length;
    if (filledCount < 11) {
      setError("Please fill all 11 positions before rating the squad.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      const response = await fetch("/api/rate-squad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squad }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rate squad");
      }

      const data: AIResponse = await response.json();
      setAiResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-white mb-2">
          Premier League All-Time XI
        </h1>
        <p className="text-center text-green-200 mb-8">
          Build your dream squad and get AI-powered tactical analysis
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Pitch */}
          <div className="flex-1">
            <div className="relative bg-green-600 rounded-xl overflow-hidden shadow-2xl border-4 border-white/20"
              style={{ aspectRatio: "1.5/1" }}>
              {/* Pitch markings */}
              <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
              <div className="absolute left-1/2 top-4 bottom-4 w-0.5 bg-white/30" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full" />
              <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-32 border-2 border-white/30 rounded-lg" />
              <div className="absolute right-1/4 top-1/2 translate-x-1/2 -translate-y-1/2 w-16 h-32 border-2 border-white/30 rounded-lg" />
              <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-16 border-2 border-white/30 rounded-lg" />
              <div className="absolute right-1/4 top-1/2 translate-x-1/2 -translate-y-1/2 w-8 h-16 border-2 border-white/30 rounded-lg" />

              {/* Pitch slots */}
              {PITCH_LAYOUT.map((layout) => {
                const player = squad[layout.slot];
                const isSelected = selectedSlot === layout.slot;

                return (
                  <button
                    key={layout.slot}
                    onClick={() => handleSlotClick(layout.slot)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-20 h-24 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? "bg-yellow-400 text-yellow-900 scale-110 shadow-lg ring-2 ring-yellow-300"
                        : player
                        ? "bg-white/90 text-green-900 hover:bg-white hover:scale-105"
                        : "bg-white/20 text-white/70 hover:bg-white/30 border-2 border-dashed border-white/40"
                    }`}
                    style={{ left: `${layout.x}%`, top: `${layout.y}%` }}
                  >
                    {player ? (
                      <>
                        <span className="text-lg font-bold leading-none">
                          {player.name.split(" ").pop()}
                        </span>
                        <span className="text-xs opacity-80">
                          {player.position}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlayer(layout.slot);
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span className="text-sm font-semibold">{layout.label}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Rate Button */}
            <button
              onClick={handleRateSquad}
              disabled={isLoading || squad.filter((p) => p !== null).length < 11}
              className={`mt-6 w-full py-4 rounded-xl text-xl font-bold transition-all duration-200 ${
                isLoading || squad.filter((p) => p !== null).length < 11
                  ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-300 hover:to-orange-400 hover:scale-[1.02] shadow-lg"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Analyzing Squad...
                </span>
              ) : (
                "Rate Squad"
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
                {error}
              </div>
            )}

            {/* AI Response */}
            {aiResponse && (
              <div className="mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-5xl font-black text-white">
                      {aiResponse.rating.toFixed(1)}
                    </div>
                    <div className="text-sm text-green-200">/ 10.0</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Tactical Summary
                    </h3>
                    <p className="text-green-100">{aiResponse.tacticalSummary}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Key Strengths
                  </h3>
                  <ul className="space-y-1">
                    {aiResponse.keyStrengths.map((strength, i) => (
                      <li key={i} className="text-green-100 flex items-start gap-2">
                        <span className="text-yellow-400">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Available Players</h2>

            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search by name, position, or club..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>

            {/* Position filter buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {["All", "GK", "DEF", "MID", "FWD"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    if (filter === "All") setSearchQuery("");
                    else if (filter === "DEF") setSearchQuery("CB LB RB");
                    else if (filter === "MID") setSearchQuery("CDM CM CAM");
                    else if (filter === "FWD") setSearchQuery("LW RW ST");
                    else setSearchQuery(filter);
                  }}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Player list */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {filteredPlayers.length === 0 ? (
                <div className="text-center text-white/50 py-8">
                  No players found
                </div>
              ) : (
                filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player)}
                    disabled={selectedSlot === null}
                    className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                      selectedSlot !== null
                        ? "bg-white/20 hover:bg-yellow-400/30 hover:border-yellow-400 border border-transparent cursor-pointer"
                        : "bg-white/10 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">
                          {player.name}
                        </div>
                        <div className="text-sm text-green-200">
                          {POSITION_LABELS[player.position] || player.position}
                        </div>
                        <div className="text-xs text-white/60">{player.club}</div>
                      </div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {player.rating}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Instructions */}
            {selectedSlot === null && (
              <div className="mt-4 p-3 bg-yellow-400/20 rounded-lg border border-yellow-400/30">
                <p className="text-sm text-yellow-200">
                  Click a position on the pitch to select it, then choose a player
                  from the list.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
