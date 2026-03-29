export type GameFilter = "all" | "grid" | "connections" | "wordle" | "guess";
export type TimeFilter = "today" | "week" | "alltime";

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  attempts: number;
  game_type: string;
  challenge_date: string;
  played_at: string;
  games_played?: number;
}

export interface PlayerStats {
  username: string;
  total_score: number;
  games_played: number;
  avg_score: number;
  best_score: number;
  current_streak: number;
}
