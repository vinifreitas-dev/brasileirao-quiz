/**
 * Edge Function: generate-daily-challenges
 *
 * Gera os desafios diários para todos os tipos de jogo.
 * Deve ser chamada às 00h00 BRT (03h00 UTC) via cron.
 *
 * Usa a service role key para burlar o RLS e inserir na daily_challenges.
 * Clientes (frontend) NUNCA devem inserir desafios — apenas ler.
 */

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// ============================================================
// UTILITÁRIOS
// ============================================================

function getTodayBRT(): string {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const local = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000);
  return local.toISOString().split("T")[0];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ============================================================
// GRID
// ============================================================

const nationalityLabels: Record<string, string> = {
  Brazil: "Brasileiro",
  Argentina: "Argentino",
  Uruguay: "Uruguaio",
  Colombia: "Colombiano",
  Paraguay: "Paraguaio",
  Chile: "Chileno",
  Ecuador: "Equatoriano",
  Venezuela: "Venezuelano",
};

const positionLabels: Record<string, string> = {
  Goalkeeper: "Goleiro",
  Defender: "Zagueiro",
  Midfielder: "Meia",
  Attacker: "Atacante",
};

async function validateGridChallenge(challenge: any): Promise<boolean> {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      let query = supabase
        .from("players_with_clubs")
        .select("player_id", { count: "exact", head: true })
        .eq("club_id", challenge.rows[row].value);

      if (challenge.columns[col].type === "position") {
        query = query.eq("position", challenge.columns[col].value);
      } else {
        query = query.eq("nationality", challenge.columns[col].value);
      }

      const { count } = await query;
      if ((count ?? 0) < 2) return false;
    }
  }
  return true;
}

async function generateGrid(): Promise<any | null> {
  const { data: clubs } = await supabase.from("clubs").select("id, name, logo_url");
  if (!clubs || clubs.length < 3) return null;

  const { data: allPlayers } = await supabase.from("players").select("nationality");
  if (!allPlayers) return null;

  const natCounts = new Map<string, number>();
  for (const p of allPlayers as { nationality: string }[]) {
    natCounts.set(p.nationality, (natCounts.get(p.nationality) ?? 0) + 1);
  }

  const viableNationalities = Array.from(natCounts.entries())
    .filter(([nat, count]) => nat !== "Brazil" && count >= 6)
    .map(([nat]) => nat);

  const positions = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

  for (let attempt = 0; attempt < 10; attempt++) {
    const pickedClubs = shuffle(clubs).slice(0, 3) as { id: string; name: string; logo_url: string | null }[];

    const rows = pickedClubs.map((c) => ({
      type: "club",
      value: c.id,
      label: c.name,
      imageUrl: c.logo_url ?? undefined,
    }));

    const columns: any[] = [];
    const shuffledPos = shuffle(positions);

    // 1ª coluna: sempre posição
    columns.push({
      type: "position",
      value: shuffledPos[0],
      label: positionLabels[shuffledPos[0]] ?? shuffledPos[0],
    });

    // 2ª coluna: nacionalidade se disponível, senão posição
    if (viableNationalities.length > 0) {
      const nat = shuffle(viableNationalities)[0];
      columns.push({ type: "nationality", value: nat, label: nationalityLabels[nat] ?? nat });
    } else {
      columns.push({
        type: "position",
        value: shuffledPos[1],
        label: positionLabels[shuffledPos[1]] ?? shuffledPos[1],
      });
    }

    // 3ª coluna: outra posição ou nacionalidade
    const usedPos = columns.filter((c) => c.type === "position").map((c) => c.value);
    const usedNats = columns.filter((c) => c.type === "nationality").map((c) => c.value);
    const availPos = positions.filter((p) => !usedPos.includes(p));
    const availNats = viableNationalities.filter((n) => !usedNats.includes(n));

    if (availNats.length > 0 && Math.random() > 0.5) {
      const pick = availNats[Math.floor(Math.random() * availNats.length)];
      columns.push({ type: "nationality", value: pick, label: nationalityLabels[pick] ?? pick });
    } else if (availPos.length > 0) {
      const pick = availPos[Math.floor(Math.random() * availPos.length)];
      columns.push({ type: "position", value: pick, label: positionLabels[pick] ?? pick });
    } else {
      const pick = shuffledPos[1] ?? shuffledPos[0];
      columns.push({ type: "position", value: pick, label: positionLabels[pick] ?? pick });
    }

    const challenge = { rows, columns };
    if (await validateGridChallenge(challenge)) return challenge;
  }

  return null;
}

