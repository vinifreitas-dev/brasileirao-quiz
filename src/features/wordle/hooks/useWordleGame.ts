import { create } from "zustand";
import type { WordleGuess, WordlePlayer } from "../types";
import { getRandomPlayer, compareGuess, validatePlayerName, getKeyboardState } from "../utils";
import { supabase } from "../../../lib/supabase";

const MAX_GUESSES = 6;

interface WordleStore {
  answer: WordlePlayer | null;
  guesses: WordleGuess[];
  currentInput: string;
  guessesLeft: number;
  completed: boolean;
  won: boolean;
  loading: boolean;
  error: string | null;
  keyboardState: Record<string, "correct" | "present" | "absent" | "unused">;

  startGame: () => Promise<void>;
  startFromConfig: (config: { player_id: string }) => Promise<void>;
  setInput: (value: string) => void;
  submitGuess: () => Promise<void>;
  resetGame: () => void;
}

export const useWordleStore = create<WordleStore>((set, get) => ({
  answer: null,
  guesses: [],
  currentInput: "",
  guessesLeft: MAX_GUESSES,
  completed: false,
  won: false,
  loading: false,
  error: null,
  keyboardState: {},

  startGame: async () => {
    set({ loading: true });
    const player = await getRandomPlayer();
    if (!player) {
      set({ loading: false, error: "Não foi possível carregar um jogador." });
      return;
    }
    set({
      answer: player,
      guesses: [],
      currentInput: "",
      guessesLeft: MAX_GUESSES,
      completed: false,
      won: false,
      loading: false,
      error: null,
      keyboardState: {},
    });
  },

  startFromConfig: async (config: { player_id: string }) => {
    set({ loading: true });
    const { data } = await supabase
      .from("players")
      .select("id, name, full_name, photo_url, nationality, position")
      .eq("id", config.player_id)
      .single();

    if (!data) {
      set({ loading: false, error: "Jogador não encontrado." });
      return;
    }
    set({
      answer: data as WordlePlayer,
      guesses: [],
      currentInput: "",
      guessesLeft: MAX_GUESSES,
      completed: false,
      won: false,
      loading: false,
      error: null,
      keyboardState: {},
    });
  },

  setInput: (value: string) => {
    // Só letras e espaços, máximo 15 caracteres
    const clean = value.replace(/[^a-zA-ZÀ-ÿ.\s-]/g, "").slice(0, 15);
    set({ currentInput: clean, error: null });
  },

  submitGuess: async () => {
    const { currentInput, answer, guesses, guessesLeft, completed } = get();
    if (!answer || completed || guessesLeft <= 0) return;

    const input = currentInput.trim();
    if (input.length < 2) {
      set({ error: "Digite pelo menos 2 letras." });
      return;
    }

    // Verificar se é um nome válido no banco
    const validName = await validatePlayerName(input);
    if (!validName) {
      set({ error: "Jogador não encontrado. Tente outro nome." });
      return;
    }

    // Comparar com a resposta
    const letters = compareGuess(validName, answer.name);
    const newGuess: WordleGuess = { letters, playerName: validName };
    const newGuesses = [...guesses, newGuess];
    const newGuessesLeft = guessesLeft - 1;

    // Verificar vitória (todas as letras verdes e mesmo tamanho)
    const isCorrect = validName.length === answer.name.length &&
      letters.every((l) => l.status === "correct");

    const isCompleted = isCorrect || newGuessesLeft <= 0;

    set({
      guesses: newGuesses,
      currentInput: "",
      guessesLeft: newGuessesLeft,
      completed: isCompleted,
      won: isCorrect,
      error: null,
      keyboardState: getKeyboardState(newGuesses),
    });
  },

  resetGame: () => {
    set({
      answer: null,
      guesses: [],
      currentInput: "",
      guessesLeft: MAX_GUESSES,
      completed: false,
      won: false,
      error: null,
      keyboardState: {},
    });
  },
}));
