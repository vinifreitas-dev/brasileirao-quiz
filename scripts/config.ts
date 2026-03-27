// ============================================
// Configuração compartilhada dos scripts de seed
// ============================================
// Centraliza: API client, Supabase client, rate limiting e logging.
// Todos os scripts importam daqui para evitar duplicação.

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ---- Validação de variáveis de ambiente ----
// Falhar cedo e com mensagem clara é melhor do que
// erros crípticos no meio da execução.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios no .env");
  process.exit(1);
}

if (!API_FOOTBALL_KEY) {
  console.error("❌ API_FOOTBALL_KEY é obrigatório no .env");
  process.exit(1);
}

// ---- Clients ----

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Base URL da API-Football v3
const API_BASE = "https://v3.football.api-sports.io";

// ID da Série A brasileira na API-Football
// (encontrado via endpoint /leagues?country=Brazil)
export const SERIE_A_LEAGUE_ID = 71;

// Temporada a ser buscada. O Brasileirão segue ano calendário (Jan-Dez).
// Usamos 2024 por ser a temporada completa mais recente com dados estáveis.
export const SEASON = 2024;

// ---- API Client com rate limiting ----

// Controle de requests para respeitar o free tier.
// O free plan permite 100 requests/dia e não tem limite por minuto,
// mas vamos ser gentis com o servidor e esperar entre requests.
let requestCount = 0;

/**
 * Faz uma request autenticada para a API-Football.
 * Inclui rate limiting automático (1 segundo entre requests)
 * e contagem de requests para monitoramento.
 */
export async function apiFetch<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
  // Monta a URL com query params
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  // Rate limiting: espera 1.2 segundos entre requests
  // Isso evita que o firewall da API nos bloqueie
  if (requestCount > 0) {
    await sleep(7000);
  }

  requestCount++;
  log(`📡 Request #${requestCount}: ${endpoint}`, "info");

  const response = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // A API-Football retorna erros dentro do body com status 200.
  // Precisamos checar o campo "errors" e "results".
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football errors: ${JSON.stringify(data.errors)}`);
  }

  // Mostra quantas requests restam no dia (vem no header)
  const remaining = response.headers.get("x-ratelimit-requests-remaining");
  if (remaining) {
    log(`   Requests restantes hoje: ${remaining}`, "dim");
  }

  return data;
}

// ---- Utilitários ----

/** Pausa a execução por N milissegundos */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Logging colorido para o terminal */
export function log(message: string, level: "info" | "success" | "error" | "dim" | "warn" = "info") {
  const colors = {
    info: "\x1b[36m",    // ciano
    success: "\x1b[32m", // verde
    error: "\x1b[31m",   // vermelho
    warn: "\x1b[33m",    // amarelo
    dim: "\x1b[90m",     // cinza
  };
  const reset = "\x1b[0m";
  console.log(`${colors[level]}${message}${reset}`);
}

/** Retorna a contagem atual de requests feitas nesta execução */
export function getRequestCount(): number {
  return requestCount;
}

// ---- Tipos de resposta da API-Football ----
// A API sempre retorna nessa estrutura envelope.

export interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string>;
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

/** Tipo de time retornado pela API */
export interface ApiTeam {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string;
    founded: number | null;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
  };
}

/** Tipo de jogador no endpoint /players/squads */
export interface ApiSquadPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string;
  photo: string;
}

/** Tipo do endpoint /players (detalhado, paginado) */
export interface ApiPlayerDetailed {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number | null;
    birth: {
      date: string | null;
      place: string | null;
      country: string | null;
    };
    nationality: string;
    height: string | null;
    weight: string | null;
    injured: boolean;
    photo: string;
  };
  statistics: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
    };
    games: {
      appearences: number | null; // sim, a API escreve "appearences" com typo
      lineups: number | null;
      minutes: number | null;
      position: string;
    };
  }>;
}
