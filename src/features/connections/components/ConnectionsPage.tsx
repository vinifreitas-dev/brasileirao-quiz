import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnectionsStore } from "../hooks/useConnectionsGame";
import { ConnectionsBoard } from "./ConnectionsBoard";
import { ConnectionsResult } from "./ConnectionsResult";
import { DailyModeToggle } from "../../../components/ui/DailyModeToggle";
import { LoginCTA } from "../../../components/ui/LoginCTA";
import { useDailyMode } from "../../../hooks/useDailyMode";
import { useAuthStore } from "../../../stores/authStore";
import { storePendingScore, getPendingScore } from "../../../lib/pendingScore";
import { calcConnectionsScore } from "../../../lib/scoring";
import type { ConnectionsChallenge } from "../types";

export function ConnectionsPage() {
  const challenge = useConnectionsStore((s) => s.challenge);
  const loading = useConnectionsStore((s) => s.loading);
  const completed = useConnectionsStore((s) => s.completed);
  const startGame = useConnectionsStore((s) => s.startGame);
  const startFromConfig = useConnectionsStore((s) => s.startFromConfig);
  const resetGame = useConnectionsStore((s) => s.resetGame);

  const daily = useDailyMode();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const initialized = useRef(false);
  const [showLoginCTA, setShowLoginCTA] = useState(false);

  useEffect(() => {
    async function load() {
      resetGame();
      if (daily.mode === "daily") {
        const result = await daily.loadDailyChallenge("connections");
        if (result) startFromConfig(result.config as ConnectionsChallenge);
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
        const result = await daily.loadDailyChallenge("connections");
        if (result) startFromConfig(result.config as ConnectionsChallenge);
      } else {
        await startGame();
      }
    }
    reload();
  }, [daily.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!completed || daily.mode !== "daily") return;

    const state = useConnectionsStore.getState();
    const finalScore = calcConnectionsScore({
      groupsCorrect: state.correctGroupsCount,
      noErrors: state.livesLeft === 4,
      timeSeconds: state.elapsedSeconds,
    });
    const attempts = 4 - state.livesLeft;

    if (!user) {
      if (!getPendingScore("connections")) {
        storePendingScore("connections", finalScore, attempts);
      }
      setShowLoginCTA(true);
      return;
    }

    daily.saveScore({ score: finalScore, completed: true, attempts, timeSeconds: state.elapsedSeconds });
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || daily.loadingDaily) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-lg text-surface-400">Montando o desafio...</p>
      </div>
    );
  }

  if (daily.dailyUnavailable && daily.mode === "daily") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-6">
        <h1 className="mb-2 text-2xl font-bold text-surface-50 sm:text-3xl">🔗 Connections BR</h1>
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
        🔗 Connections BR
      </h1>
      <p className="mb-4 max-w-md text-center text-sm text-surface-400">
        Agrupe os 16 jogadores em 4 categorias de 4. Você tem 4 vidas.
      </p>

      <DailyModeToggle
        mode={daily.mode}
        onChangeMode={daily.setMode}
        alreadyPlayed={daily.alreadyPlayed}
      />

      <ConnectionsBoard />
      <ConnectionsResult isDaily={daily.mode === "daily"} />

      {showLoginCTA && (
        <LoginCTA onLogin={() => navigate("/auth?redirect=/connections")} onClose={() => setShowLoginCTA(false)} />
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
