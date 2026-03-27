// ============================================
// Script: seed-players.ts (v2)
// Busca jogadores TIME POR TIME para evitar o limite
// de 3 páginas do free tier da API-Football.
// ============================================
// Estratégia: em vez de buscar /players?league=71 (que precisa
// de ~58 páginas), buscamos /players?team={id}&season=2024
// para cada time. Cada elenco tem ~25-35 jogadores (1-2 páginas),
// então nunca ultrapassa o limite de 3 páginas.
//
// 20 times × ~2 páginas = ~40 requests (cabe no free tier de 100/dia).
//
// O script é RESUMÍVEL: salva o último time processado.
//
// Uso: npx tsx scripts/seed-players.ts
// ============================================

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  supabase,
  apiFetch,
  log,
  getRequestCount,
  SEASON,
  type ApiResponse,
  type ApiPlayerDetailed,
} from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const season = Number(process.argv[2]) || SEASON;
const PROGRESS_FILE = resolve(__dirname, `progress-players-${season}.json`);

// Limite de segurança para não estourar o free tier
const MAX_REQUESTS_PER_RUN = 90;

interface Progress {
  season: number;
  completedTeams: number[];   // api_football_ids dos times já processados
  playersInserted: number;
  relationshipsInserted: number;
  completed: boolean;
}

function loadProgress(): Progress {
  if (existsSync(PROGRESS_FILE)) {
    const raw = readFileSync(PROGRESS_FILE, "utf-8");
    return JSON.parse(raw);
  }
  return {
    season,
    completedTeams: [],
    playersInserted: 0,
    relationshipsInserted: 0,
    completed: false,
  };
}

