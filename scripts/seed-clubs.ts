// ============================================
// Script: seed-clubs.ts
// Busca os 20 clubes da Série A e insere no Supabase.
// Custo: 1 request da API-Football.
// ============================================
// Uso: npx tsx scripts/seed-clubs.ts
// ============================================

import {
  supabase,
  apiFetch,
  log,
  getRequestCount,
  SERIE_A_LEAGUE_ID,
  SEASON,
  type ApiResponse,
  type ApiTeam,
} from "./config.js";

async function seedClubs() {
  log("⚽ Seed de Clubes da Série A", "info");
  log(`   Liga: ${SERIE_A_LEAGUE_ID} | Temporada: ${SEASON}`, "dim");
  log("", "dim");

  // 1. Buscar times da Série A na temporada definida
  const data = await apiFetch<ApiResponse<ApiTeam>>("/teams", {
    league: SERIE_A_LEAGUE_ID,
    season: SEASON,
  });

  const teams = data.response;
  log(`✅ ${teams.length} clubes encontrados na API`, "success");

  // 2. Transformar para o formato do nosso banco
  // O "code" da API é o short_name (FLA, PAL, etc).
  // Nem todos os times têm code, então usamos as 3 primeiras letras do nome como fallback.
  const clubs = teams.map((item) => ({
    name: item.team.name,
    short_name: item.team.code || item.team.name.substring(0, 3).toUpperCase(),
    logo_url: item.team.logo,
    league: "Série A",
    api_football_id: item.team.id,
  }));

  // 3. Inserir no Supabase via upsert.
  // Upsert = INSERT ou UPDATE se já existir (baseado no api_football_id).
  // Isso torna o script idempotente: rodar várias vezes não duplica dados.
  const { data: inserted, error } = await supabase
    .from("clubs")
    .upsert(clubs, {
      onConflict: "api_football_id",  // Se o api_football_id já existe, atualiza
    })
    .select();

  if (error) {
    log(`❌ Erro ao inserir clubes: ${error.message}`, "error");
    process.exit(1);
  }

  log(`✅ ${inserted.length} clubes inseridos/atualizados no Supabase`, "success");
  log("", "dim");

  // 4. Mostrar resumo
  log("📋 Clubes:", "info");
  inserted.forEach((club) => {
    log(`   ${club.short_name} - ${club.name}`, "dim");
  });

  log("", "dim");
  log(`📊 Total de requests usadas: ${getRequestCount()}`, "info");
  log("✅ Seed de clubes concluído!", "success");
}

// Executa e trata erros não capturados
seedClubs().catch((err) => {
  log(`❌ Erro fatal: ${err.message}`, "error");
  process.exit(1);
});
