import { useEffect, useRef } from "react";
import { useWordleStore } from "../hooks/useWordleGame";
import { getRandomPlayer } from "../utils";
import { WordleBoard } from "./WordleBoard";
import { WordleInput } from "./WordleInput";
import { WordleKeyboard } from "./WordleKeyboard";
import { WordleResult } from "./WordleResult";
import { DailyModeToggle } from "../../../components/ui/DailyModeToggle";
import { useDailyMode } from "../../../hooks/useDailyMode";

/** Gera config para o desafio diário do Wordle (salva o player_id) */
async function generateWordleConfig() {
  const player = await getRandomPlayer();
  if (!player) return null;
  return { player_id: player.id };
}

export function WordlePage() {
  const answer = useWordleStore((s) => s.answer);
  const loading = useWordleStore((s) => s.loading);
  const completed = useWordleStore((s) => s.completed);
  const won = useWordleStore((s) => s.won);
  const guesses = useWordleStore((s) => s.guesses);
  const guessesLeft = useWordleStore((s) => s.guessesLeft);
  const startGame = useWordleStore((s) => s.startGame);
  const startFromConfig = useWordleStore((s) => s.startFromConfig);
  const resetGame = useWordleStore((s) => s.resetGame);

  const daily = useDailyMode();
  const initialized = useRef(false);

  useEffect(() => {
    async function load() {
      resetGame();
      if (daily.mode === "daily") {
        const config = await daily.loadDailyChallenge("wordle", generateWordleConfig);
        if (config) await startFromConfig(config as { player_id: string });
      } else {
        await startGame();
      }
    }
    if (!initialized.current) {
      initialized.current = true;
      load();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const modeRef = useRef(daily.mode);
  useEffect(() => {
    if (modeRef.current === daily.mode) return;
    modeRef.current = daily.mode;
    async function reload() {
      resetGame();
      if (daily.mode === "daily") {
        const config = await daily.loadDailyChallenge("wordle", generateWordleConfig);
        if (config) await startFromConfig(config as { player_id: string });
      } else {
        await startGame();
      }
    }
    reload();
  }, [daily.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (completed && daily.mode === "daily") {
      daily.saveScore({
        score: won ? 6 - guesses.length + 1 : 0,
        completed: true,
        attempts: guesses.length,
      });
    }
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || daily.loadingDaily) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-lg text-surface-400">Escolhendo um jogador...</p>
      </div>
    );
  }

  if (!answer) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-surface-300">Não foi possível carregar o jogo.</p>
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
      <h1 className="mb-2 text-2xl font-bold text-surface-50 sm:text-3xl">
        🔤 Wordle Boleiro
      </h1>
      <p className="mb-4 max-w-md text-center text-sm text-surface-400">
        Adivinhe o nome do jogador em {guessesLeft} tentativas.{" "}
        <span style={{ color: "#22c55e" }}>Verde</span> = letra certa no lugar certo,{" "}
        <span style={{ color: "#fbbf24" }}>amarelo</span> = letra certa no lugar errado,{" "}
        <span style={{ color: "#64748b" }}>cinza</span> = letra errada.
      </p>

      <DailyModeToggle
        mode={daily.mode}
        onChangeMode={daily.setMode}
        alreadyPlayed={daily.alreadyPlayed}
      />

      <WordleBoard />
      <WordleInput />
      <WordleKeyboard />
      <WordleResult />
    </div>
  );
}
