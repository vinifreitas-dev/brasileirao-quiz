import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

const navLinks = [
  { label: "Início", path: "/" },
  { label: "Grid", path: "/grid" },
  { label: "Connections", path: "/connections" },
  { label: "Wordle", path: "/wordle" },
  { label: "Quem é?", path: "/guess" },
  { label: "🏆", path: "/leaderboard" },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="border-b border-surface-800 bg-surface-900/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="text-2xl">⚽</span>
          <span className="hidden text-lg font-bold text-surface-100 sm:inline">
            Brasileirão Quiz
          </span>
        </Link>

        {/* Navegação */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.path);

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-lg px-2 py-1.5 text-sm font-medium no-underline transition-colors sm:px-3 ${
                  isActive
                    ? "bg-primary-600/20 text-primary-400"
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth: login ou perfil do usuário */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/profile"
                className="rounded-lg px-2 py-1.5 text-sm font-medium text-primary-400 no-underline transition-colors hover:bg-surface-800 sm:px-3"
              >
                {profile?.username || "Perfil"}
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-lg px-2 py-1.5 text-sm font-medium text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-200 sm:px-3"
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white no-underline transition-colors hover:bg-primary-700"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
