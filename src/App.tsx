import { useEffect } from "react";
import { AppRouter } from "./Router";
import { useAuthStore } from "./stores/authStore";

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  // Inicializa a autenticação uma vez quando o app monta.
  // Verifica se há sessão existente e configura o listener
  // de mudanças de estado (login, logout, refresh de token).
  useEffect(() => {
    initialize();
  }, [initialize]);

  return <AppRouter />;
}

export default App;
