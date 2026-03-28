export interface GuessPlayer {
  id: string;
  name: string;
  full_name: string;
  photo_url: string | null;
  nationality: string;
  position: string;
  clubs: string[]; // nomes dos clubes por onde passou
}

export interface Hint {
  label: string;
  value: string;
  icon: string;
  revealed: boolean;
}
