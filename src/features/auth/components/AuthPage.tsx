import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";
import { LoginForm } from "./LoginForm";
import { SignUpForm } from "./SignUpForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

type AuthView = "login" | "signup" | "confirm" | "forgot";

export function AuthPage() {
  const { user } = useAuthStore();
  const [view, setView] = useState<AuthView>("login");

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      {view === "login" && (
        <LoginForm
          onSwitchToSignUp={() => setView("signup")}
          onForgotPassword={() => setView("forgot")}
        />
      )}

      {view === "signup" && (
        <SignUpForm
          onSwitchToLogin={() => setView("login")}
          onSuccess={() => setView("confirm")}
        />
      )}

      {view === "forgot" && (
        <ForgotPasswordForm onBackToLogin={() => setView("login")} />
      )}

      {view === "confirm" && (
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-5xl">📧</div>
          <h2 className="mb-3 text-2xl font-bold text-surface-50">
            Verifique seu email
          </h2>
          <p className="mb-6 text-surface-400">
            Enviamos um link de confirmação para o seu email. 
            Clique no link para ativar sua conta.
          </p>
          <button
            onClick={() => setView("login")}
            className="rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
          >
            Voltar para o login
          </button>
        </div>
      )}
    </div>
  );
}
