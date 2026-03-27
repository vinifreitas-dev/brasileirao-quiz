import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard protege rotas que exigem autenticação.
 * Envolva o componente da página com AuthGuard:
 * 
 *   <AuthGuard><ProfilePage /></AuthGuard>
 * 
 * Se o usuário não está logado, redireciona para /auth.
 * Se está carregando a sessão, mostra um spinner.
 * Se está logado, renderiza o children normalmente.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuthStore();

  // Enquanto verifica a sessão, mostra loading.
  // Sem isso, haveria um flash de redirecionamento
  // enquanto o Supabase verifica o token.
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-surface-400">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
