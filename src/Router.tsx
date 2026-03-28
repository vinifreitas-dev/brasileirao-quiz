import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "./components/layout/RootLayout";
import { HomePage } from "./components/layout/HomePage";
import { AuthPage } from "./features/auth/components/AuthPage";
import { AuthGuard } from "./features/auth/components/AuthGuard";
import { GridPage } from "./features/grid/components/GridPage";
import { ConnectionsPage } from "./features/connections/components/ConnectionsPage";
import { WordlePage } from "./features/wordle/components/WordlePage";
import { GuessPage } from "./features/guess/components/GuessPage";
import { ResetPasswordPage } from "./features/auth/components/ResetPasswordPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "grid",
        element: <GridPage />,
      },
      {
        path: "connections",
        element: <ConnectionsPage />,
      },
      {
        path: "wordle",
        element: <WordlePage />,
      },
      {
        path: "guess",
        element: <GuessPage />,
      },
      {
        path: "leaderboard",
        element: <PlaceholderPage title="Leaderboard" />,
      },
      {
        path: "auth",
        element: <AuthPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },
      {
        // Rota protegida: AuthGuard redireciona para /auth se não logado
        path: "profile",
        element: (
          <AuthGuard>
            <PlaceholderPage title="Perfil" />
          </AuthGuard>
        ),
      },
    ],
  },
]);

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-surface-100">{title}</h2>
        <p className="mt-2 text-surface-400">Em construção (Stage futuro)</p>
      </div>
    </div>
  );
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
