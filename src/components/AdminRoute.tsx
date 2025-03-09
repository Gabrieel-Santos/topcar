import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

export default function AdminRoute() {
  const authContext = useContext(AuthContext);

  // Se o contexto for undefined, significa que não está dentro do AuthProvider
  if (!authContext) {
    throw new Error("AdminRoute must be used within an AuthProvider");
  }

  const { user, role, loading } = authContext;

  if (loading) {
    return <p className="text-white text-center mt-4">Carregando...</p>;
  }

  // Se não estiver autenticado ou não for admin, redireciona para login
  return user && role === "admin" ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}
