import type { ConnectionsGroup } from "../types";

// Cores por nível de dificuldade (mesmo padrão do NYT Connections)
const difficultyColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "rgba(251, 191, 36, 0.15)", text: "#fbbf24", border: "rgba(251, 191, 36, 0.4)" },
  2: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e", border: "rgba(34, 197, 94, 0.4)" },
  3: { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.4)" },
  4: { bg: "rgba(168, 85, 247, 0.15)", text: "#a855f7", border: "rgba(168, 85, 247, 0.4)" },
};

interface RevealedGroupProps {
  group: ConnectionsGroup;
}

export function RevealedGroup({ group }: RevealedGroupProps) {
  const colors = difficultyColors[group.difficulty] || difficultyColors[1];

  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "10px",
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.bg,
        textAlign: "center",
        animation: "fadeIn 0.4s ease-out",
      }}
    >
      <p style={{ fontWeight: 700, fontSize: "14px", color: colors.text, marginBottom: "4px" }}>
        {group.category}
      </p>
      <p style={{ fontSize: "12px", color: "#94a3b8" }}>
        {group.players.map((p) => p.name).join(", ")}
      </p>
    </div>
  );
}
