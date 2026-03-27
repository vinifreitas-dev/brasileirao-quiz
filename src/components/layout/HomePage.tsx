import { Link } from "react-router-dom";

// Dados dos jogos disponíveis na plataforma.
// Conforme implementarmos cada jogo, marcamos como available: true.
const games = [
  {
    id: "grid",
    title: "Grid Brasileirão",
    description:
      "Preencha a grade 3x3 com jogadores que atendam aos critérios de cada linha e coluna.",
    emoji: "🟩",
    path: "/grid",
    available: true,
  },
  {
    id: "connections",
    title: "Connections BR",
    description:
      "Agrupe 16 jogadores em 4 categorias secretas. Cuidado com as armadilhas!",
    emoji: "🔗",
    path: "/connections",
    available: false,
  },
  {
    id: "wordle",
    title: "Wordle Boleiro",
    description:
      "Adivinhe o nome do jogador em 6 tentativas com dicas coloridas.",
    emoji: "🔤",
    path: "/wordle",
    available: false,
  },
  {
    id: "guess",
    title: "Quem é o Jogador?",
    description:
      "Faça perguntas sim/não para descobrir o jogador misterioso do dia.",
    emoji: "🕵️",
    path: "/guess",
    available: false,
  },
];

export function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
      {/* Hero section */}
      <section className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-bold text-surface-50 md:text-5xl">
          ⚽ Brasileirão Quiz
        </h1>
        <p className="mx-auto max-w-lg text-lg text-surface-400">
          Teste seus conhecimentos sobre o futebol brasileiro com desafios
          diários. Novos jogos todos os dias à meia-noite!
        </p>
      </section>

      {/* Grid de jogos */}
      <section className="grid gap-4 sm:grid-cols-2">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </section>
    </div>
  );
}

interface GameCardProps {
  game: (typeof games)[number];
}

function GameCard({ game }: GameCardProps) {
  // Componente condicional: se o jogo está disponível, renderiza
  // como Link (clicável). Se não, renderiza como div (desabilitado).
  const cardContent = (
    <>
      <div className="mb-3 text-4xl">{game.emoji}</div>
      <h3 className="mb-1 text-lg font-semibold text-surface-100">
        {game.title}
      </h3>
      <p className="text-sm text-surface-400">{game.description}</p>
      {!game.available && (
        <span className="mt-3 inline-block rounded-full bg-surface-800 px-3 py-1 text-xs text-surface-500">
          Em breve
        </span>
      )}
    </>
  );

  const baseClasses =
    "rounded-xl border p-6 text-left transition-all duration-200";

  if (game.available) {
    return (
      <Link
        to={game.path}
        className={`${baseClasses} border-surface-700 bg-surface-900 no-underline hover:border-primary-600 hover:bg-surface-800`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      className={`${baseClasses} cursor-not-allowed border-surface-800 bg-surface-900/50 opacity-60`}
    >
      {cardContent}
    </div>
  );
}
