import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-white text-center mt-4">Carregando...</p>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
