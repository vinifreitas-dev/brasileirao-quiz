import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGridStore } from "../hooks/useGridGame";
import { GridBoard } from "./GridBoard";
import { GridResult } from "./GridResult";
import { DailyModeToggle } from "../../../components/ui/DailyModeToggle";
import { useDailyMode } from "../../../hooks/useDailyMode";
import { useAuthStore } from "../../../stores/authStore";
import { storePendingScore, getPendingScore } from "../../../lib/pendingScore";
import { calcGridScore } from "../../../lib/scoring";
import { LoginCTA } from "../../../components/ui/LoginCTA";
import type { GridChallenge } from "../types";

export function GridPage() {
  const challenge = useGridStore((s) => s.challenge);
  const loading = useGridStore((s) => s.loading);
  const completed = useGridStore((s) => s.completed);
  const startGame = useGridStore((s) => s.startGame);
  const startFromConfig = useGridStore((s) => s.startFromConfig);
  const restoreGame = useGridStore((s) => s.restoreGame);
  const resetGame = useGridStore((s) => s.resetGame);

  const daily = useDailyMode();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const initialized = useRef(false);
  const [saveError, setSaveError] = useState(false);
  const [showLoginCTA, setShowLoginCTA] = useState(false);

  useEffect(() => {
    async function load() {
      if (daily.mode === "daily") {
        const result = await daily.loadDailyChallenge("grid");
        if (result) {
          if (result.alreadyPlayed) {
            if (!useGridStore.getState().completed) {
              restoreGame(result.config as GridChallenge, result.previousScore ?? 0);
            }
          } else {
            resetGame();
            startFromConfig(result.config as GridChallenge);
          }
        }
      } else {
        resetGame();
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
    setSaveError(false);

    async function reload() {
      if (daily.mode === "daily") {
        const result = await daily.loadDailyChallenge("grid");
        if (result) {
          if (result.alreadyPlayed) {
            if (!useGridStore.getState().completed) {
              restoreGame(result.config as GridChallenge, result.previousScore ?? 0);
            }
          } else {
            resetGame();
            startFromConfig(result.config as GridChallenge);
          }
        }
      } else {
        resetGame();
        await startGame();
      }
    }
    reload();
  }, [daily.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!completed || daily.mode !== "daily") return;

    const state = useGridStore.getState();
    const finalScore = calcGridScore({ correct: state.score, timeSeconds: state.elapsedSeconds });
    const attempts = 9 - state.guessesLeft;

    if (!user) {
      if (!getPendingScore("grid")) {
        storePendingScore("grid", finalScore, attempts);
      }
      setShowLoginCTA(true);
      return;
    }

    setSaveError(false);
    daily.saveScore({
      score: finalScore,
      completed: true,
      attempts,
      timeSeconds: state.elapsedSeconds,
    }).then((success) => {
      if (!success) setSaveError(true);
    });
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || daily.loadingDaily) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-lg text-surface-400">Carregando desafio...</p>
      </div>
    );
  }

  if (daily.dailyUnavailable && daily.mode === "daily") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-6">
        <h1 className="mb-2 text-2xl font-bold text-surface-50 sm:text-3xl">🟩 Grid Brasileirão</h1>
        <DailyModeToggle mode={daily.mode} onChangeMode={daily.setMode} />
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-5xl">⏳</p>
          <p className="text-lg font-medium text-surface-200">Desafio de hoje ainda não disponível.</p>
          <p className="text-sm text-surface-400">O desafio é gerado automaticamente à meia-noite (BRT). Tente novamente em breve ou jogue no modo Prática.</p>
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
      <h1 className="mb-2 text-2xl font-bold text-surface-50 sm:text-3xl">
        🟩 Grid Brasileirão
      </h1>
      <p className="mb-4 max-w-md text-center text-sm text-surface-400">
        Encontre um jogador que atenda ao critério da linha e da coluna. Você tem 9 tentativas.
      </p>

      <DailyModeToggle
        mode={daily.mode}
        onChangeMode={daily.setMode}
        alreadyPlayed={daily.alreadyPlayed}
      />

      {saveError && (
        <p className="mb-3 text-sm text-red-400">
          ⚠️ Erro ao salvar resultado. Tente novamente.
        </p>
      )}

      <GridBoard />
      <GridResult isDaily={daily.mode === "daily"} />

      {showLoginCTA && (
        <LoginCTA onLogin={() => navigate("/auth?redirect=/grid")} onClose={() => setShowLoginCTA(false)} />
      )}
    </div>
  );
}

