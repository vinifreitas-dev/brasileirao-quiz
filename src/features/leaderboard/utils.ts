import { supabase } from "../../lib/supabase";
import { getTodayDate } from "../../lib/daily";
import type { LeaderboardEntry, PlayerStats, GameFilter, TimeFilter } from "./types";

/**
 * Busca o ranking de um período e tipo de jogo.
 */
export async function fetchLeaderboard(
  gameFilter: GameFilter,
  timeFilter: TimeFilter
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from("daily_leaderboard")
    .select("username, score, attempts, game_type, challenge_date, played_at")
    .eq("completed", true);

  // Filtro por jogo
  if (gameFilter !== "all") {
    query = query.eq("game_type", gameFilter);
  }

  // Filtro por período
  if (timeFilter === "today") {
    const today = getTodayDate();
    query = query.eq("challenge_date", today);
  } else if (timeFilter === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    query = query.gte("challenge_date", weekAgo.toISOString().split("T")[0]);
  }

  query = query.limit(500);

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar leaderboard:", error.message, error);
  }

  if (!data) return [];

  type Row = {
    username: string;
    score: number;
    attempts: number;
    game_type: string;
    challenge_date: string;
    played_at: string;
  };

  const rows = data as Row[];

  // Para "today": ordenar individualmente por score desc, attempts asc
  if (timeFilter === "today") {
    return rows
      .sort((a, b) => b.score - a.score || a.attempts - b.attempts)
      .slice(0, 50)
      .map((entry, index) => ({ rank: index + 1, ...entry }));
  }

  // Para "week" e "alltime": agregar por username
  const map = new Map<string, { total_score: number; games_played: number }>();
  for (const row of rows) {
    const existing = map.get(row.username);
    if (existing) {
      existing.total_score += row.score;
      existing.games_played += 1;
    } else {
      map.set(row.username, { total_score: row.score, games_played: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([username, stats]) => ({
      username,
      score: stats.total_score,
      attempts: 0,
      games_played: stats.games_played,
      game_type: gameFilter === "all" ? "all" : gameFilter,
      challenge_date: "",
      played_at: "",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map((entry, index) => ({ rank: index + 1, ...entry }));
}

/**
 * Busca estatísticas agregadas dos melhores jogadores.
 */
export async function fetchTopPlayers(gameFilter: GameFilter): Promise<PlayerStats[]> {
  let query = supabase
    .from("daily_leaderboard")
    .select("username, score, game_type")
    .eq("completed", true);

  if (gameFilter !== "all") {
    query = query.eq("game_type", gameFilter);
  }

  const { data } = await query;
  if (!data) return [];

  // Agregar por jogador manualmente (Supabase não tem GROUP BY no client)
  const statsMap = new Map<string, {
    username: string;
    total_score: number;
    games_played: number;
    scores: number[];
  }>();

  for (const row of data as Array<{ username: string; score: number }>) {
    const existing = statsMap.get(row.username);
    if (existing) {
      existing.total_score += row.score;
      existing.games_played += 1;
      existing.scores.push(row.score);
    } else {
      statsMap.set(row.username, {
        username: row.username,
        total_score: row.score,
        games_played: 1,
        scores: [row.score],
      });
    }
  }

  return Array.from(statsMap.values())
    .map((s) => ({
      username: s.username,
      total_score: s.total_score,
      games_played: s.games_played,
      avg_score: Math.round((s.total_score / s.games_played) * 10) / 10,
      best_score: Math.max(...s.scores),
      current_streak: 0, // TODO: calcular streak real
    }))
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 30);
}
