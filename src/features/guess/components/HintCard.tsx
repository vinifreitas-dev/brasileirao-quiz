import type { Hint } from "../types";

interface HintCardProps {
  hint: Hint;
  index: number;
  canReveal: boolean;
  onReveal: () => void;
}

export function HintCard({ hint, index, canReveal, onReveal }: HintCardProps) {
  if (hint.revealed) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "10px",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          backgroundColor: "rgba(34, 197, 94, 0.08)",
          animation: "fadeIn 0.4s ease-out",
        }}
      >
        <span style={{ fontSize: "24px" }}>{hint.icon}</span>
        <div>
          <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {hint.label}
          </p>
          <p style={{ fontSize: "16px", color: "#e2e8f0", fontWeight: 700 }}>
            {hint.value}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={canReveal ? onReveal : undefined}
      disabled={!canReveal}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        borderRadius: "10px",
        border: "1px solid #334155",
        backgroundColor: canReveal ? "#1e293b" : "#0f172a",
        cursor: canReveal ? "pointer" : "not-allowed",
        opacity: canReveal ? 1 : 0.4,
        width: "100%",
        textAlign: "left",
        transition: "all 0.2s",
      }}
    >
      <span style={{ fontSize: "24px", filter: "grayscale(1) opacity(0.5)" }}>{hint.icon}</span>
      <div>
        <p style={{ fontSize: "11px", color: "#475569", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Dica {index + 1}
        </p>
        <p style={{ fontSize: "14px", color: "#475569", fontWeight: 500 }}>
          {canReveal ? "Clique para revelar" : "🔒 Bloqueada"}
        </p>
      </div>
    </button>
  );
}
