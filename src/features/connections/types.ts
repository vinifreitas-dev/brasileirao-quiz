export interface ConnectionsPlayer {
  id: string;
  name: string;
  photo_url: string | null;
}

export interface ConnectionsGroup {
  category: string;         // "Jogaram no Flamengo"
  difficulty: 1 | 2 | 3 | 4; // 1=fácil (amarelo), 4=difícil (roxo)
  players: ConnectionsPlayer[];
  revealed: boolean;
}

export interface ConnectionsChallenge {
  groups: ConnectionsGroup[];
  /** Todos os 16 jogadores embaralhados */
  shuffledPlayers: ConnectionsPlayer[];
}