// ============================================================
// CONNECTIONS
// ============================================================

async function generateConnections(): Promise<any | null> {
  const { data: categories } = await supabase.from("categories").select("id, name, type");
  if (!categories || categories.length < 4) return null;

  const categoryWithPlayers: any[] = [];

  for (const cat of categories as { id: string; name: string; type: string }[]) {
    const { data: links } = await supabase
      .from("player_categories")
      .select("player_id")
      .eq("category_id", cat.id);

    if (!links || links.length < 4) continue;

    const playerIds = links.map((l: any) => l.player_id);
    const { data: players } = await supabase
      .from("players")
      .select("id, name, photo_url")
      .in("id", playerIds);

    if (!players || players.length < 4) continue;
    categoryWithPlayers.push({ ...cat, players });
  }

  if (categoryWithPlayers.length < 4) return null;

  for (let attempt = 0; attempt < 20; attempt++) {
    const shuffled = shuffle(categoryWithPlayers);
    const selectedGroups: any[] = [];
    const usedPlayerIds = new Set<string>();

    for (const cat of shuffled) {
      if (selectedGroups.length >= 4) break;

      const available = (cat.players as { id: string }[]).filter((p) => !usedPlayerIds.has(p.id));
      if (available.length < 4) continue;

      const picked = shuffle(available).slice(0, 4);
      picked.forEach((p: { id: string }) => usedPlayerIds.add(p.id));

      selectedGroups.push({
        category: cat.name,
        difficulty: (selectedGroups.length + 1) as 1 | 2 | 3 | 4,
        players: picked,
        revealed: false,
      });
    }

    if (selectedGroups.length === 4) {
      const shuffledPlayers = shuffle(selectedGroups.flatMap((g) => g.players));
      return { groups: selectedGroups, shuffledPlayers };
    }
  }

  return null;
}

// ============================================================
// WORDLE
// ============================================================

async function generateWordle(): Promise<any | null> {
  const { count } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .gte("name", "AAAA");

  if (!count || count === 0) return null;

  const randomIndex = Math.floor(Math.random() * count);
  const { data } = await supabase
    .from("players")
    .select("id")
    .gte("name", "AAAA")
    .range(randomIndex, randomIndex);

  if (!data || data.length === 0) return null;
  return { player_id: (data[0] as { id: string }).id };
}

// ============================================================
// GUESS (QUEM É?)
// ============================================================

async function generateGuess(): Promise<any | null> {
  const { data: rows } = await supabase
    .from("players_with_clubs")
    .select("player_id")
    .limit(1000);

  if (!rows || rows.length === 0) return null;

  const uniqueIds = [...new Set((rows as { player_id: string }[]).map((r) => r.player_id))];
  if (uniqueIds.length === 0) return null;

  const randomId = uniqueIds[Math.floor(Math.random() * uniqueIds.length)];
  return { player_id: randomId };
}

// ============================================================
// MAIN
// ============================================================

const generators: Record<string, () => Promise<any | null>> = {
  grid: generateGrid,
  connections: generateConnections,
  wordle: generateWordle,
  guess: generateGuess,
};

async function run(date: string): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const [gameType, generateFn] of Object.entries(generators)) {
    // Verificar se já existe para hoje
    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("id")
      .eq("game_type", gameType)
      .eq("challenge_date", date)
      .maybeSingle();

    if (existing) {
      results[gameType] = "already_exists";
      continue;
    }

    // Gerar
    const config = await generateFn();
    if (!config) {
      results[gameType] = "generation_failed";
      continue;
    }

    // Inserir (service role bypassa RLS)
    const { error } = await supabase
      .from("daily_challenges")
      .insert({ game_type: gameType, challenge_date: date, config });

    results[gameType] = error ? `error: ${error.message}` : "created";
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Aceita ?date=YYYY-MM-DD para gerar desafios de dias futuros
    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? getTodayBRT();

    const results = await run(date);
    console.log(`Desafios gerados para ${date}:`, results);

    return new Response(JSON.stringify({ date, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro ao gerar desafios:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
