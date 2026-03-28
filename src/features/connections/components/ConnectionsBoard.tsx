import { useConnectionsStore } from "../hooks/useConnectionsGame";
import { PlayerCard } from "./PlayerCard";
import { RevealedGroup } from "./RevealedGroup";

export function ConnectionsBoard() {
  const challenge = useConnectionsStore((s) => s.challenge);
  const remainingPlayers = useConnectionsStore((s) => s.remainingPlayers);
  const revealedGroups = useConnectionsStore((s) => s.revealedGroups);
  const selectedIds = useConnectionsStore((s) => s.selectedIds);
  const livesLeft = useConnectionsStore((s) => s.livesLeft);
  const completed = useConnectionsStore((s) => s.completed);
  const shakeWrong = useConnectionsStore((s) => s.shakeWrong);
  const toggleSelect = useConnectionsStore((s) => s.toggleSelect);
  const submitGuess = useConnectionsStore((s) => s.submitGuess);
  const deselectAll = useConnectionsStore((s) => s.deselectAll);

  if (!challenge) return null;

  return (
    <div style={{ width: "100%", maxWidth: "500px" }}>
      {/* Grupos já revelados */}
      {revealedGroups.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
          {revealedGroups
            .sort((a, b) => a.difficulty - b.difficulty)
            .map((group) => (
              <RevealedGroup key={group.category} group={group} />
            ))}
        </div>
      )}

      {/* Grid de jogadores restantes (4 colunas) */}
      {remainingPlayers.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          {remainingPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              selected={selectedIds.includes(player.id)}
              shake={shakeWrong}
              onClick={() => toggleSelect(player.id)}
            />
          ))}
        </div>
      )}

      {/* Vidas */}
      {!completed && (
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            Vidas:{" "}
          </span>
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: "16px",
                marginRight: "4px",
                opacity: i < livesLeft ? 1 : 0.2,
              }}
            >
              ●
            </span>
          ))}
        </div>
      )}

      {/* Botões de ação */}
      {!completed && remainingPlayers.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <button
            onClick={deselectAll}
            disabled={selectedIds.length === 0}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "1px solid #475569",
              backgroundColor: "transparent",
              color: selectedIds.length === 0 ? "#475569" : "#e2e8f0",
              fontWeight: 500,
              fontSize: "14px",
              cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Limpar
          </button>
          <button
            onClick={submitGuess}
            disabled={selectedIds.length !== 4}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: selectedIds.length === 4 ? "#16a34a" : "#1e293b",
              color: selectedIds.length === 4 ? "#fff" : "#475569",
              fontWeight: 600,
              fontSize: "14px",
              cursor: selectedIds.length === 4 ? "pointer" : "not-allowed",
            }}
          >
            Confirmar ({selectedIds.length}/4)
          </button>
        </div>
      )}
    </div>
  );
}
