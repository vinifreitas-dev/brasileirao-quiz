import { useState } from "react";
import { useAuthStore } from "../../../stores/authStore";

interface LoginFormProps {
  onSwitchToSignUp: () => void;
}

export function LoginForm({ onSwitchToSignUp }: LoginFormProps) {
  const { signIn, loading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    // preventDefault evita que o formulário faça reload da página
    // (comportamento padrão de <form> no HTML)
    e.preventDefault();
    await signIn(email, password);
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="mb-6 text-center text-2xl font-bold text-surface-50">
        Entrar
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="login-email"
            className="mb-1 block text-sm font-medium text-surface-300"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) clearError();
            }}
            required
            placeholder="seu@email.com"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1 block text-sm font-medium text-surface-300"
          >
            Senha
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-primary-500"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-wrong/10 px-3 py-2 text-sm text-wrong">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-400">
        Não tem conta?{" "}
        <button
          onClick={onSwitchToSignUp}
          className="font-medium text-primary-400 hover:text-primary-300"
        >
          Criar conta
        </button>
      </p>
    </div>
  );
}
