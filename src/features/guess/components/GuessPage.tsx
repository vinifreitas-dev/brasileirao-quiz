import { useEffect, useRef } from "react";
import { useGuessStore } from "../hooks/useGuessGame";
import { getRandomGuessPlayer } from "../utils";
import { HintCard } from "./HintCard";
import { GuessSearch } from "./GuessSearch";
import { GuessResult } from "./GuessResult";
import { DailyModeToggle } from "../../../components/ui/DailyModeToggle";
import { useDailyMode } from "../../../hooks/useDailyMode";

/** Gera config para o desafio diário (salva o player_id) */
async function generateGuessConfig() {
  const player = await getRandomGuessPlayer();
  if (!player) return null;
  return { player_id: player.id };
}

export function GuessPage() {
  const player = useGuessStore((s) => s.player);
  const hints = useGuessStore((s) => s.hints);
  const hintsRevealed = useGuessStore((s) => s.hintsRevealed);
  const completed = useGuessStore((s) => s.completed);
  const won = useGuessStore((s) => s.won);
  const loading = useGuessStore((s) => s.loading);
  const startGame = useGuessStore((s) => s.startGame);
  const startFromConfig = useGuessStore((s) => s.startFromConfig);
  const resetGame = useGuessStore((s) => s.resetGame);
  const revealHint = useGuessStore((s) => s.revealHint);

  const daily = useDailyMode();
  const initialized = useRef(false);

  useEffect(() => {
    async function load() {
      resetGame();
      if (daily.mode === "daily") {
        const config = await daily.loadDailyChallenge("guess", generateGuessConfig);
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
        const config = await daily.loadDailyChallenge("guess", generateGuessConfig);
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
        score: won ? hints.length - hintsRevealed + 1 : 0,
        completed: true,
        attempts: 3 - useGuessStore.getState().guessesLeft,
      });
    }
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || daily.loadingDaily) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-lg text-surface-400">Escolhendo um jogador misterioso...</p>
      </div>
    );
  }

  if (!player) {
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
        🕵️ Quem é o Jogador?
      </h1>
      <p className="mb-4 max-w-md text-center text-sm text-surface-400">
        Use as dicas para descobrir o jogador misterioso. Você tem 3 tentativas!
      </p>

      <DailyModeToggle
        mode={daily.mode}
        onChangeMode={daily.setMode}
        alreadyPlayed={daily.alreadyPlayed}
      />

      {/* Silhueta misteriosa */}
      {!completed && (
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: "#1e293b",
          border: "3px solid #334155",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "36px",
          marginBottom: "20px",
        }}>
          ❓
        </div>
      )}

      {/* Dicas */}
      {!completed && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          width: "100%",
          maxWidth: "400px",
        }}>
          {hints.map((hint, i) => (
            <HintCard
              key={i}
              hint={hint}
              index={i}
              canReveal={!hint.revealed && i === hintsRevealed}
              onReveal={revealHint}
            />
          ))}
        </div>
      )}

      <GuessSearch />
      <GuessResult />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
