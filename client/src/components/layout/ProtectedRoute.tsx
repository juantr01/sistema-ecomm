import { Navigate } from "react-router-dom";
import { useMe } from "@/hooks/useAuth";
import { AppShell } from "./AppShell";

export function ProtectedRoute() {
  const { data, isLoading, isError } = useMe();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Carregando...</div>;
  }

  if (isError || !data) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}
