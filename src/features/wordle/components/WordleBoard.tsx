import { useWordleStore } from "../hooks/useWordleGame";
import type { WordleLetter } from "../types";

const MAX_GUESSES = 6;

// Cores por status da letra
const statusColors: Record<string, { bg: string; border: string }> = {
  correct: { bg: "rgba(34, 197, 94, 0.8)", border: "rgba(34, 197, 94, 0.9)" },
  present: { bg: "rgba(251, 191, 36, 0.8)", border: "rgba(251, 191, 36, 0.9)" },
  absent: { bg: "rgba(71, 85, 105, 0.6)", border: "rgba(71, 85, 105, 0.7)" },
  empty: { bg: "transparent", border: "#334155" },
};

export function WordleBoard() {
  const answer = useWordleStore((s) => s.answer);
  const guesses = useWordleStore((s) => s.guesses);
  const currentInput = useWordleStore((s) => s.currentInput);

  if (!answer) return null;

  const nameLength = answer.name.length;

  // Montar as linhas: palpites feitos + input atual + linhas vazias
  const rows: Array<{ letters: WordleLetter[]; isActive: boolean }> = [];

  // Linhas com palpites já feitos
  for (const guess of guesses) {
    // Pad or trim to match answer length for display
    const letters: WordleLetter[] = [];
    for (let i = 0; i < nameLength; i++) {
      if (i < guess.letters.length) {
        letters.push(guess.letters[i]);
      } else {
        letters.push({ char: "", status: "empty" });
      }
    }
    rows.push({ letters, isActive: false });
  }

  // Linha ativa (input atual) se o jogo não acabou
  if (guesses.length < MAX_GUESSES && !useWordleStore.getState().completed) {
    const activeLine: WordleLetter[] = [];
    for (let i = 0; i < nameLength; i++) {
      activeLine.push({
        char: currentInput[i]?.toUpperCase() || "",
        status: "empty",
      });
    }
    rows.push({ letters: activeLine, isActive: true });
  }

  // Linhas vazias restantes
  while (rows.length < MAX_GUESSES) {
    const emptyLine: WordleLetter[] = Array.from({ length: nameLength }, () => ({
      char: "",
      status: "empty" as const,
    }));
    rows.push({ letters: emptyLine, isActive: false });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
      {/* Dica: número de letras */}
      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>
        {nameLength} letras
      </p>

      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: "flex",
            gap: "4px",
          }}
        >
          {row.letters.map((letter, colIdx) => {
            const colors = statusColors[letter.status];
            return (
              <div
                key={colIdx}
                style={{
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  border: `2px solid ${row.isActive && colIdx === currentInput.length ? "#22c55e" : colors.border}`,
                  backgroundColor: colors.bg,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: letter.status === "empty" ? "#94a3b8" : "#fff",
                  transition: "all 0.3s",
                }}
              >
                {letter.char}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
