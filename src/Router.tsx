import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "./components/layout/RootLayout";
import { HomePage } from "./components/layout/HomePage";
import { AuthPage } from "./features/auth/components/AuthPage";
import { AuthGuard } from "./features/auth/components/AuthGuard";
import { GridPage } from "./features/grid/components/GridPage";

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
        element: <PlaceholderPage title="Connections BR" />,
      },
      {
        path: "leaderboard",
        element: <PlaceholderPage title="Leaderboard" />,
      },
      {
        // Rota pública: qualquer pessoa pode acessar
        path: "auth",
        element: <AuthPage />,
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
