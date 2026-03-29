/**
 * Gerador de desafios diários — script Node.js
 *
 * Uso:
 *   node scripts/generate-challenges.mjs
 *   node scripts/generate-challenges.mjs 2026-03-30   (data específica)
 *
 * Requer: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Carrega .env manualmente (sem dotenv)
const envPath = resolve(process.cwd(), ".env");
const envVars = {};
try {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.+)$/);
    if (m) envVars[m[1]] = m[2].trim();
  }
} catch {
  console.error("Arquivo .env não encontrado.");
  process.exit(1);
}

const SUPABASE_URL = envVars["VITE_SUPABASE_URL"];
const SERVICE_KEY = envVars["VITE_SUPABASE_ANON_KEY"];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ============================================================
// UTILITÁRIOS
// ============================================================

function getTodayBRT() {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const local = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000);
  return local.toISOString().split("T")[0];
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ============================================================
// GRID
// ============================================================

const nationalityLabels = {
  Brazil: "Brasileiro", Argentina: "Argentino", Uruguay: "Uruguaio",
  Colombia: "Colombiano", Paraguay: "Paraguaio", Chile: "Chileno",
  Ecuador: "Equatoriano", Venezuela: "Venezuelano",
};

const positionLabels = {
  Goalkeeper: "Goleiro", Defender: "Zagueiro",
  Midfielder: "Meia", Attacker: "Atacante",
};

async function validateGridChallenge(challenge) {
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

async function generateGrid() {
  const { data: clubs } = await supabase.from("clubs").select("id, name, logo_url");
  if (!clubs || clubs.length < 3) return null;

  const { data: allPlayers } = await supabase.from("players").select("nationality");
  if (!allPlayers) return null;

  const natCounts = new Map();
  for (const p of allPlayers) {
    natCounts.set(p.nationality, (natCounts.get(p.nationality) ?? 0) + 1);
  }

  const viableNationalities = Array.from(natCounts.entries())
    .filter(([nat, count]) => nat !== "Brazil" && count >= 6)
    .map(([nat]) => nat);

  const positions = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

  for (let attempt = 0; attempt < 10; attempt++) {
    const pickedClubs = shuffle(clubs).slice(0, 3);
    const rows = pickedClubs.map((c) => ({
      type: "club", value: c.id, label: c.name, imageUrl: c.logo_url ?? undefined,
    }));

    const columns = [];
    const shuffledPos = shuffle(positions);

    columns.push({ type: "position", value: shuffledPos[0], label: positionLabels[shuffledPos[0]] ?? shuffledPos[0] });

    if (viableNationalities.length > 0) {
      const nat = shuffle(viableNationalities)[0];
      columns.push({ type: "nationality", value: nat, label: nationalityLabels[nat] ?? nat });
    } else {
      columns.push({ type: "position", value: shuffledPos[1], label: positionLabels[shuffledPos[1]] ?? shuffledPos[1] });
    }

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

async function generateConnections() {
  const { data: categories } = await supabase.from("categories").select("id, name, type");
  if (!categories || categories.length < 4) return null;

  const categoryWithPlayers = [];

  for (const cat of categories) {
    const { data: links } = await supabase
      .from("player_categories")
      .select("player_id")
      .eq("category_id", cat.id);

    if (!links || links.length < 4) continue;

    const playerIds = links.map((l) => l.player_id);
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
    const selectedGroups = [];
    const usedPlayerIds = new Set();

    for (const cat of shuffled) {
      if (selectedGroups.length >= 4) break;
      const available = cat.players.filter((p) => !usedPlayerIds.has(p.id));
      if (available.length < 4) continue;

      const picked = shuffle(available).slice(0, 4);
      picked.forEach((p) => usedPlayerIds.add(p.id));
      selectedGroups.push({
        category: cat.name,
        difficulty: selectedGroups.length + 1,
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

async function generateWordle() {
  const { count } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .gte("name", "AAAA");

  if (!count) return null;

  const randomIndex = Math.floor(Math.random() * count);
  const { data } = await supabase
    .from("players")
    .select("id")
    .gte("name", "AAAA")
    .range(randomIndex, randomIndex);

  if (!data || data.length === 0) return null;
  return { player_id: data[0].id };
}

// ============================================================
// GUESS
// ============================================================

async function generateGuess() {
  const { data: rows } = await supabase
    .from("players_with_clubs")
    .select("player_id")
    .limit(1000);

  if (!rows || rows.length === 0) return null;

  const uniqueIds = [...new Set(rows.map((r) => r.player_id))];
  if (uniqueIds.length === 0) return null;

  const randomId = uniqueIds[Math.floor(Math.random() * uniqueIds.length)];
  return { player_id: randomId };
}

// ============================================================
// MAIN
// ============================================================

const generators = { grid: generateGrid, connections: generateConnections, wordle: generateWordle, guess: generateGuess };

async function run(date) {
  console.log(`\nGerando desafios para ${date}...\n`);

  for (const [gameType, generateFn] of Object.entries(generators)) {
    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("id")
      .eq("game_type", gameType)
      .eq("challenge_date", date)
      .maybeSingle();

    if (existing) {
      console.log(`  [${gameType}] já existe — pulando`);
      continue;
    }

    process.stdout.write(`  [${gameType}] gerando...`);
    const config = await generateFn();

    if (!config) {
      console.log(" FALHOU (dados insuficientes no banco)");
      continue;
    }

    const { error } = await supabase
      .from("daily_challenges")
      .insert({ game_type: gameType, challenge_date: date, config });

    if (error) {
      console.log(` ERRO: ${error.message}`);
    } else {
      console.log(" OK");
    }
  }

  console.log("\nConcluído!");
}

const dateArg = process.argv[2] ?? getTodayBRT();
run(dateArg).catch((err) => { console.error(err); process.exit(1); });
