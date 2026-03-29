import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWordleStore } from "../hooks/useWordleGame";
import { WordleBoard } from "./WordleBoard";
import { WordleInput } from "./WordleInput";
import { WordleKeyboard } from "./WordleKeyboard";
import { WordleResult } from "./WordleResult";
import { DailyModeToggle } from "../../../components/ui/DailyModeToggle";
import { LoginCTA } from "../../../components/ui/LoginCTA";
import { useDailyMode } from "../../../hooks/useDailyMode";
import { useAuthStore } from "../../../stores/authStore";
import { storePendingScore, getPendingScore } from "../../../lib/pendingScore";
import { calcWordleScore } from "../../../lib/scoring";

export function WordlePage() {
  const answer = useWordleStore((s) => s.answer);
  const loading = useWordleStore((s) => s.loading);
  const completed = useWordleStore((s) => s.completed);
  const guessesLeft = useWordleStore((s) => s.guessesLeft);
  const startGame = useWordleStore((s) => s.startGame);
  const startFromConfig = useWordleStore((s) => s.startFromConfig);
  const resetGame = useWordleStore((s) => s.resetGame);

  const daily = useDailyMode();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const initialized = useRef(false);
  const [showLoginCTA, setShowLoginCTA] = useState(false);

  useEffect(() => {
    async function load() {
      resetGame();
      if (daily.mode === "daily") {
        const result = await daily.loadDailyChallenge("wordle");
        if (result) await startFromConfig(result.config as { player_id: string });
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
    setShowLoginCTA(false);

    async function reload() {
      resetGame();
      if (daily.mode === "daily") {
        const result = await daily.loadDailyChallenge("wordle");
        if (result) await startFromConfig(result.config as { player_id: string });
      } else {
        await startGame();
      }
    }
    reload();
  }, [daily.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!completed || daily.mode !== "daily") return;

    const state = useWordleStore.getState();
    const attempts = state.guesses.length;
    const finalScore = calcWordleScore({ won: state.won, attempts, timeSeconds: state.elapsedSeconds });

    if (!user) {
      if (!getPendingScore("wordle")) {
        storePendingScore("wordle", finalScore, attempts);
      }
      setShowLoginCTA(true);
      return;
    }

    daily.saveScore({ score: finalScore, completed: true, attempts, timeSeconds: state.elapsedSeconds });
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || daily.loadingDaily) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-lg text-surface-400">Escolhendo um jogador...</p>
      </div>
    );
  }

  if (daily.dailyUnavailable && daily.mode === "daily") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-6">
        <h1 className="mb-2 text-2xl font-bold text-surface-50 sm:text-3xl">🔤 Wordle Boleiro</h1>
        <DailyModeToggle mode={daily.mode} onChangeMode={daily.setMode} />
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-5xl">⏳</p>
          <p className="text-lg font-medium text-surface-200">Desafio de hoje ainda não disponível.</p>
          <p className="text-sm text-surface-400">O desafio é gerado automaticamente à meia-noite (BRT). Tente novamente em breve ou jogue no modo Prática.</p>
        </div>
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
      <WordleResult isDaily={daily.mode === "daily"} />

      {showLoginCTA && (
        <LoginCTA onLogin={() => navigate("/auth?redirect=/wordle")} onClose={() => setShowLoginCTA(false)} />
      )}
    </div>
  );
}
