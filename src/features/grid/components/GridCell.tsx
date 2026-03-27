import type { GridCellState } from "../types";

interface GridCellProps {
  cell: GridCellState;
  onClick: () => void;
  disabled: boolean;
}

export function GridCell({ cell, onClick, disabled }: GridCellProps) {
  const isClickable = cell.status === "empty" && !disabled;

  // Cores por estado
  const borderColor = {
    empty: isClickable ? "#475569" : "#334155",
    correct: "rgba(34, 197, 94, 0.5)",
    wrong: "rgba(239, 68, 68, 0.5)",
  }[cell.status];

  const bgColor = {
    empty: isClickable ? "rgba(30, 41, 59, 0.5)" : "rgba(30, 41, 59, 0.3)",
    correct: "rgba(34, 197, 94, 0.1)",
    wrong: "rgba(239, 68, 68, 0.1)",
  }[cell.status];

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      style={{
        aspectRatio: "1 / 1",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px",
        border: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        cursor: isClickable ? "pointer" : "default",
        transition: "all 0.2s",
        padding: "4px",
        overflow: "hidden",
      }}
    >
      {cell.status === "empty" ? (
        <span style={{ fontSize: "24px", color: "#475569" }}>+</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          {cell.playerPhoto ? (
            <img
              src={cell.playerPhoto}
              alt={cell.playerName || ""}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
                filter: cell.status === "wrong" ? "grayscale(1) opacity(0.5)" : "none",
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
                backgroundColor: cell.status === "correct" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
              }}
            >
              {cell.status === "correct" ? "✅" : "❌"}
            </div>
          )}
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textAlign: "center",
              lineHeight: 1.2,
              color: cell.status === "correct" ? "#22c55e" : "#ef4444",
              maxWidth: "100%",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {cell.playerName}
          </span>
        </div>
      )}
    </button>
  );
}
