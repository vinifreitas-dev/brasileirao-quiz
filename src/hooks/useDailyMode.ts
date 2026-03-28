import { useState, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { getOrCreateDailyChallenge, hasPlayedToday, saveDailyScore } from "../lib/daily";

interface UseDailyModeReturn {
  mode: "daily" | "practice";
  setMode: (mode: "daily" | "practice") => void;
  challengeId: string | null;
  alreadyPlayed: boolean;
  loadingDaily: boolean;
  /** Busca ou cria o desafio do dia. Retorna o config salvo. */
  loadDailyChallenge: (gameType: string, generateFn: () => Promise<unknown | null>) => Promise<unknown | null>;
  /** Salva o score do usuário (só funciona se logado e no modo daily) */
  saveScore: (params: { score: number; completed: boolean; attempts: number }) => Promise<void>;
}

export function useDailyMode(): UseDailyModeReturn {
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const user = useAuthStore((s) => s.user);

  const loadDailyChallenge = useCallback(async (
    gameType: string,
    generateFn: () => Promise<unknown | null>
  ): Promise<unknown | null> => {
    setLoadingDaily(true);
    setAlreadyPlayed(false);

    const challenge = await getOrCreateDailyChallenge(gameType, generateFn);
    if (!challenge) {
      setLoadingDaily(false);
      return null;
    }

    setChallengeId(challenge.id);

    // Verificar se o usuário já jogou hoje
    if (user) {
      const played = await hasPlayedToday(user.id, challenge.id);
      setAlreadyPlayed(played);
    }

    setLoadingDaily(false);
    return challenge.config;
  }, [user]);

  const saveScore = useCallback(async (params: {
    score: number;
    completed: boolean;
    attempts: number;
  }) => {
    if (!user || !challengeId || mode !== "daily") return;

    await saveDailyScore({
      userId: user.id,
      challengeId,
      score: params.score,
      completed: params.completed,
      attempts: params.attempts,
    });
  }, [user, challengeId, mode]);

  return {
    mode,
    setMode,
    challengeId,
    alreadyPlayed,
    loadingDaily,
    loadDailyChallenge,
    saveScore,
  };
}
