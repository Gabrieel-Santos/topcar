import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminServices from "./components/AdminServices";
import AdminSchedule from "./components/AdminSchedule";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={1500}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="dark"
        />

        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Rotas protegidas para usuários autenticados */}
          <Route element={<ProtectedRoute />}></Route>

          {/* Rotas exclusivas para Admin */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/schedule" element={<AdminSchedule />} />
          </Route>

          {/* Redirecionamento padrão */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
