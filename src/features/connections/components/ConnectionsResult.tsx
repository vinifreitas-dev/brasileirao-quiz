import { useState } from "react";
import { useConnectionsStore } from "../hooks/useConnectionsGame";

// Emojis por dificuldade (para compartilhamento)
const difficultyEmoji: Record<number, string> = {
  1: "🟨",
  2: "🟩",
  3: "🟦",
  4: "🟪",
};

export function ConnectionsResult() {
  const completed = useConnectionsStore((s) => s.completed);
  const won = useConnectionsStore((s) => s.won);
  const livesLeft = useConnectionsStore((s) => s.livesLeft);
  const revealedGroups = useConnectionsStore((s) => s.revealedGroups);
  const resetGame = useConnectionsStore((s) => s.resetGame);
  const startGame = useConnectionsStore((s) => s.startGame);
  const [copied, setCopied] = useState(false);

  if (!completed) return null;

  // Gerar resultado para compartilhamento
  const groupsLine = revealedGroups
    .sort((a, b) => a.difficulty - b.difficulty)
    .map((g) => difficultyEmoji[g.difficulty] || "⬜")
    .join("");

  const livesLine = "●".repeat(livesLeft) + "○".repeat(4 - livesLeft);
  const shareText = `🔗 Brasileirão Quiz - Connections\n${won ? "Completou!" : "Não completou"} ${livesLine}\n${groupsLine}`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePlayAgain() {
    resetGame();
    await startGame();
  }

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid #334155",
        backgroundColor: "#0f172a",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#f8fafc" }}>
        {won ? "🎉 Parabéns!" : "😔 Não foi dessa vez!"}
      </h3>

      <p style={{ fontSize: "14px", color: "#94a3b8" }}>
        {won
          ? `Você completou com ${livesLeft} vida${livesLeft !== 1 ? "s" : ""} restante${livesLeft !== 1 ? "s" : ""}!`
          : "Suas vidas acabaram. Tente novamente!"}
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={handleShare}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#16a34a",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {copied ? "Copiado!" : "Compartilhar"}
        </button>
        <button
          onClick={handlePlayAgain}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: "1px solid #475569",
            backgroundColor: "transparent",
            color: "#e2e8f0",
            fontWeight: 500,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Jogar novamente
        </button>
      </div>
    </div>
  );
}
