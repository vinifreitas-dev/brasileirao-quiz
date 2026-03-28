import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-5xl">✅</div>
          <h2 className="mb-3 text-2xl font-bold text-surface-50">
            Senha atualizada!
          </h2>
          <p className="mb-6 text-surface-400">
            Sua senha foi redefinida com sucesso.
          </p>
          <button
            onClick={() => navigate("/")}
            className="rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
          >
            Ir para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <h2 className="mb-6 text-center text-2xl font-bold text-surface-50">
          Nova senha
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="new-password"
              className="mb-1 block text-sm font-medium text-surface-300"
            >
              Nova senha
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-primary-500"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-new-password"
              className="mb-1 block text-sm font-medium text-surface-300"
            >
              Confirmar nova senha
            </label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
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
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
