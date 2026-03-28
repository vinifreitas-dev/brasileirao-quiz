import { create } from "zustand";
import type { GuessPlayer, Hint } from "../types";
import { getRandomGuessPlayer, generateHints } from "../utils";
import { supabase } from "../../../lib/supabase";

const MAX_GUESSES = 3;

interface GuessStore {
  player: GuessPlayer | null;
  hints: Hint[];
  hintsRevealed: number;
  guessesLeft: number;
  completed: boolean;
  won: boolean;
  loading: boolean;
  searchQuery: string;
  searchResults: Array<{ id: string; name: string; photo_url: string | null }>;
  searching: boolean;

  startGame: () => Promise<void>;
  startFromConfig: (config: { player_id: string }) => Promise<void>;
  revealHint: () => void;
  setSearchQuery: (query: string) => void;
  searchPlayers: () => Promise<void>;
  submitGuess: (playerId: string, playerName: string) => void;
  resetGame: () => void;
}

export const useGuessStore = create<GuessStore>((set, get) => ({
  player: null,
  hints: [],
  hintsRevealed: 0,
  guessesLeft: MAX_GUESSES,
  completed: false,
  won: false,
  loading: false,
  searchQuery: "",
  searchResults: [],
  searching: false,

  startGame: async () => {
    set({ loading: true });
    const player = await getRandomGuessPlayer();
    if (!player) {
      set({ loading: false });
      return;
    }
    const hints = generateHints(player);
    // Revelar a primeira dica automaticamente
    hints[0].revealed = true;

    set({
      player,
      hints,
      hintsRevealed: 1,
      guessesLeft: MAX_GUESSES,
      completed: false,
      won: false,
      loading: false,
      searchQuery: "",
      searchResults: [],
    });
  },

  startFromConfig: async (config: { player_id: string }) => {
    set({ loading: true });

    // Buscar dados do jogador
    const { data: playerData } = await supabase
      .from("players")
      .select("id, name, full_name, photo_url, nationality, position")
      .eq("id", config.player_id)
      .single();

    if (!playerData) {
      set({ loading: false });
      return;
    }

    // Buscar clubes do jogador
    const { data: clubData } = await supabase
      .from("players_with_clubs")
      .select("club_name")
      .eq("player_id", config.player_id);

    const clubs = [...new Set((clubData || []).map((c: { club_name: string }) => c.club_name))];

    const player: GuessPlayer = {
      id: playerData.id,
      name: playerData.name,
      full_name: playerData.full_name,
      photo_url: playerData.photo_url,
      nationality: playerData.nationality,
      position: playerData.position,
      clubs,
    };

    const hints = generateHints(player);
    hints[0].revealed = true;

    set({
      player,
      hints,
      hintsRevealed: 1,
      guessesLeft: MAX_GUESSES,
      completed: false,
      won: false,
      loading: false,
      searchQuery: "",
      searchResults: [],
    });
  },

  revealHint: () => {
    const { hints, hintsRevealed } = get();
    if (hintsRevealed >= hints.length) return;

    const newHints = hints.map((h, i) =>
      i === hintsRevealed ? { ...h, revealed: true } : h
    );

    set({
      hints: newHints,
      hintsRevealed: hintsRevealed + 1,
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  searchPlayers: async () => {
    const { searchQuery } = get();
    if (searchQuery.length < 2) {
      set({ searchResults: [] });
      return;
    }

    set({ searching: true });

    const { data } = await supabase.rpc("search_players_unaccent", {
      search_query: searchQuery,
      exclude_ids: [],
    });

    set({
      searchResults: (data || []) as Array<{ id: string; name: string; photo_url: string | null }>,
      searching: false,
    });
  },

  submitGuess: (playerId: string, _playerName: string) => {
    const { player, guessesLeft } = get();
    if (!player || guessesLeft <= 0) return;

    const isCorrect = playerId === player.id;
    const newGuessesLeft = guessesLeft - 1;
    const isCompleted = isCorrect || newGuessesLeft <= 0;

    set({
      guessesLeft: newGuessesLeft,
      completed: isCompleted,
      won: isCorrect,
      searchQuery: "",
      searchResults: [],
    });

    // Se errou mas ainda tem tentativas, revelar próxima dica automaticamente
    if (!isCorrect && !isCompleted) {
      get().revealHint();
    }
  },

  resetGame: () => {
    set({
      player: null,
      hints: [],
      hintsRevealed: 0,
      guessesLeft: MAX_GUESSES,
      completed: false,
      won: false,
      searchQuery: "",
      searchResults: [],
    });
  },
}));
