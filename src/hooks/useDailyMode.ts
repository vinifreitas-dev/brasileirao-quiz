import { useState, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { getDailyChallenge, hasPlayedToday, saveDailyScore, getUserScore } from "../lib/daily";
import { getPendingScore, clearPendingScore } from "../lib/pendingScore";

export interface DailyLoadResult {
  config: unknown;
  alreadyPlayed: boolean;
  previousScore: number | null;
}

interface UseDailyModeReturn {
  mode: "daily" | "practice";
  setMode: (mode: "daily" | "practice") => void;
  challengeId: string | null;
  alreadyPlayed: boolean;
  dailyUnavailable: boolean;
  loadingDaily: boolean;
  loadDailyChallenge: (gameType: string) => Promise<DailyLoadResult | null>;
  saveScore: (params: { score: number; completed: boolean; attempts: number; timeSeconds?: number }) => Promise<boolean>;
}

export function useDailyMode(): UseDailyModeReturn {
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [dailyUnavailable, setDailyUnavailable] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const user = useAuthStore((s) => s.user);

  const loadDailyChallenge = useCallback(async (
    gameType: string
  ): Promise<DailyLoadResult | null> => {
    setLoadingDaily(true);
    setAlreadyPlayed(false);
    setDailyUnavailable(false);

    const challenge = await getDailyChallenge(gameType);

    if (!challenge) {
      setDailyUnavailable(true);
      setLoadingDaily(false);
      return null;
    }

    setChallengeId(challenge.id);

    let played = false;
    let previousScore: number | null = null;

    if (!user) {
      const pending = getPendingScore(gameType);
      if (pending) {
        setAlreadyPlayed(true);
        setLoadingDaily(false);
        return { config: challenge.config, alreadyPlayed: true, previousScore: pending.score };
      }
    }

    if (user) {
      played = await hasPlayedToday(user.id, challenge.id);

      if (played) {
        const prev = await getUserScore(user.id, challenge.id);
        previousScore = prev?.score ?? null;
      } else {
        // Verificar se há score pendente de quando era anônimo
        const pending = getPendingScore(gameType);
        if (pending) {
          const saved = await saveDailyScore({
            userId: user.id,
            challengeId: challenge.id,
            score: pending.score,
            completed: true,
            attempts: pending.attempts,
          });
          if (saved) {
            clearPendingScore(gameType);
            played = true;
            previousScore = pending.score;
          }
        }
      }

      setAlreadyPlayed(played);
    }

    setLoadingDaily(false);
    return { config: challenge.config, alreadyPlayed: played, previousScore };
  }, [user]);

  const saveScore = useCallback(async (params: {
    score: number;
    completed: boolean;
    attempts: number;
    timeSeconds?: number;
  }): Promise<boolean> => {
    if (!user || !challengeId || mode !== "daily") return false;

    return saveDailyScore({
      userId: user.id,
      challengeId,
      score: params.score,
      completed: params.completed,
      attempts: params.attempts,
      timeSeconds: params.timeSeconds,
    });
  }, [user, challengeId, mode]);

  return {
    mode,
    setMode,
    challengeId,
    alreadyPlayed,
    dailyUnavailable,
    loadingDaily,
    loadDailyChallenge,
    saveScore,
  };
}
