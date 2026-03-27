import { Fragment } from "react";
import { useGridStore } from "../hooks/useGridGame";
import { GridCell } from "./GridCell";
import { PlayerSearch } from "./PlayerSearch";
import type { PlayerSearchResult } from "../types";

export function GridBoard() {
  const challenge = useGridStore((s) => s.challenge);
  const cells = useGridStore((s) => s.cells);
  const guessesLeft = useGridStore((s) => s.guessesLeft);
  const completed = useGridStore((s) => s.completed);
  const score = useGridStore((s) => s.score);
  const selectedCell = useGridStore((s) => s.selectedCell);
  const usedPlayerIds = useGridStore((s) => s.usedPlayerIds);
  const selectCell = useGridStore((s) => s.selectCell);
  const closeSearch = useGridStore((s) => s.closeSearch);
  const submitGuess = useGridStore((s) => s.submitGuess);

  if (!challenge) return null;

  function handlePlayerSelect(player: PlayerSearchResult) {
    submitGuess(player.id, player.name, player.photo_url);
  }

  return (
    <div className="w-full" style={{ maxWidth: "500px" }}>
      {/* Placar */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-surface-400">
          Tentativas: <span className="font-bold text-surface-100">{guessesLeft}</span>
        </span>
        <span className="text-surface-400">
          Acertos: <span className="font-bold text-correct">{score}</span>
          <span className="text-surface-600">/9</span>
        </span>
      </div>

      {/*
        Grid 4x4 com estilo inline para garantir que o layout funcione.
        Coluna 1 = headers dos clubes (menor)
        Colunas 2-4 = células do jogo (iguais)
      */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr 1fr 1fr",
          gap: "8px",
        }}
      >
        {/* ---- Linha 0: headers das colunas ---- */}
        {/* Canto superior esquerdo vazio */}
        <div />

        {/* 3 critérios de coluna */}
        {challenge.columns.map((col, i) => (
          <div
            key={`col-${i}`}
            className="flex items-end justify-center pb-2 text-center"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-accent-400 sm:text-sm">
              {col.label}
            </span>
          </div>
        ))}

        {/* ---- Linhas 1-3: header do clube + 3 células ---- */}
        {challenge.rows.map((row, rowIdx) => (
          <Fragment key={`row-${rowIdx}`}>
            {/* Header: escudo + nome do clube */}
            <div className="flex flex-col items-center justify-center gap-1">
              {row.imageUrl && (
                <img
                  src={row.imageUrl}
                  alt={row.label}
                  className="h-10 w-10 object-contain"
                />
              )}
              <span className="text-center text-xs font-semibold leading-tight text-surface-200">
                {row.label}
              </span>
            </div>

            {/* 3 células do jogo */}
            {cells[rowIdx].map((cell, colIdx) => (
              <GridCell
                key={`cell-${rowIdx}-${colIdx}`}
                cell={cell}
                onClick={() => selectCell(rowIdx, colIdx)}
                disabled={completed}
              />
            ))}
          </Fragment>
        ))}
      </div>

      {/* Legenda explicativa */}
      {!completed && (
        <div className="mt-4 rounded-lg bg-surface-900 p-3 text-center text-xs text-surface-500">
          <p>
            Cada célula precisa de um jogador que jogou no{" "}
            <span className="text-surface-300">clube da linha</span> e atende ao{" "}
            <span className="text-accent-400">critério da coluna</span>.
          </p>
          <p className="mt-1">Clique em <span className="text-surface-300">+</span> para buscar um jogador.</p>
        </div>
      )}

      {/* Modal de busca */}
      {selectedCell && (
        <PlayerSearch
          excludeIds={usedPlayerIds}
          onSelect={handlePlayerSelect}
          onClose={closeSearch}
        />
      )}
    </div>
  );
}
