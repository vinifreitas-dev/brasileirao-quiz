import { supabase } from "../../lib/supabase";
import type { GridChallenge, GridCriteria, PlayerSearchResult } from "./types";

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

/**
 * Gera um desafio Grid aleatório garantindo que todas as 9 células
 * tenham pelo menos 1 resposta válida.
 */
export async function generateGridChallenge(): Promise<GridChallenge | null> {
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name, short_name, logo_url");

  if (!clubs || clubs.length < 3) return null;

  const { data: allPlayers } = await supabase
    .from("players")
    .select("nationality");

  if (!allPlayers) return null;

  // Contar jogadores por nacionalidade
  const natCounts = new Map<string, number>();
  for (const p of allPlayers) {
    const nat = (p as { nationality: string }).nationality;
    natCounts.set(nat, (natCounts.get(nat) || 0) + 1);
  }

  // Nacionalidades com pelo menos 6 jogadores (excluindo Brazil)
  const viableNationalities = Array.from(natCounts.entries())
    .filter(([nat, count]) => nat !== "Brazil" && count >= 6)
    .map(([nat]) => nat);

  const positions = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

  // Tentar gerar grid válido (até 10 tentativas)
  for (let attempt = 0; attempt < 10; attempt++) {
    // 3 clubes aleatórios para as linhas
    const shuffled = [...clubs].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3);

    const rows: GridCriteria[] = picked.map((c) => ({
      type: "club" as const,
      value: (c as { id: string }).id,
      label: (c as { name: string }).name,
      imageUrl: (c as { logo_url: string | null }).logo_url || undefined,
    }));

    // 3 critérios para as colunas (mix de posição e nacionalidade)
    const columns: GridCriteria[] = [];
    const shuffledPos = [...positions].sort(() => Math.random() - 0.5);

    // Sempre 1 posição
    columns.push({
      type: "position",
      value: shuffledPos[0],
      label: positionLabels[shuffledPos[0]] || shuffledPos[0],
    });

    // 2ª coluna: nacionalidade se disponível
    if (viableNationalities.length > 0) {
      const shuffledNats = [...viableNationalities].sort(() => Math.random() - 0.5);
      columns.push({
        type: "nationality",
        value: shuffledNats[0],
        label: nationalityLabels[shuffledNats[0]] || shuffledNats[0],
      });
    } else {
      columns.push({
        type: "position",
        value: shuffledPos[1],
        label: positionLabels[shuffledPos[1]] || shuffledPos[1],
      });
    }

    // 3ª coluna: outra posição ou nacionalidade
    const usedPos = columns.filter((c) => c.type === "position").map((c) => c.value);
    const usedNats = columns.filter((c) => c.type === "nationality").map((c) => c.value);
    const availPos = positions.filter((p) => !usedPos.includes(p));
    const availNats = viableNationalities.filter((n) => !usedNats.includes(n));

    if (availNats.length > 0 && Math.random() > 0.5) {
      const pick = availNats[Math.floor(Math.random() * availNats.length)];
      columns.push({ type: "nationality", value: pick, label: nationalityLabels[pick] || pick });
    } else if (availPos.length > 0) {
      const pick = availPos[Math.floor(Math.random() * availPos.length)];
      columns.push({ type: "position", value: pick, label: positionLabels[pick] || pick });
    } else {
      const pick = shuffledPos[1] || shuffledPos[0];
      columns.push({ type: "position", value: pick, label: positionLabels[pick] || pick });
    }

    const challenge: GridChallenge = { rows, columns };
    const isValid = await validateChallenge(challenge);
    if (isValid) return challenge;
  }

  return null;
}

async function validateChallenge(challenge: GridChallenge): Promise<boolean> {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const count = await countValidPlayers(challenge.rows[row], challenge.columns[col]);
      if (count < 2) return false;
    }
  }
  return true;
}

async function countValidPlayers(rowCriteria: GridCriteria, colCriteria: GridCriteria): Promise<number> {
  let query = supabase
    .from("players_with_clubs")
    .select("player_id", { count: "exact", head: true })
    .eq("club_id", rowCriteria.value);

  if (colCriteria.type === "position") {
    query = query.eq("position", colCriteria.value);
  } else if (colCriteria.type === "nationality") {
    query = query.eq("nationality", colCriteria.value);
  }

  const { count } = await query;
  return count || 0;
}

/** Valida se um jogador atende AMBOS os critérios de uma célula */
export async function validateGuess(
  playerId: string,
  rowCriteria: GridCriteria,
  colCriteria: GridCriteria
): Promise<boolean> {
  const { data: clubMatch } = await supabase
    .from("player_clubs")
    .select("id")
    .eq("player_id", playerId)
    .eq("club_id", rowCriteria.value)
    .limit(1);

  if (!clubMatch || clubMatch.length === 0) return false;

  const { data: player } = await supabase
    .from("players")
    .select("position, nationality")
    .eq("id", playerId)
    .single();

  if (!player) return false;

  if (colCriteria.type === "position") return player.position === colCriteria.value;
  if (colCriteria.type === "nationality") return player.nationality === colCriteria.value;
  return false;
}

/** Busca jogadores por nome (autocomplete). Máximo 8 resultados. */
export async function searchPlayers(query: string, excludeIds: string[] = []): Promise<PlayerSearchResult[]> {
  if (query.length < 2) return [];

  const { data } = await supabase.rpc("search_players_unaccent", {
    search_query: query,
    exclude_ids: excludeIds,
  });

  return (data || []) as PlayerSearchResult[];
}
