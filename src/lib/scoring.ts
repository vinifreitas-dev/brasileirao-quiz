/**
 * Funções de cálculo de pontuação (0–1000) para os desafios diários.
 * Cada função recebe os dados do jogo e retorna um número inteiro entre 0 e 1000.
 */

/** Arredonda para inteiro e garante o intervalo [0, 1000] */
function clamp(value: number): number {
  return Math.min(1000, Math.max(0, Math.round(value)));
}

function speedBonus(timeSeconds: number, maxBonus: number, cap = 300): number {
  if (timeSeconds >= cap) return 0;
  return Math.round(maxBonus * (1 - timeSeconds / cap));
}

// ────────────────────────────────────────────────────────────
// Grid  (máx 1000)
//   Base      : 80 × acertos (0-9)    → 0–720
//   Perfeito  : +80 se 9/9
//   Velocidade: 200 × (1 - t/300)     → 0–200
// ────────────────────────────────────────────────────────────
export function calcGridScore(params: {
  correct: number;     // 0–9
  timeSeconds: number;
}): number {
  const base = 80 * params.correct;
  const perfect = params.correct === 9 ? 80 : 0;
  const speed = speedBonus(params.timeSeconds, 200);
  return clamp(base + perfect + speed);
}

// ────────────────────────────────────────────────────────────
// Connections  (máx 1000)
//   Base        : 200 × grupos acertados (0-4) → 0–800
//   Sem erro    : +100
//   Velocidade  : 100 × (1 - t/300)            → 0–100
// ────────────────────────────────────────────────────────────
export function calcConnectionsScore(params: {
  groupsCorrect: number;  // 0–4
  noErrors: boolean;
  timeSeconds: number;
}): number {
  const base = 200 * params.groupsCorrect;
  const noError = params.noErrors ? 100 : 0;
  const speed = speedBonus(params.timeSeconds, 100);
  return clamp(base + noError + speed);
}

// ────────────────────────────────────────────────────────────
// Wordle  (máx 1000)
//   Base        : 600/500/400/300/200/100 pela tentativa usada (0 se errou)
//   Bônus acerto: +200
//   Velocidade  : 200 × (1 - t/300)   → 0–200 (só se acertou)
// ────────────────────────────────────────────────────────────
const WORDLE_BASE: Record<number, number> = {
  1: 600, 2: 500, 3: 400, 4: 300, 5: 200, 6: 100,
};

export function calcWordleScore(params: {
  won: boolean;
  attempts: number;   // quantas tentativas usadas (1-6)
  timeSeconds: number;
}): number {
  if (!params.won) return 0;
  const base = WORDLE_BASE[params.attempts] ?? 100;
  const speed = speedBonus(params.timeSeconds, 200);
  return clamp(base + 200 + speed);
}

// ────────────────────────────────────────────────────────────
// Guess / Quem é o Jogador  (máx 1000)
//   Base        : 500/400/300/200/150/100 pela dica revelada (0 se errou)
//   Bônus acerto: +300
//   Velocidade  : 200 × (1 - t/300)   → 0–200 (só se acertou)
// ────────────────────────────────────────────────────────────
const GUESS_BASE: Record<number, number> = {
  1: 500, 2: 400, 3: 300, 4: 200, 5: 150, 6: 100,
};

export function calcGuessScore(params: {
  won: boolean;
  hintsRevealed: number;  // quantas dicas foram reveladas (1-6)
  timeSeconds: number;
}): number {
  if (!params.won) return 0;
  const base = GUESS_BASE[params.hintsRevealed] ?? 100;
  const speed = speedBonus(params.timeSeconds, 200);
  return clamp(base + 300 + speed);
}
