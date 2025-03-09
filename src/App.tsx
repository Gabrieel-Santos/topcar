import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminServices from "./components/AdminServices";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Rotas protegidas para usuários autenticados */}
          <Route element={<ProtectedRoute />}>
            {/* Aqui podem entrar outras rotas autenticadas que não são exclusivas de admin */}
          </Route>

          {/* Rotas exclusivas para Admin */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/services" element={<AdminServices />} />{" "}
            {/* 🚀 Somente admin pode acessar */}
          </Route>

          {/* Redirecionamento padrão */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
