import { useState, useEffect, useRef } from "react";
import { useWordleStore } from "../hooks/useWordleGame";
import { searchWordlePlayers } from "../utils";

export function WordleInput() {
  const currentInput = useWordleStore((s) => s.currentInput);
  const setInput = useWordleStore((s) => s.setInput);
  const submitGuess = useWordleStore((s) => s.submitGuess);
  const error = useWordleStore((s) => s.error);
  const completed = useWordleStore((s) => s.completed);

  const [suggestions, setSuggestions] = useState<Array<{ name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce na busca de sugestões
  useEffect(() => {
    if (currentInput.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await searchWordlePlayers(currentInput);
      setSuggestions(results);
      setShowSuggestions(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentInput]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submitGuess();
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  function selectSuggestion(name: string) {
    setInput(name);
    setShowSuggestions(false);
    // Submit automaticamente ao selecionar
    setTimeout(() => {
      useWordleStore.getState().submitGuess();
    }, 100);
  }

  if (completed) return null;

  return (
    <div style={{ width: "100%", maxWidth: "400px", margin: "16px auto 0", position: "relative" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => currentInput.length >= 2 && setShowSuggestions(true)}
          placeholder="Digite o nome do jogador..."
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            border: error ? "1px solid #ef4444" : "1px solid #334155",
            backgroundColor: "#1e293b",
            color: "#e2e8f0",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={() => { submitGuess(); setShowSuggestions(false); }}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#16a34a",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Enviar
        </button>
      </div>

      {error && (
        <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", textAlign: "center" }}>
          {error}
        </p>
      )}

      {/* Sugestões de autocomplete */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            borderRadius: "8px",
            border: "1px solid #334155",
            backgroundColor: "#0f172a",
            zIndex: 10,
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => selectSuggestion(s.name)}
              style={{
                display: "block",
                width: "100%",
                padding: "8px 14px",
                textAlign: "left",
                border: "none",
                backgroundColor: "transparent",
                color: "#e2e8f0",
                fontSize: "14px",
                cursor: "pointer",
                borderBottom: i < suggestions.length - 1 ? "1px solid #1e293b" : "none",
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = "#1e293b"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
