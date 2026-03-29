import { useState, useEffect } from "react";
import { fetchLeaderboard, fetchTopPlayers } from "../utils";
import { LeaderboardTable } from "./LeaderboardTable";
import { TopPlayersTable } from "./TopPlayersTable";
import type { LeaderboardEntry, PlayerStats, GameFilter, TimeFilter } from "../types";

const gameOptions: Array<{ value: GameFilter; label: string; emoji: string }> = [
  { value: "all", label: "Todos", emoji: "🏆" },
  { value: "grid", label: "Grid", emoji: "🟩" },
  { value: "connections", label: "Connections", emoji: "🔗" },
  { value: "wordle", label: "Wordle", emoji: "🔤" },
  { value: "guess", label: "Quem é?", emoji: "🕵️" },
];

const timeOptions: Array<{ value: TimeFilter; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "alltime", label: "Geral" },
];

export function LeaderboardPage() {
  const [gameFilter, setGameFilter] = useState<GameFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"ranking" | "stats">("ranking");

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (view === "ranking") {
        const data = await fetchLeaderboard(gameFilter, timeFilter);
        setEntries(data);
      } else {
        const data = await fetchTopPlayers(gameFilter);
        setTopPlayers(data);
      }
      setLoading(false);
    }
    load();
  }, [gameFilter, timeFilter, view]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
      <h1 className="mb-2 text-center text-2xl font-bold text-surface-50 sm:text-3xl">
        🏆 Leaderboard
      </h1>
      <p className="mb-6 text-center text-sm text-surface-400">
        Ranking dos jogadores nos desafios diários
      </p>

      {/* Toggle: Ranking vs Estatísticas */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: "16px",
      }}>
        <div style={{
          display: "flex",
          borderRadius: "10px",
          border: "1px solid #334155",
          overflow: "hidden",
        }}>
          <button
            onClick={() => setView("ranking")}
            style={{
              padding: "8px 20px",
              border: "none",
              backgroundColor: view === "ranking" ? "#16a34a" : "transparent",
              color: view === "ranking" ? "#fff" : "#94a3b8",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            📊 Ranking
          </button>
          <button
            onClick={() => setView("stats")}
            style={{
              padding: "8px 20px",
              border: "none",
              borderLeft: "1px solid #334155",
              backgroundColor: view === "stats" ? "#334155" : "transparent",
              color: view === "stats" ? "#e2e8f0" : "#94a3b8",
              fontWeight: 500,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            ⭐ Melhores Jogadores
          </button>
        </div>
      </div>

      {/* Filtro por jogo */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "6px",
        marginBottom: "12px",
        flexWrap: "wrap",
      }}>
        {gameOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setGameFilter(opt.value)}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: gameFilter === opt.value ? "1px solid #22c55e" : "1px solid #334155",
              backgroundColor: gameFilter === opt.value ? "rgba(34, 197, 94, 0.1)" : "transparent",
              color: gameFilter === opt.value ? "#22c55e" : "#94a3b8",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>

      {/* Filtro por período (só no modo ranking) */}
      {view === "ranking" && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "6px",
          marginBottom: "20px",
        }}>
          {timeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeFilter(opt.value)}
              style={{
                padding: "5px 14px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: timeFilter === opt.value ? "#334155" : "transparent",
                color: timeFilter === opt.value ? "#e2e8f0" : "#64748b",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Tabela */}
      <div style={{
        borderRadius: "12px",
        border: "1px solid #334155",
        backgroundColor: "#0f172a",
        overflow: "hidden",
      }}>
        {view === "ranking" ? (
          <LeaderboardTable
            entries={entries}
            loading={loading}
            showGameColumn={gameFilter === "all"}
            timeFilter={timeFilter}
          />
        ) : (
          <TopPlayersTable
            players={topPlayers}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
