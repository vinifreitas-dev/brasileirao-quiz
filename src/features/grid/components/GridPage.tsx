import { useEffect } from "react";
import { useGridStore } from "../hooks/useGridGame";
import { GridBoard } from "./GridBoard";
import { GridResult } from "./GridResult";

export function GridPage() {
  const challenge = useGridStore((s) => s.challenge);
  const loading = useGridStore((s) => s.loading);
  const startGame = useGridStore((s) => s.startGame);

  useEffect(() => {
    if (!challenge) {
      startGame();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-surface-400">Gerando desafio...</p>
          <p className="mt-2 text-sm text-surface-500">
            Montando um grid válido com dados do Brasileirão
          </p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-surface-300">Não foi possível gerar um desafio.</p>
          <button
            onClick={() => startGame()}
            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-6">
      {/* Título */}
      <h1 className="mb-2 text-2xl font-bold text-surface-50 sm:text-3xl">
        🟩 Grid Brasileirão
      </h1>

      {/* Instrução clara */}
      <p className="mb-6 max-w-md text-center text-sm text-surface-400">
        Encontre um jogador para cada célula que jogou no <span className="font-semibold text-surface-200">clube da linha</span> e se encaixe no <span className="font-semibold text-accent-400">critério da coluna</span>.
        Você tem 9 tentativas.
      </p>

      {/* Tabuleiro */}
      <GridBoard />

      {/* Resultado */}
      <GridResult />
    </div>
  );
}
