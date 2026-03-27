import { Outlet } from "react-router-dom";
import { Header } from "./Header";

// RootLayout é o "esqueleto" da aplicação.
// O componente <Outlet /> do React Router renderiza a página
// correspondente à rota atual (HomePage, Grid, Connections, etc).
// Isso evita repetir header/footer em cada página.
export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-950">
      <Header />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <footer className="border-t border-surface-800 py-4 text-center text-sm text-surface-500">
        Brasileirão Quiz &copy; {new Date().getFullYear()} &mdash; Projeto de portfólio
      </footer>
    </div>
  );
}
