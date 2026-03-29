import { useState } from "react";
import { useGridStore } from "../hooks/useGridGame";

export function GridResult({ isDaily }: { isDaily?: boolean }) {
  const score = useGridStore((s) => s.score);
  const cells = useGridStore((s) => s.cells);
  const completed = useGridStore((s) => s.completed);
  const resetGame = useGridStore((s) => s.resetGame);
  const startGame = useGridStore((s) => s.startGame);
  const [copied, setCopied] = useState(false);

  if (!completed) return null;

  // Gerar emoji grid para compartilhamento (estilo Wordle)
  const emojiGrid = cells
    .map((row) =>
      row.map((cell) => {
        if (cell.status === "correct") return "🟩";
        if (cell.status === "wrong") return "🟥";
        return "⬛";
      }).join("")
    )
    .join("\n");

  const shareText = `⚽ Brasileirão Quiz - Grid\n${score}/9\n\n${emojiGrid}`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePlayAgain() {
    resetGame();
    await startGame();
  }

  let message = "";
  if (score === 9) message = "🏆 Perfeito! Você é craque!";
  else if (score >= 7) message = "⭐ Excelente!";
  else if (score >= 5) message = "👏 Bom resultado!";
  else if (score >= 3) message = "💪 Pode melhorar!";
  else message = "📚 Hora de estudar o Brasileirão!";

  return (
    <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-surface-700 bg-surface-900 p-6">
      <h3 className="text-2xl font-bold text-surface-50">{message}</h3>

      <div className="text-center">
        <p className="text-4xl font-bold text-primary-400">{score}/9</p>
        <p className="mt-1 text-sm text-surface-400">acertos</p>
      </div>

      <pre className="rounded-lg bg-surface-800 p-3 text-center text-lg leading-relaxed">
        {emojiGrid}
      </pre>

      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
        >
          {copied ? "Copiado!" : "Compartilhar"}
        </button>
        {!isDaily && (
          <button
            onClick={handlePlayAgain}
            className="rounded-lg border border-surface-600 px-4 py-2 font-medium text-surface-200 transition-colors hover:bg-surface-800"
          >
            Jogar novamente
          </button>
        )}
      </div>
    </div>
  );
}
