import type { PlayerStats } from "../types";

interface TopPlayersTableProps {
  players: PlayerStats[];
  loading: boolean;
}

export function TopPlayersTable({ players, loading }: TopPlayersTableProps) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
        Carregando estatísticas...
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
        <p style={{ fontSize: "18px", marginBottom: "8px" }}>Nenhum jogador ainda</p>
        <p style={{ fontSize: "13px" }}>Complete desafios diários para aparecer no ranking!</p>
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #334155" }}>
            <th style={thStyle}>#</th>
            <th style={{ ...thStyle, textAlign: "left" }}>Jogador</th>
            <th style={thStyle}>Total</th>
            <th style={thStyle}>Jogos</th>
            <th style={thStyle}>Média</th>
            <th style={thStyle}>Melhor</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr
              key={player.username}
              style={{
                borderBottom: "1px solid #1e293b",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#1e293b"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <td style={{ ...tdStyle, textAlign: "center", width: "50px" }}>
                {index < 3 ? (
                  <span style={{ fontSize: "18px" }}>{medals[index]}</span>
                ) : (
                  <span style={{ color: "#64748b", fontWeight: 500 }}>{index + 1}</span>
                )}
              </td>
              <td style={{ ...tdStyle, fontWeight: 600, color: "#e2e8f0" }}>
                {player.username}
              </td>
              <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "#22c55e" }}>
                {player.total_score}
              </td>
              <td style={{ ...tdStyle, textAlign: "center", color: "#94a3b8" }}>
                {player.games_played}
              </td>
              <td style={{ ...tdStyle, textAlign: "center", color: "#fbbf24" }}>
                {player.avg_score}
              </td>
              <td style={{ ...tdStyle, textAlign: "center", color: "#3b82f6" }}>
                {player.best_score}
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
