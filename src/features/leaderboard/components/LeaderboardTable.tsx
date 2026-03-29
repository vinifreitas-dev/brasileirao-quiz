import type { LeaderboardEntry, TimeFilter } from "../types";

const gameLabels: Record<string, string> = {
  grid: "Grid",
  connections: "Connections",
  wordle: "Wordle",
  guess: "Quem é?",
};

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  showGameColumn: boolean;
  timeFilter: TimeFilter;
}

export function LeaderboardTable({ entries, loading, showGameColumn, timeFilter }: LeaderboardTableProps) {
  const isAggregated = timeFilter === "week" || timeFilter === "alltime";
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
        Carregando ranking...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
        <p style={{ fontSize: "18px", marginBottom: "8px" }}>Nenhum resultado ainda</p>
        <p style={{ fontSize: "13px" }}>Seja o primeiro a jogar o desafio do dia!</p>
      </div>
    );
  }

  // Medalhas para os 3 primeiros
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #334155" }}>
            <th style={thStyle}>#</th>
            <th style={{ ...thStyle, textAlign: "left" }}>Jogador</th>
            {showGameColumn && !isAggregated && <th style={thStyle}>Jogo</th>}
            <th style={thStyle}>{isAggregated ? "Total" : "Score"}</th>
            <th style={thStyle}>{isAggregated ? "Jogos" : "Tentativas"}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={`${entry.rank}-${entry.username}`}
              style={{
                borderBottom: "1px solid #1e293b",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#1e293b"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <td style={{ ...tdStyle, textAlign: "center", width: "50px" }}>
                {entry.rank <= 3 ? (
                  <span style={{ fontSize: "18px" }}>{medals[entry.rank - 1]}</span>
                ) : (
                  <span style={{ color: "#64748b", fontWeight: 500 }}>{entry.rank}</span>
                )}
              </td>
              <td style={{ ...tdStyle, fontWeight: 600, color: "#e2e8f0" }}>
                {entry.username}
              </td>
              {showGameColumn && !isAggregated && (
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  <span style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    backgroundColor: "#1e293b",
                    color: "#94a3b8",
                    fontWeight: 500,
                  }}>
                    {gameLabels[entry.game_type] || entry.game_type}
                  </span>
                </td>
              )}
              <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "#22c55e" }}>
                {entry.score}
              </td>
              <td style={{ ...tdStyle, textAlign: "center", color: "#94a3b8" }}>
                {isAggregated ? (entry.games_played ?? 0) : entry.attempts}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  textAlign: "center",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: "14px",
};
