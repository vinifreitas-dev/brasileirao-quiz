import { useState } from "react";
import { useGuessStore } from "../hooks/useGuessGame";

export function GuessResult({ isDaily }: { isDaily?: boolean }) {
  const completed = useGuessStore((s) => s.completed);
  const won = useGuessStore((s) => s.won);
  const player = useGuessStore((s) => s.player);
  const hintsRevealed = useGuessStore((s) => s.hintsRevealed);
  const hints = useGuessStore((s) => s.hints);
  const resetGame = useGuessStore((s) => s.resetGame);
  const startGame = useGuessStore((s) => s.startGame);
  const [copied, setCopied] = useState(false);

  if (!completed || !player) return null;

  const totalHints = hints.length;
  const score = won ? Math.max(1, totalHints - hintsRevealed + 1) : 0;

  const shareText = `🕵️ Brasileirão Quiz - Quem é o Jogador?\n${won ? `Acertei com ${hintsRevealed} dica${hintsRevealed !== 1 ? "s" : ""}!` : "Não acertei..."}\n${"🟩".repeat(score)}${"⬛".repeat(totalHints - score)}`;

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
        maxWidth: "400px",
        width: "100%",
      }}
    >
      <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#f8fafc" }}>
        {won ? "🎉 Acertou!" : "😔 Era..."}
      </h3>

      {/* Jogador revelado */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        {player.photo_url && (
          <img
            src={player.photo_url}
            alt={player.name}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              objectFit: "cover",
              border: won ? "3px solid #22c55e" : "3px solid #ef4444",
            }}
          />
        )}
        <p style={{ fontSize: "22px", fontWeight: 700, color: won ? "#22c55e" : "#ef4444" }}>
          {player.name}
        </p>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>
          {player.full_name}
        </p>
        <p style={{ fontSize: "13px", color: "#64748b" }}>
          {player.clubs.join(", ")}
        </p>
      </div>

      {won && (
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>
          Acertou com apenas {hintsRevealed} dica{hintsRevealed !== 1 ? "s" : ""}!
        </p>
      )}

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
        {!isDaily && (
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
        )}
      </div>
    </div>
  );
}
