import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGuessStore } from "../hooks/useGuessGame";
import { HintCard } from "./HintCard";
import { GuessSearch } from "./GuessSearch";
import { GuessResult } from "./GuessResult";
import { DailyModeToggle } from "../../../components/ui/DailyModeToggle";
import { LoginCTA } from "../../../components/ui/LoginCTA";
import { useDailyMode } from "../../../hooks/useDailyMode";
import { useAuthStore } from "../../../stores/authStore";
import { storePendingScore, getPendingScore } from "../../../lib/pendingScore";
import { calcGuessScore } from "../../../lib/scoring";

export function GuessPage() {
  const player = useGuessStore((s) => s.player);
  const hints = useGuessStore((s) => s.hints);
  const hintsRevealed = useGuessStore((s) => s.hintsRevealed);
  const completed = useGuessStore((s) => s.completed);
  const loading = useGuessStore((s) => s.loading);
  const startGame = useGuessStore((s) => s.startGame);
  const startFromConfig = useGuessStore((s) => s.startFromConfig);
  const resetGame = useGuessStore((s) => s.resetGame);
  const revealHint = useGuessStore((s) => s.revealHint);

  const daily = useDailyMode();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const initialized = useRef(false);
  const [showLoginCTA, setShowLoginCTA] = useState(false);

  useEffect(() => {
    async function load() {
      resetGame();
      if (daily.mode === "daily") {
        const result = await daily.loadDailyChallenge("guess");
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
        const result = await daily.loadDailyChallenge("guess");
        if (result) await startFromConfig(result.config as { player_id: string });
      } else {
        await startGame();
      }
    }
    reload();
  }, [daily.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!completed || daily.mode !== "daily") return;

    const state = useGuessStore.getState();
    const attempts = 3 - state.guessesLeft;
    const finalScore = calcGuessScore({
      won: state.won,
      hintsRevealed: state.hintsRevealed,
      timeSeconds: state.elapsedSeconds,
    });

    if (!user) {
      if (!getPendingScore("guess")) {
        storePendingScore("guess", finalScore, attempts);
      }
      setShowLoginCTA(true);
      return;
    }

    daily.saveScore({ score: finalScore, completed: true, attempts, timeSeconds: state.elapsedSeconds });
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || daily.loadingDaily) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-lg text-surface-400">Escolhendo um jogador misterioso...</p>
      </div>
    );
  }

  if (daily.dailyUnavailable && daily.mode === "daily") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-6">
        <h1 className="mb-2 text-2xl font-bold text-surface-50 sm:text-3xl">🕵️ Quem é o Jogador?</h1>
        <DailyModeToggle mode={daily.mode} onChangeMode={daily.setMode} />
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-5xl">⏳</p>
          <p className="text-lg font-medium text-surface-200">Desafio de hoje ainda não disponível.</p>
          <p className="text-sm text-surface-400">O desafio é gerado automaticamente à meia-noite (BRT). Tente novamente em breve ou jogue no modo Prática.</p>
        </div>
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
      <GuessResult isDaily={daily.mode === "daily"} />

      {showLoginCTA && (
        <LoginCTA onLogin={() => navigate("/auth?redirect=/guess")} onClose={() => setShowLoginCTA(false)} />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
