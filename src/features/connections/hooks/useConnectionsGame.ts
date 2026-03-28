import { create } from "zustand";
import type { ConnectionsChallenge, ConnectionsGroup, ConnectionsPlayer } from "../types";
import { generateConnectionsChallenge } from "../utils";

interface ConnectionsStore {
  // Estado
  challenge: ConnectionsChallenge | null;
  remainingPlayers: ConnectionsPlayer[];
  revealedGroups: ConnectionsGroup[];
  selectedIds: string[];
  livesLeft: number;
  completed: boolean;
  won: boolean;
  loading: boolean;
  shakeWrong: boolean;

  // Ações
  startGame: () => Promise<void>;
  startFromConfig: (challenge: ConnectionsChallenge) => void;
  toggleSelect: (playerId: string) => void;
  submitGuess: () => void;
  deselectAll: () => void;
  resetGame: () => void;
}

export const useConnectionsStore = create<ConnectionsStore>((set, get) => ({
  challenge: null,
  remainingPlayers: [],
  revealedGroups: [],
  selectedIds: [],
  livesLeft: 4,
  completed: false,
  won: false,
  loading: false,
  shakeWrong: false,

  startGame: async () => {
    set({ loading: true });
    const challenge = await generateConnectionsChallenge();
    if (!challenge) {
      set({ loading: false });
      return;
    }
    set({
      challenge,
      remainingPlayers: challenge.shuffledPlayers,
      revealedGroups: [],
      selectedIds: [],
      livesLeft: 4,
      completed: false,
      won: false,
      loading: false,
      shakeWrong: false,
    });
  },

  startFromConfig: (challenge: ConnectionsChallenge) => {
    set({
      challenge,
      remainingPlayers: challenge.shuffledPlayers,
      revealedGroups: [],
      selectedIds: [],
      livesLeft: 4,
      completed: false,
      won: false,
      loading: false,
      shakeWrong: false,
    });
  },

  toggleSelect: (playerId: string) => {
    const { selectedIds, completed } = get();
    if (completed) return;

    if (selectedIds.includes(playerId)) {
      // Desselecionar
      set({ selectedIds: selectedIds.filter((id) => id !== playerId) });
    } else if (selectedIds.length < 4) {
      // Selecionar (máximo 4)
      set({ selectedIds: [...selectedIds, playerId] });
    }
  },

  submitGuess: () => {
    const { selectedIds, challenge, remainingPlayers, revealedGroups, livesLeft } = get();
    if (!challenge || selectedIds.length !== 4) return;

    // Verificar se os 4 selecionados pertencem ao mesmo grupo
    const matchedGroup = challenge.groups.find((group) => {
      const groupIds = group.players.map((p) => p.id);
      return selectedIds.every((id) => groupIds.includes(id));
    });

    if (matchedGroup) {
      // Acerto! Revelar o grupo
      const newRevealed = [...revealedGroups, { ...matchedGroup, revealed: true }];
      const newRemaining = remainingPlayers.filter(
        (p) => !selectedIds.includes(p.id)
      );

      const isCompleted = newRevealed.length === 4;

      set({
        revealedGroups: newRevealed,
        remainingPlayers: newRemaining,
        selectedIds: [],
        completed: isCompleted,
        won: isCompleted,
      });
    } else {
      // Erro! Perder uma vida
      const newLives = livesLeft - 1;
      const isCompleted = newLives <= 0;

      // Ativar animação de shake
      set({ shakeWrong: true });
      setTimeout(() => set({ shakeWrong: false }), 600);

      if (isCompleted) {
        // Game over: revelar todos os grupos restantes
        const unrevealed = challenge.groups.filter(
          (g) => !revealedGroups.some((r) => r.category === g.category)
        );
        set({
          livesLeft: 0,
          completed: true,
          won: false,
          selectedIds: [],
          revealedGroups: [
            ...revealedGroups,
            ...unrevealed.map((g) => ({ ...g, revealed: true })),
          ],
          remainingPlayers: [],
        });
      } else {
        set({
          livesLeft: newLives,
          selectedIds: [],
        });
      }
    }
  },

  deselectAll: () => set({ selectedIds: [] }),

  resetGame: () => {
    set({
      challenge: null,
      remainingPlayers: [],
      revealedGroups: [],
      selectedIds: [],
      livesLeft: 4,
      completed: false,
      won: false,
      shakeWrong: false,
    });
  },
}));
