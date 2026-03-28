export type LetterStatus = "correct" | "present" | "absent" | "empty";

export interface WordleLetter {
  char: string;
  status: LetterStatus;
}

export interface WordleGuess {
  letters: WordleLetter[];
  playerName: string;
}

export interface WordlePlayer {
  id: string;
  name: string;
  full_name: string;
  photo_url: string | null;
  nationality: string;
  position: string;
}
