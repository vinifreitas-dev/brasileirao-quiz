import { useState } from "react";
import { useWordleStore } from "../hooks/useWordleGame";

export function WordleResult() {
  const completed = useWordleStore((s) => s.completed);
  const won = useWordleStore((s) => s.won);
  const answer = useWordleStore((s) => s.answer);
  const guesses = useWordleStore((s) => s.guesses);
  const resetGame = useWordleStore((s) => s.resetGame);
  const startGame = useWordleStore((s) => s.startGame);
  const [copied, setCopied] = useState(false);

  if (!completed || !answer) return null;

  // Gerar emojis para compartilhamento
  const emojiLines = guesses.map((guess) =>
    guess.letters
      .map((l) => {
        if (l.status === "correct") return "🟩";
        if (l.status === "present") return "🟨";
        return "⬛";
      })
      .join("")
  ).join("\n");

  const shareText = `🔤 Brasileirão Quiz - Wordle\n${won ? guesses.length : "X"}/6\n\n${emojiLines}`;

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
        {won ? "🎉 Acertou!" : "😔 Não foi dessa vez!"}
      </h3>

      {/* Mostrar o jogador correto */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {answer.photo_url && (
          <img
            src={answer.photo_url}
            alt={answer.name}
            style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover" }}
          />
        )}
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#22c55e" }}>{answer.name}</p>
          <p style={{ fontSize: "13px", color: "#94a3b8" }}>{answer.full_name}</p>
          <p style={{ fontSize: "12px", color: "#64748b" }}>
            {answer.position} · {answer.nationality}
          </p>
        </div>
      </div>

      {won && (
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>
          Você acertou em {guesses.length} tentativa{guesses.length !== 1 ? "s" : ""}!
        </p>
      )}

      <pre style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", fontSize: "16px", lineHeight: 1.6 }}>
        {emojiLines}
      </pre>

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
