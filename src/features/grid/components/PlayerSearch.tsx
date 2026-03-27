import { useState, useEffect, useRef } from "react";
import { searchPlayers } from "../utils";
import type { PlayerSearchResult } from "../types";

interface PlayerSearchProps {
  excludeIds: string[];
  onSelect: (player: PlayerSearchResult) => void;
  onClose: () => void;
}

export function PlayerSearch({ excludeIds, onSelect, onClose }: PlayerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus no input quando abre
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce: espera 300ms após digitar antes de buscar
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const data = await searchPlayers(query, excludeIds);
      setResults(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, excludeIds]);

  // Fechar com Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-surface-700 bg-surface-900 p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-surface-100">Buscar jogador</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-200"
          >
            ✕
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite o nome do jogador..."
          className="mb-3 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-primary-500"
        />

        <div className="max-h-64 overflow-y-auto">
          {loading && (
            <p className="py-4 text-center text-sm text-surface-400">Buscando...</p>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="py-4 text-center text-sm text-surface-400">Nenhum jogador encontrado</p>
          )}

          {!loading && query.length < 2 && (
            <p className="py-4 text-center text-sm text-surface-500">Digite pelo menos 2 letras</p>
          )}

          {results.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelect(player)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-800"
            >
              {player.photo_url ? (
                <img
                  src={player.photo_url}
                  alt={player.name}
                  className="h-10 w-10 rounded-full bg-surface-700 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-700 text-lg">⚽</div>
              )}
              <div>
                <p className="font-medium text-surface-100">{player.name}</p>
                <p className="text-xs text-surface-400">{player.position} · {player.nationality}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
