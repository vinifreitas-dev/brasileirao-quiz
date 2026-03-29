/**
 * Gerencia scores pendentes para usuários anônimos.
 *
 * Fluxo:
 * 1. Usuário anônimo completa desafio diário
 * 2. Score é armazenado aqui (sessionStorage)
 * 3. Usuário faz login
 * 4. Na próxima abertura do jogo, o score pendente é salvo automaticamente
 */

import { getTodayDate } from "./daily";

export interface PendingScore {
  gameType: string;
  score: number;
  attempts: number;
  date: string; // YYYY-MM-DD BRT
}

export function storePendingScore(
  gameType: string,
  score: number,
  attempts: number
): void {
  const pending: PendingScore = {
    gameType,
    score,
    attempts,
    date: getTodayDate(),
  };
  sessionStorage.setItem(`pending_score_${gameType}`, JSON.stringify(pending));
}

export function getPendingScore(gameType: string): PendingScore | null {
  try {
    const raw = sessionStorage.getItem(`pending_score_${gameType}`);
    if (!raw) return null;

    const pending: PendingScore = JSON.parse(raw);

    // Descartar se for de outro dia
    if (pending.date !== getTodayDate()) {
      clearPendingScore(gameType);
      return null;
    }

    return pending;
  } catch {
    return null;
  }
}

export function clearPendingScore(gameType: string): void {
  sessionStorage.removeItem(`pending_score_${gameType}`);
}