function saveProgress(progress: Progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function seedPlayers() {
  log(`⚽ Seed de Jogadores da Série A (Temporada ${season})`, "info");
  log(`   Estratégia: busca time por time (máx 3 páginas por time)`, "dim");
  log("", "dim");

  const progress = loadProgress();

  if (progress.completed) {
    log(`✅ Seed da temporada ${season} já foi concluído.`, "success");
    log(`   ${progress.playersInserted} jogadores, ${progress.relationshipsInserted} vínculos.`, "dim");
    log(`   Para refazer, delete: ${PROGRESS_FILE}`, "dim");
    return;
  }

  // Buscar todos os clubes do Supabase
  const { data: clubs, error: clubsError } = await supabase
    .from("clubs")
    .select("id, name, api_football_id")
    .order("name");

  if (clubsError || !clubs || clubs.length === 0) {
    log("❌ Nenhum clube encontrado. Rode seed-clubs.ts primeiro!", "error");
    process.exit(1);
  }

  // Mapa: api_football_id → UUID do clube
  const clubMap = new Map<number, string>();
  clubs.forEach((c) => clubMap.set(c.api_football_id, c.id));

  // Filtrar times que já foram processados (resumibilidade)
  const completedSet = new Set(progress.completedTeams);
  const pendingClubs = clubs.filter((c) => !completedSet.has(c.api_football_id));

  if (progress.completedTeams.length > 0) {
    log(`🔄 Retomando... ${progress.completedTeams.length} times já processados, ${pendingClubs.length} restantes.`, "warn");
  } else {
    log(`📋 ${clubs.length} times para processar`, "info");
  }

  let totalPlayers = progress.playersInserted;
  let totalRelationships = progress.relationshipsInserted;

  for (const club of pendingClubs) {
    // Checar limite de requests
    if (getRequestCount() >= MAX_REQUESTS_PER_RUN) {
      log("", "dim");
      log(`⏸️  Limite de requests atingido (${MAX_REQUESTS_PER_RUN}). Rode novamente amanhã.`, "warn");
      break;
    }

    log("", "dim");
    log(`🏟️  ${club.name} (API ID: ${club.api_football_id})`, "info");

    // Buscar jogadores deste time, página por página (máx 3)
    let page = 1;
    let totalPages = 1;
    let teamPlayers = 0;
    let teamRelationships = 0;

    while (page <= totalPages && page <= 3) {
      const data = await apiFetch<ApiResponse<ApiPlayerDetailed>>("/players", {
        team: club.api_football_id,
        season,
        page,
      });

      totalPages = data.paging.total;

      if (data.response.length === 0) break;

      // Preparar jogadores para upsert
      const playersToUpsert = data.response.map((item) => {
        const p = item.player;
        let position = "Attacker";
        if (item.statistics.length > 0 && item.statistics[0].games.position) {
          position = item.statistics[0].games.position;
        }

        return {
          name: p.name,
          full_name: `${p.firstname || ""} ${p.lastname || ""}`.trim() || p.name,
          nationality: p.nationality,
          position,
          date_of_birth: p.birth.date || null,
          photo_url: p.photo,
          api_football_id: p.id,
        };
      });

      // Inserir jogadores
      const { data: inserted, error: playersError } = await supabase
        .from("players")
        .upsert(playersToUpsert, { onConflict: "api_football_id" })
        .select("id, api_football_id");

      if (playersError) {
        log(`   ❌ Erro ao inserir jogadores: ${playersError.message}`, "error");
        saveProgress({
          season,
          completedTeams: progress.completedTeams,
          playersInserted: totalPlayers,
          relationshipsInserted: totalRelationships,
          completed: false,
        });
        process.exit(1);
      }

      teamPlayers += inserted.length;

      // Mapa: api_football_id do jogador → UUID
      const playerMap = new Map<number, string>();
      inserted.forEach((p) => playerMap.set(p.api_football_id, p.id));

      // Preparar vínculos jogador-clube
      const relationships = data.response
        .filter((item) => playerMap.has(item.player.id))
        .flatMap((item) =>
          item.statistics
            .filter((stat) => clubMap.has(stat.team.id))
            .map((stat) => ({
              player_id: playerMap.get(item.player.id)!,
              club_id: clubMap.get(stat.team.id)!,
              season: String(season),
              jersey_number: null,
            }))
        );

      // Deduplicar (um jogador pode ter múltiplas stats no mesmo time)
      const uniqueRels = new Map<string, (typeof relationships)[number]>();
      relationships.forEach((r) => {
        const key = `${r.player_id}-${r.club_id}-${r.season}`;
        uniqueRels.set(key, r);
      });

      const dedupedRels = Array.from(uniqueRels.values());

      if (dedupedRels.length > 0) {
        const { error: relError } = await supabase
          .from("player_clubs")
          .upsert(dedupedRels, { onConflict: "player_id,club_id,season" });

        if (relError) {
          log(`   ⚠️  Erro nos vínculos: ${relError.message}`, "warn");
        } else {
          teamRelationships += dedupedRels.length;
        }
      }

      page++;
    }

    totalPlayers += teamPlayers;
    totalRelationships += teamRelationships;

    log(`   ✅ ${teamPlayers} jogadores, ${teamRelationships} vínculos`, "success");

    // Marcar time como concluído
    progress.completedTeams.push(club.api_football_id);
    saveProgress({
      season,
      completedTeams: progress.completedTeams,
      playersInserted: totalPlayers,
      relationshipsInserted: totalRelationships,
      completed: false,
    });
  }

  // Verificar se todos os times foram processados
  const allDone = progress.completedTeams.length >= clubs.length;

  log("", "dim");
  log("=".repeat(50), "dim");

  if (allDone) {
    log("🎉 Seed de jogadores COMPLETO!", "success");
    saveProgress({
      season,
      completedTeams: progress.completedTeams,
      playersInserted: totalPlayers,
      relationshipsInserted: totalRelationships,
      completed: true,
    });
  } else {
    log(`⏸️  ${progress.completedTeams.length}/${clubs.length} times processados.`, "warn");
    log(`   Rode novamente para continuar.`, "dim");
  }

  log(`📊 Requests usadas: ${getRequestCount()}`, "info");
  log(`👤 Total jogadores: ${totalPlayers}`, "info");
  log(`🔗 Total vínculos: ${totalRelationships}`, "info");
}

seedPlayers().catch((err) => {
  log(`❌ Erro fatal: ${err.message}`, "error");
  console.error(err);
  process.exit(1);
});
