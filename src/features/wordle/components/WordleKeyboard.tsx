import { useWordleStore } from "../hooks/useWordleGame";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const keyColors: Record<string, { bg: string; text: string }> = {
  correct: { bg: "rgba(34, 197, 94, 0.8)", text: "#fff" },
  present: { bg: "rgba(251, 191, 36, 0.8)", text: "#fff" },
  absent: { bg: "rgba(30, 41, 59, 0.8)", text: "#64748b" },
  unused: { bg: "#334155", text: "#e2e8f0" },
};

export function WordleKeyboard() {
  const keyboardState = useWordleStore((s) => s.keyboardState);
  const setInput = useWordleStore((s) => s.setInput);
  const currentInput = useWordleStore((s) => s.currentInput);
  const submitGuess = useWordleStore((s) => s.submitGuess);
  const completed = useWordleStore((s) => s.completed);

  if (completed) return null;

  function handleKey(key: string) {
    if (key === "ENTER") {
      submitGuess();
    } else if (key === "⌫") {
      setInput(currentInput.slice(0, -1));
    } else {
      setInput(currentInput + key);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", marginTop: "16px" }}>
      {KEYBOARD_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: "flex", gap: "4px" }}>
          {row.map((key) => {
            const state = keyboardState[key.toLowerCase()] || "unused";
            const colors = keyColors[state];
            const isWide = key === "ENTER" || key === "⌫";

            return (
              <button
                key={key}
                onClick={() => handleKey(key)}
                style={{
                  width: isWide ? "60px" : "36px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: colors.bg,
                  color: colors.text,
                  fontSize: isWide ? "11px" : "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
