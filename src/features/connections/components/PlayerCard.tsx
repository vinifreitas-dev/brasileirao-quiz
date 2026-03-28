import type { ConnectionsPlayer } from "../types";

interface PlayerCardProps {
  player: ConnectionsPlayer;
  selected: boolean;
  shake: boolean;
  onClick: () => void;
}

export function PlayerCard({ player, selected, shake, onClick }: PlayerCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        padding: "8px 4px",
        borderRadius: "10px",
        border: selected ? "2px solid #22c55e" : "1px solid #334155",
        backgroundColor: selected ? "rgba(34, 197, 94, 0.15)" : "rgba(30, 41, 59, 0.5)",
        cursor: "pointer",
        transition: "all 0.2s",
        animation: shake && selected ? "shake 0.5s ease-in-out" : "none",
        width: "100%",
        minHeight: "90px",
      }}
    >
      {player.photo_url ? (
        <img
          src={player.photo_url}
          alt={player.name}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            objectFit: "cover",
            border: selected ? "2px solid #22c55e" : "2px solid #475569",
          }}
        />
      ) : (
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            backgroundColor: "#1e293b",
            border: "2px solid #475569",
          }}
        >
          ⚽
        </div>
      )}
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: selected ? "#22c55e" : "#e2e8f0",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: "100%",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {player.name}
      </span>
    </button>
  );
}
