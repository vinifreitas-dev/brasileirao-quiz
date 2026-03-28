import { useState } from "react";
import { supabase } from "../../../lib/supabase";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // URL para onde o Supabase redireciona após clicar no link do email.
      // Deve apontar para a rota /reset-password do seu app.
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-5xl">📧</div>
        <h2 className="mb-3 text-2xl font-bold text-surface-50">
          Email enviado!
        </h2>
        <p className="mb-6 text-surface-400">
          Se existe uma conta com {email}, você receberá um link para redefinir sua senha.
        </p>
        <button
          onClick={onBackToLogin}
          className="rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
        >
          Voltar para o login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="mb-2 text-center text-2xl font-bold text-surface-50">
        Esqueceu a senha?
      </h2>
      <p className="mb-6 text-center text-sm text-surface-400">
        Digite seu email e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="forgot-email"
            className="mb-1 block text-sm font-medium text-surface-300"
          >
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            required
            placeholder="seu@email.com"
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
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-400">
        Lembrou a senha?{" "}
        <button
          onClick={onBackToLogin}
          className="font-medium text-primary-400 hover:text-primary-300"
        >
          Voltar ao login
        </button>
      </p>
    </div>
  );
}
