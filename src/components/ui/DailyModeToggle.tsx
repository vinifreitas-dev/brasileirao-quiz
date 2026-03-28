interface DailyModeToggleProps {
  mode: "daily" | "practice";
  onChangeMode: (mode: "daily" | "practice") => void;
  alreadyPlayed?: boolean;
}

export function DailyModeToggle({ mode, onChangeMode, alreadyPlayed }: DailyModeToggleProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
      <div style={{
        display: "flex",
        borderRadius: "10px",
        border: "1px solid #334155",
        overflow: "hidden",
      }}>
        <button
          onClick={() => onChangeMode("daily")}
          style={{
            padding: "8px 20px",
            border: "none",
            backgroundColor: mode === "daily" ? "#16a34a" : "transparent",
            color: mode === "daily" ? "#fff" : "#94a3b8",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          ⭐ Desafio do Dia
        </button>
        <button
          onClick={() => onChangeMode("practice")}
          style={{
            padding: "8px 20px",
            border: "none",
            borderLeft: "1px solid #334155",
            backgroundColor: mode === "practice" ? "#334155" : "transparent",
            color: mode === "practice" ? "#e2e8f0" : "#94a3b8",
            fontWeight: 500,
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          🔄 Prática
        </button>
      </div>

      {mode === "daily" && alreadyPlayed && (
        <p style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 500 }}>
          ✅ Você já jogou o desafio de hoje! Volte amanhã para um novo.
        </p>
      )}
    </div>
  );
}
