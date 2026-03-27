// ============================================
// Tipos base do domínio — espelham o schema do banco
// Cada tipo aqui representa uma tabela ou conceito central.
// ============================================

/** Jogador de futebol com seus dados básicos */
export interface Player {
  id: string;
  name: string;
  full_name: string;
  nationality: string;
  position: PlayerPosition;
  date_of_birth: string | null;
  photo_url: string | null;
  api_football_id: number;
  created_at: string;
}

/** Posições padronizadas (como vêm da API-Football) */
export type PlayerPosition = "Goalkeeper" | "Defender" | "Midfielder" | "Attacker";

/** Clube de futebol */
export interface Club {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  league: string;
  api_football_id: number;
}

/** Relacionamento jogador-clube (passagem por um time) */
export interface PlayerClub {
  id: string;
  player_id: string;
  club_id: string;
  season: string;
  jersey_number: number | null;
}

/** Categoria para o jogo Connections */
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

export type CategoryType = "achievement" | "club" | "nationality" | "stat" | "custom";

// ============================================
// Tipos do sistema de jogo
// ============================================

export type GameType = "grid" | "connections";

/** Desafio diário — um por tipo de jogo por dia */
export interface DailyChallenge {
  id: string;
  game_type: GameType;
  challenge_date: string;
  config: GridConfig | ConnectionsConfig;
  created_at: string;
}

/** Configuração específica do Grid: 3 linhas (clubes) x 3 colunas (critérios) */
export interface GridConfig {
  rows: GridCriteria[];
  columns: GridCriteria[];
  /** Respostas válidas: mapa de "row-col" → lista de player IDs aceitos */
  answers: Record<string, string[]>;
}

/** Critério de uma linha ou coluna do Grid */
export interface GridCriteria {
  type: "club" | "nationality" | "position" | "achievement";
  value: string;
  label: string;
}

/** Configuração do Connections: 4 grupos de 4 jogadores */
export interface ConnectionsConfig {
  groups: ConnectionsGroup[];
}

export interface ConnectionsGroup {
  category: string;
  difficulty: 1 | 2 | 3 | 4;
  player_ids: string[];
}

// ============================================
// Tipos de score e perfil do usuário
// ============================================

export interface UserScore {
  id: string;
  user_id: string;
  challenge_id: string;
  score: number;
  completed: boolean;
  attempts: number;
  time_seconds: number | null;
  result_data: Record<string, unknown>;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  streak: number;
  created_at: string;
}
