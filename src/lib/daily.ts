// ============================================
// Sistema de Desafio Diário
// ============================================
// Gerencia a criação e recuperação de desafios diários.
// Cada tipo de jogo tem 1 desafio por dia.
// O primeiro jogador a acessar no dia gera o desafio,
// todos os outros recebem o mesmo.
// ============================================

import { supabase } from "./supabase";

/** Retorna a data de hoje no formato YYYY-MM-DD (horário de Brasília) */
export function getTodayDate(): string {
  const now = new Date();
  // Ajustar para Brasília (UTC-3)
  const brasiliaOffset = -3 * 60;
  const local = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000);
  return local.toISOString().split("T")[0];
}

/**
 * Busca o desafio diário de um tipo de jogo.
 * Se não existir para hoje, retorna null.
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
 * Cria o desafio diário para um tipo de jogo.
 * Usa upsert para evitar duplicatas se dois jogadores
 * tentarem criar ao mesmo tempo (race condition).
 */
export async function createDailyChallenge(
  gameType: string,
  config: unknown
): Promise<{ id: string; config: unknown } | null> {
  const today = getTodayDate();

  const { data, error } = await supabase
    .from("daily_challenges")
    .upsert(
      {
        game_type: gameType,
        challenge_date: today,
        config,
      },
      { onConflict: "game_type,challenge_date" }
    )
    .select("id, config")
    .single();

  if (error) {
    console.error("Erro ao criar desafio diário:", error.message);
    // Se falhou o upsert, tenta buscar (pode ter sido criado por outro jogador)
    return getDailyChallenge(gameType);
  }

  return data;
}

/**
 * Busca ou cria o desafio do dia.
 * Se já existe, retorna. Se não, usa o generateFn para criar.
 */
export async function getOrCreateDailyChallenge(
  gameType: string,
  generateFn: () => Promise<unknown | null>
): Promise<{ id: string; config: unknown } | null> {
  // Tentar buscar existente
  const existing = await getDailyChallenge(gameType);
  if (existing) return existing;

  // Gerar novo
  const config = await generateFn();
  if (!config) return null;

  return createDailyChallenge(gameType, config);
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
    .single();

  return !!data;
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
      time_seconds: params.timeSeconds || null,
      result_data: params.resultData || {},
    },
    { onConflict: "user_id,challenge_id" }
  );

  if (error) {
    console.error("Erro ao salvar score:", error.message);
    return false;
  }
  return true;
}
