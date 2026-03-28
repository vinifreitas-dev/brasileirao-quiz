import { supabase } from "../../lib/supabase";
import type { ConnectionsChallenge, ConnectionsGroup, ConnectionsPlayer } from "./types";

/**
 * Gera um desafio Connections selecionando 4 categorias do banco,
 * cada uma com exatamente 4 jogadores, sem repetição.
 *
 * Estratégia:
 * 1. Buscar todas as categorias com seus jogadores
 * 2. Filtrar categorias com pelo menos 4 jogadores
 * 3. Sortear 4 categorias garantindo que nenhum jogador repita
 * 4. De cada categoria, sortear exatamente 4 jogadores
 * 5. Embaralhar todos os 16 jogadores
 */
export async function generateConnectionsChallenge(): Promise<ConnectionsChallenge | null> {
  // Buscar categorias com contagem de jogadores
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type");

  if (!categories || categories.length < 4) return null;

  // Para cada categoria, buscar seus jogadores
  const categoryWithPlayers: Array<{
    id: string;
    name: string;
    type: string;
    players: ConnectionsPlayer[];
  }> = [];

  for (const cat of categories) {
    const { data: links } = await supabase
      .from("player_categories")
      .select("player_id")
      .eq("category_id", cat.id);

    if (!links || links.length < 4) continue;

    // Buscar dados dos jogadores
    const playerIds = links.map((l) => (l as { player_id: string }).player_id);

    const { data: players } = await supabase
      .from("players")
      .select("id, name, photo_url")
      .in("id", playerIds);

    if (!players || players.length < 4) continue;

    categoryWithPlayers.push({
      id: cat.id,
      name: cat.name,
      type: (cat as { type: string }).type,
      players: players as ConnectionsPlayer[],
    });
  }

  if (categoryWithPlayers.length < 4) return null;

  // Tentar montar 4 categorias sem jogadores repetidos
  for (let attempt = 0; attempt < 20; attempt++) {
    const shuffled = [...categoryWithPlayers].sort(() => Math.random() - 0.5);
    const selectedGroups: ConnectionsGroup[] = [];
    const usedPlayerIds = new Set<string>();

    for (const cat of shuffled) {
      if (selectedGroups.length >= 4) break;

      // Filtrar jogadores que ainda não foram usados
      const available = cat.players.filter((p) => !usedPlayerIds.has(p.id));
      if (available.length < 4) continue;

      // Sortear 4 jogadores desta categoria
      const picked = [...available].sort(() => Math.random() - 0.5).slice(0, 4);

      // Verificar que nenhum foi usado
      const allNew = picked.every((p) => !usedPlayerIds.has(p.id));
      if (!allNew) continue;

      picked.forEach((p) => usedPlayerIds.add(p.id));

      selectedGroups.push({
        category: cat.name,
        difficulty: (selectedGroups.length + 1) as 1 | 2 | 3 | 4,
        players: picked,
        revealed: false,
      });
    }

    if (selectedGroups.length === 4) {
      // Embaralhar todos os 16 jogadores
      const allPlayers = selectedGroups.flatMap((g) => g.players);
      const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);

      return {
        groups: selectedGroups,
        shuffledPlayers,
      };
    }
  }

  return null;
}
