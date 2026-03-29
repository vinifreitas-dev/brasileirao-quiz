// ============================================================
// Sistema de Desafio Diário — CLIENT SIDE (somente leitura)
// ============================================================
// Clientes NUNCA criam desafios. A criação é responsabilidade
// da Edge Function "generate-daily-challenges" que roda às
// 00h00 BRT via cron.
//
// Fluxo:
//   Edge Function (cron 03h00 UTC) → INSERT daily_challenges
//   Cliente (frontend) → SELECT daily_challenges (read-only)
// ============================================================

import { supabase } from "./supabase";

/** Retorna a data de hoje no formato YYYY-MM-DD (horário de Brasília) */
export function getTodayDate(): string {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const local = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000);
  return local.toISOString().split("T")[0];
}

/**
 * Busca o desafio diário de um tipo de jogo.
 * Retorna null se não existir para hoje (ainda não gerado pelo cron).
 */
export async function getDailyChallenge(gameType: string): Promise<{
  id: string;
  config: unknown;
} | null> {
  const today = getTodayDate();

  const { data, error } = await supabase
    .from("daily_challenges")
    .select("id, config")
    .eq("game_type", gameType)
    .eq("challenge_date", today)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Verifica se o usuário já jogou o desafio diário.
 */
export async function hasPlayedToday(
  userId: string,
  challengeId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("user_scores")
    .select("id")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .maybeSingle();

  return !!data;
}

/**
 * Busca o score salvo do usuário para um desafio específico.
 */
export async function getUserScore(
  userId: string,
  challengeId: string
): Promise<{ score: number; attempts: number } | null> {
  const { data } = await supabase
    .from("user_scores")
    .select("score, attempts")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .maybeSingle();

  return data ?? null;
}

/**
 * Salva o score do usuário no desafio diário.
 */
export async function saveDailyScore(params: {
  userId: string;
  challengeId: string;
  score: number;
  completed: boolean;
  attempts: number;
  timeSeconds?: number;
  resultData?: Record<string, unknown>;
}): Promise<boolean> {
  const { error } = await supabase.from("user_scores").upsert(
    {
      user_id: params.userId,
      challenge_id: params.challengeId,
      score: params.score,
      completed: params.completed,
      attempts: params.attempts,
      time_seconds: params.timeSeconds ?? null,
      result_data: params.resultData ?? {},
    },
    { onConflict: "user_id,challenge_id" }
  );

  if (error) {
    console.error("Erro ao salvar score:", error.message);
    return false;
  }
  return true;
}
