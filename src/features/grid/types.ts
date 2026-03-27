export interface GridCellState {
  row: number;
  col: number;
  playerId: string | null;
  playerName: string | null;
  playerPhoto: string | null;
  status: "empty" | "correct" | "wrong";
}

export interface GridCriteria {
  type: "club" | "nationality" | "position";
  value: string;
  label: string;
  imageUrl?: string;
}

export interface GridChallenge {
  rows: GridCriteria[];
  columns: GridCriteria[];
}

export interface PlayerSearchResult {
  id: string;
  name: string;
  photo_url: string | null;
  position: string;
  nationality: string;
}
