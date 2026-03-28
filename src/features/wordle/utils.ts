import { supabase } from "../../lib/supabase";
import type { WordleLetter, WordlePlayer } from "./types";

/**
 * Remove acentos de uma string para comparação.
 * "Cássio" → "Cassio", "João" → "Joao"
 */
function normalize(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Busca um jogador aleatório do banco para ser a resposta.
 * Filtra nomes com pelo menos 4 letras para o jogo ser interessante.
 */
export async function getRandomPlayer(): Promise<WordlePlayer | null> {
  // Buscar total de jogadores elegíveis
  const { count } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .gte("name", "AAAA"); // nomes com pelo menos 4 chars

  if (!count || count === 0) return null;

  // Sortear um índice aleatório e buscar o jogador
  const randomIndex = Math.floor(Math.random() * count);

  const { data } = await supabase
    .from("players")
    .select("id, name, full_name, photo_url, nationality, position")
    .gte("name", "AAAA")
    .range(randomIndex, randomIndex);

  if (!data || data.length === 0) return null;

  return data[0] as WordlePlayer;
}

/**
 * Compara um palpite com a resposta, letra por letra.
 *
 * Lógica (igual ao Wordle original):
 * 1. Primeiro passo: marcar letras VERDES (posição correta)
 * 2. Segundo passo: marcar letras AMARELAS (letra existe mas posição errada)
 * 3. Resto: CINZA (letra não existe na resposta)
 *
 * Comparação ignora acentos: "Cassio" acerta "Cássio"
 */
export function compareGuess(guess: string, answer: string): WordleLetter[] {
  const guessNorm = normalize(guess);
  const answerNorm = normalize(answer);

  // Pad ou trim para igualar tamanhos
  const maxLen = Math.max(guessNorm.length, answerNorm.length);
  const result: WordleLetter[] = [];

  // Rastrear letras da resposta que já foram "consumidas"
  const answerUsed = new Array(answerNorm.length).fill(false);
  const guessStatus: ("correct" | "present" | "absent")[] = new Array(guessNorm.length).fill("absent");

  // Passo 1: marcar verdes (posição exata)
  for (let i = 0; i < guessNorm.length; i++) {
    if (i < answerNorm.length && guessNorm[i] === answerNorm[i]) {
      guessStatus[i] = "correct";
      answerUsed[i] = true;
    }
  }

  // Passo 2: marcar amarelos (letra existe em outra posição)
  for (let i = 0; i < guessNorm.length; i++) {
    if (guessStatus[i] === "correct") continue;

    for (let j = 0; j < answerNorm.length; j++) {
      if (!answerUsed[j] && guessNorm[i] === answerNorm[j]) {
        guessStatus[i] = "present";
        answerUsed[j] = true;
        break;
      }
    }
  }

  // Montar resultado com os caracteres originais (com acento)
  for (let i = 0; i < maxLen; i++) {
    if (i < guess.length) {
      result.push({
        char: guess[i].toUpperCase(),
        status: guessStatus[i] || "absent",
      });
    }
  }

  return result;
}

/**
 * Verifica se o palpite é um nome de jogador válido no banco.
 * Retorna o nome exato do jogador se encontrado (com acentos).
 */
export async function validatePlayerName(guess: string): Promise<string | null> {
  const { data } = await supabase.rpc("search_players_unaccent", {
    search_query: guess,
    exclude_ids: [],
  });

  if (!data || data.length === 0) return null;

  // Procurar match exato (sem acento)
  const guessNorm = normalize(guess);
  const exactMatch = (data as Array<{ name: string }>).find(
    (p) => normalize(p.name) === guessNorm
  );

  return exactMatch ? exactMatch.name : null;
}

/**
 * Busca sugestões de jogadores enquanto digita.
 */
export async function searchWordlePlayers(query: string): Promise<Array<{ name: string }>> {
  if (query.length < 2) return [];

  const { data } = await supabase.rpc("search_players_unaccent", {
    search_query: query,
    exclude_ids: [],
  });

  return (data || []) as Array<{ name: string }>;
}

/**
 * Retorna o estado de cada tecla do teclado baseado nos palpites anteriores.
 * Verde > Amarelo > Cinza (a melhor informação prevalece).
 */
export function getKeyboardState(
  guesses: Array<{ letters: WordleLetter[] }>
): Record<string, "correct" | "present" | "absent" | "unused"> {
  const state: Record<string, "correct" | "present" | "absent" | "unused"> = {};

  for (const guess of guesses) {
    for (const letter of guess.letters) {
      const key = normalize(letter.char);
      const current = state[key];

      // Hierarquia: correct > present > absent > unused
      if (letter.status === "correct") {
        state[key] = "correct";
      } else if (letter.status === "present" && current !== "correct") {
        state[key] = "present";
      } else if (letter.status === "absent" && !current) {
        state[key] = "absent";
      }
    }
  }

  return state;
}
