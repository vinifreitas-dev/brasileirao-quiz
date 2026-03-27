// ============================================
// Script: seed-categories.ts
// Cria categorias temáticas para o jogo Connections
// a partir dos dados já existentes no banco.
// ============================================
// RODE APENAS DEPOIS de seed-clubs e seed-players!
// Este script não usa a API-Football (zero requests).
// Ele consulta os dados que já estão no Supabase e cria
// agrupamentos temáticos automaticamente.
//
// Uso: npx tsx scripts/seed-categories.ts
// ============================================

import { supabase, log } from "./config.js";

// Tipos de categorias que vamos gerar automaticamente.
// Cada gerador consulta o banco e retorna jogadores que se encaixam.
interface CategorySeed {
  name: string;
  type: string;
  query: () => Promise<string[]>; // Retorna lista de player_ids
}

async function seedCategories() {
  log("🔗 Seed de Categorias para o Connections", "info");
  log("", "dim");

  // ---- Verificar se há jogadores no banco ----
  const { count } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true });

  if (!count || count === 0) {
    log("❌ Nenhum jogador encontrado. Rode seed-clubs.ts e seed-players.ts primeiro!", "error");
    process.exit(1);
  }
  log(`📋 ${count} jogadores encontrados no banco`, "dim");

  // ---- Gerar categorias baseadas em CLUBES ----
  // "Jogaram no Flamengo", "Jogaram no Palmeiras", etc.
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name")
    .order("name");

  const clubCategories: CategorySeed[] = (clubs || []).map((club) => ({
    name: `Jogaram no ${club.name}`,
    type: "club",
    query: async () => {
      const { data } = await supabase
        .from("player_clubs")
        .select("player_id")
        .eq("club_id", club.id);
      return (data || []).map((r) => r.player_id);
    },
  }));

  // ---- Gerar categorias baseadas em POSIÇÃO ----
  const positionCategories: CategorySeed[] = [
    {
      name: "Goleiros da Série A",
      type: "stat",
      query: async () => {
        const { data } = await supabase
          .from("players")
          .select("id")
          .eq("position", "Goalkeeper");
        return (data || []).map((r) => r.id);
      },
    },
    {
      name: "Zagueiros da Série A",
      type: "stat",
      query: async () => {
        const { data } = await supabase
          .from("players")
          .select("id")
          .eq("position", "Defender");
        return (data || []).map((r) => r.id);
      },
    },
    {
      name: "Meias da Série A",
      type: "stat",
      query: async () => {
        const { data } = await supabase
          .from("players")
          .select("id")
          .eq("position", "Midfielder");
        return (data || []).map((r) => r.id);
      },
    },
    {
      name: "Atacantes da Série A",
      type: "stat",
      query: async () => {
        const { data } = await supabase
          .from("players")
          .select("id")
          .eq("position", "Attacker");
        return (data || []).map((r) => r.id);
      },
    },
  ];

  // ---- Gerar categorias baseadas em NACIONALIDADE ----
  // Busca as nacionalidades mais comuns (com pelo menos 4 jogadores,
  // que é o mínimo para um grupo no Connections)
  const { data: nationalityCounts } = await supabase
    .rpc("get_nationality_counts");

  // Se a RPC não existir, fazemos manualmente
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id, nationality");

  // Contar jogadores por nacionalidade
  const natMap = new Map<string, string[]>();
  (allPlayers || []).forEach((p) => {
    const list = natMap.get(p.nationality) || [];
    list.push(p.id);
    natMap.set(p.nationality, list);
  });

  const nationalityCategories: CategorySeed[] = [];
  for (const [nationality, playerIds] of natMap) {
    // Só cria categoria se tiver pelo menos 4 jogadores
    // (mínimo para um grupo no Connections)
    if (playerIds.length >= 4 && nationality !== "Brazil") {
      // Excluímos "Brazil" pois seriam muitos jogadores.
      // Brasileiros serão agrupados por outros critérios (clube, posição).
      nationalityCategories.push({
        name: `${nationality === "Argentina" ? "Argentinos" : nationality === "Colombia" ? "Colombianos" : nationality === "Uruguay" ? "Uruguaios" : nationality === "Paraguay" ? "Paraguaios" : nationality === "Chile" ? "Chilenos" : nationality === "Ecuador" ? "Equatorianos" : nationality === "Peru" ? "Peruanos" : nationality === "Venezuela" ? "Venezuelanos" : `Jogadores de ${nationality}`} na Série A`,
        type: "nationality",
        query: async () => playerIds,
      });
    }
  }

  // ---- Inserir tudo no banco ----
  const allCategories = [
    ...clubCategories,
    ...positionCategories,
    ...nationalityCategories,
  ];

  log(`📝 ${allCategories.length} categorias para inserir:`, "info");
  log(`   ${clubCategories.length} por clube`, "dim");
  log(`   ${positionCategories.length} por posição`, "dim");
  log(`   ${nationalityCategories.length} por nacionalidade`, "dim");
  log("", "dim");

  let categoriesInserted = 0;
  let linksInserted = 0;

  for (const cat of allCategories) {
    // 1. Inserir a categoria
    const { data: inserted, error } = await supabase
      .from("categories")
      .upsert(
        { name: cat.name, type: cat.type },
        { onConflict: "name" } // Evita duplicatas pelo nome
      )
      .select()
      .single();

    if (error) {
      // Se o onConflict falhar (a coluna name não tem unique constraint),
      // vamos tentar buscar a existente
      const { data: existing } = await supabase
        .from("categories")
        .select()
        .eq("name", cat.name)
        .single();

      if (!existing) {
        log(`⚠️  Erro ao inserir categoria "${cat.name}": ${error.message}`, "warn");
        continue;
      }
      // Usa a categoria existente
      const categoryId = existing.id;
      const playerIds = await cat.query();

      if (playerIds.length > 0) {
        const links = playerIds.map((pid) => ({
          player_id: pid,
          category_id: categoryId,
        }));

        const { error: linkError } = await supabase
          .from("player_categories")
          .upsert(links, { onConflict: "player_id,category_id" });

        if (!linkError) {
          linksInserted += links.length;
        }
      }
      continue;
    }

    categoriesInserted++;
    const categoryId = inserted.id;

    // 2. Buscar jogadores que pertencem a esta categoria
    const playerIds = await cat.query();

    // 3. Criar os vínculos player_categories
    if (playerIds.length > 0) {
      const links = playerIds.map((pid) => ({
        player_id: pid,
        category_id: categoryId,
      }));

      const { error: linkError } = await supabase
        .from("player_categories")
        .upsert(links, { onConflict: "player_id,category_id" });

      if (linkError) {
        log(`⚠️  Erro ao vincular jogadores à "${cat.name}": ${linkError.message}`, "warn");
      } else {
        linksInserted += links.length;
        log(`   ✅ ${cat.name} (${playerIds.length} jogadores)`, "success");
      }
    } else {
      log(`   ⏭️  ${cat.name} (0 jogadores, pulando)`, "dim");
    }
  }

  log("", "dim");
  log("=" .repeat(50), "dim");
  log(`✅ ${categoriesInserted} categorias criadas`, "success");
  log(`🔗 ${linksInserted} vínculos jogador-categoria criados`, "success");
  log("✅ Seed de categorias concluído!", "success");
}

seedCategories().catch((err) => {
  log(`❌ Erro fatal: ${err.message}`, "error");
  console.error(err);
  process.exit(1);
});
