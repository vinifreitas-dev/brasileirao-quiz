import { useState } from "react";
import { useAuthStore } from "../../../stores/authStore";

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export function SignUpForm({ onSwitchToLogin, onSuccess }: SignUpFormProps) {
  const { signUp, loading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");

    // Validações locais (antes de chamar a API)
    if (username.length < 3) {
      setLocalError("O nome de usuário deve ter pelo menos 3 caracteres.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setLocalError("O nome de usuário pode conter apenas letras, números e _");
      return;
    }

    if (password.length < 6) {
      setLocalError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("As senhas não coincidem.");
      return;
    }

    const success = await signUp(email, password, username);
    if (success) {
      onSuccess();
    }
  }

  const displayError = localError || error;

  return (
    <div className="w-full max-w-sm">
      <h2 className="mb-6 text-center text-2xl font-bold text-surface-50">
        Criar Conta
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="signup-email"
            className="mb-1 block text-sm font-medium text-surface-300"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) clearError();
              setLocalError("");
            }}
            required
            placeholder="seu@email.com"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="signup-username"
            className="mb-1 block text-sm font-medium text-surface-300"
          >
            Nome de usuário
          </label>
          <input
            id="signup-username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) clearError();
              setLocalError("");
            }}
            required
            placeholder="seu_username"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-primary-500"
          />
          <p className="mt-1 text-xs text-surface-500">
            Letras, números e _ (mínimo 3 caracteres)
          </p>
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="mb-1 block text-sm font-medium text-surface-300"
          >
            Senha
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLocalError("");
            }}
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="signup-confirm"
            className="mb-1 block text-sm font-medium text-surface-300"
          >
            Confirmar senha
          </label>
          <input
            id="signup-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setLocalError("");
            }}
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-primary-500"
          />
        </div>

        {displayError && (
          <p className="rounded-lg bg-wrong/10 px-3 py-2 text-sm text-wrong">
            {displayError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-400">
        Já tem conta?{" "}
        <button
          onClick={onSwitchToLogin}
          className="font-medium text-primary-400 hover:text-primary-300"
        >
          Entrar
        </button>
      </p>
    </div>
  );
}
