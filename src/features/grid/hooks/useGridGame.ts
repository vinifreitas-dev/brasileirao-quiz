import { create } from "zustand";
import type { GridCellState, GridChallenge } from "../types";
import { generateGridChallenge, validateGuess } from "../utils";

interface GridStore {
  // Estado
  challenge: GridChallenge | null;
  cells: GridCellState[][];
  guessesLeft: number;
  completed: boolean;
  score: number;
  usedPlayerIds: string[];
  selectedCell: { row: number; col: number } | null;
  loading: boolean;

  // Ações
  startGame: () => Promise<void>;
  selectCell: (row: number, col: number) => void;
  closeSearch: () => void;
  submitGuess: (playerId: string, playerName: string, playerPhoto: string | null) => Promise<void>;
  resetGame: () => void;
}

function createEmptyCells(): GridCellState[][] {
  return Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, col) => ({
      row,
      col,
      playerId: null,
      playerName: null,
      playerPhoto: null,
      status: "empty" as const,
    }))
  );
}

export const useGridStore = create<GridStore>((set, get) => ({
  challenge: null,
  cells: createEmptyCells(),
  guessesLeft: 9,
  completed: false,
  score: 0,
  usedPlayerIds: [],
  selectedCell: null,
  loading: false,

  startGame: async () => {
    set({ loading: true });
    const challenge = await generateGridChallenge();
    if (!challenge) {
      set({ loading: false });
      return;
    }
    set({
      challenge,
      cells: createEmptyCells(),
      guessesLeft: 9,
      completed: false,
      score: 0,
      usedPlayerIds: [],
      selectedCell: null,
      loading: false,
    });
  },

  selectCell: (row: number, col: number) => {
    const { cells, completed } = get();
    if (completed) return;
    if (cells[row][col].status !== "empty") return;
    set({ selectedCell: { row, col } });
  },

  closeSearch: () => set({ selectedCell: null }),

  submitGuess: async (playerId: string, playerName: string, playerPhoto: string | null) => {
    const { selectedCell, challenge, cells, guessesLeft, score, usedPlayerIds } = get();
    if (!selectedCell || !challenge) return;

    const { row, col } = selectedCell;
    const rowCriteria = challenge.rows[row];
    const colCriteria = challenge.columns[col];

    const isCorrect = await validateGuess(playerId, rowCriteria, colCriteria);

    // Clonar a matriz de células (imutabilidade)
    const newCells = cells.map((r) => r.map((c) => ({ ...c })));
    newCells[row][col] = {
      row,
      col,
      playerId,
      playerName,
      playerPhoto,
      status: isCorrect ? "correct" : "wrong",
    };

    const newGuessesLeft = guessesLeft - 1;
    const newScore = isCorrect ? score + 1 : score;
    const filledCells = newCells.flat().filter((c) => c.status !== "empty").length;
    const isCompleted = newGuessesLeft <= 0 || filledCells >= 9;

    set({
      cells: newCells,
      guessesLeft: newGuessesLeft,
      score: newScore,
      usedPlayerIds: [...usedPlayerIds, playerId],
      completed: isCompleted,
      selectedCell: null,
    });
  },

  resetGame: () => {
    set({
      challenge: null,
      cells: createEmptyCells(),
      guessesLeft: 9,
      completed: false,
      score: 0,
      usedPlayerIds: [],
      selectedCell: null,
    });
  },
}));
