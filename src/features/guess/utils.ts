import { supabase } from "../../lib/supabase";
import type { GuessPlayer, Hint } from "./types";

const nationalityLabels: Record<string, string> = {
  Brazil: "Brasileiro",
  Argentina: "Argentino",
  Uruguay: "Uruguaio",
  Colombia: "Colombiano",
  Paraguay: "Paraguaio",
  Chile: "Chileno",
  Ecuador: "Equatoriano",
  Venezuela: "Venezuelano",
  Peru: "Peruano",
};

const positionLabels: Record<string, string> = {
  Goalkeeper: "Goleiro",
  Defender: "Zagueiro",
  Midfielder: "Meia",
  Attacker: "Atacante",
};

/**
 * Busca um jogador aleatório com pelo menos 1 clube vinculado.
 * Retorna os dados do jogador + lista de clubes por onde passou.
 */
export async function getRandomGuessPlayer(): Promise<GuessPlayer | null> {
  // Buscar jogadores que têm vínculos com clubes
  const { data: playerClubs } = await supabase
    .from("notable_players_with_clubs")
    .select("player_id, player_name, nationality, position, player_photo, club_name");

  if (!playerClubs || playerClubs.length === 0) return null;

  // Agrupar por jogador
  const playerMap = new Map<string, {
    id: string;
    name: string;
    nationality: string;
    position: string;
    photo_url: string | null;
    clubs: Set<string>;
  }>();

  for (const row of playerClubs) {
    const r = row as {
      player_id: string;
      player_name: string;
      nationality: string;
      position: string;
      player_photo: string | null;
      club_name: string;
    };

    if (!playerMap.has(r.player_id)) {
      playerMap.set(r.player_id, {
        id: r.player_id,
        name: r.player_name,
        nationality: r.nationality,
        position: r.position,
        photo_url: r.player_photo,
        clubs: new Set(),
      });
    }
    playerMap.get(r.player_id)!.clubs.add(r.club_name);
  }

  // Filtrar jogadores com pelo menos 1 clube
  const eligible = Array.from(playerMap.values()).filter((p) => p.clubs.size >= 1);
  if (eligible.length === 0) return null;

  // Sortear um
  const picked = eligible[Math.floor(Math.random() * eligible.length)];

  // Buscar full_name
  const { data: fullData } = await supabase
    .from("players")
    .select("full_name")
    .eq("id", picked.id)
    .single();

  return {
    id: picked.id,
    name: picked.name,
    full_name: fullData?.full_name || picked.name,
    photo_url: picked.photo_url,
    nationality: picked.nationality,
    position: picked.position,
    clubs: Array.from(picked.clubs),
  };
}

/**
 * Gera as dicas progressivas para um jogador.
 * Ordem pensada para ir do mais genérico ao mais específico:
 * 1. Posição
 * 2. Nacionalidade
 * 3. Primeiro clube
 * 4. Segundo clube (se tiver)
 * 5. Primeira letra do nome
 * 6. Número de letras do nome
 */
export function generateHints(player: GuessPlayer): Hint[] {
  const hints: Hint[] = [
    {
      label: "Posição",
      value: positionLabels[player.position] || player.position,
      icon: "🏃",
      revealed: false,
    },
    {
      label: "Nacionalidade",
      value: nationalityLabels[player.nationality] || player.nationality,
      icon: "🌍",
      revealed: false,
    },
    {
      label: "Clube",
      value: player.clubs[0] || "Desconhecido",
      icon: "🏟️",
      revealed: false,
    },
  ];

  // Se passou por mais de 1 clube, adicionar como dica extra
  if (player.clubs.length > 1) {
    hints.push({
      label: "Outro clube",
      value: player.clubs[1],
      icon: "🔄",
      revealed: false,
    });
  }

  hints.push({
    label: "Primeira letra",
    value: player.name[0].toUpperCase(),
    icon: "🔤",
    revealed: false,
  });

  hints.push({
    label: "Letras no nome",
    value: `${player.name.length} letras`,
    icon: "📏",
    revealed: false,
  });

  return hints;
}
