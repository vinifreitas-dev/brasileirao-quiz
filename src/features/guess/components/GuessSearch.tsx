import { useState, useEffect } from "react";
import { useGuessStore } from "../hooks/useGuessGame";

export function GuessSearch() {
  const searchQuery = useGuessStore((s) => s.searchQuery);
  const searchResults = useGuessStore((s) => s.searchResults);
  const searching = useGuessStore((s) => s.searching);
  const completed = useGuessStore((s) => s.completed);
  const guessesLeft = useGuessStore((s) => s.guessesLeft);
  const setSearchQuery = useGuessStore((s) => s.setSearchQuery);
  const searchPlayers = useGuessStore((s) => s.searchPlayers);
  const submitGuess = useGuessStore((s) => s.submitGuess);

  const [showResults, setShowResults] = useState(false);

  // Debounce search
  useEffect(() => {
    if (searchQuery.length < 2) {
      return;
    }
    const timer = setTimeout(() => {
      searchPlayers();
      setShowResults(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPlayers]);

  if (completed) return null;

  return (
    <div style={{ width: "100%", maxWidth: "400px", position: "relative", marginTop: "16px" }}>
      <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "8px", textAlign: "center" }}>
        Tentativas restantes: <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{guessesLeft}</span>
      </p>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
        placeholder="Quem é o jogador? Digite para buscar..."
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "10px",
          border: "2px solid #334155",
          backgroundColor: "#1e293b",
          color: "#e2e8f0",
          fontSize: "15px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {/* Resultados da busca */}
      {showResults && searchResults.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            borderRadius: "10px",
            border: "1px solid #334155",
            backgroundColor: "#0f172a",
            zIndex: 10,
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {searchResults.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                submitGuess(player.id, player.name);
                setShowResults(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                textAlign: "left",
                border: "none",
                borderBottom: "1px solid #1e293b",
                backgroundColor: "transparent",
                color: "#e2e8f0",
                fontSize: "14px",
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#1e293b"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              {player.photo_url ? (
                <img
                  src={player.photo_url}
                  alt={player.name}
                  style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ⚽
                </div>
              )}
              <span style={{ fontWeight: 500 }}>{player.name}</span>
            </button>
          ))}
        </div>
      )}

      {searching && (
        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", textAlign: "center" }}>
          Buscando...
        </p>
      )}
    </div>
  );
}
