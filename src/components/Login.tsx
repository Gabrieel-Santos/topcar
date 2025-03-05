import { useState } from "react";
import { auth } from "../firebaseConfig";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { z } from "zod";
import { FcGoogle } from "react-icons/fc";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login realizado com sucesso!");
    } catch {
      setError("Erro ao fazer login. Verifique suas credenciais.");
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert("Login com Google realizado!");
    } catch {
      setError("Erro ao fazer login com o Google.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
      <img
        src="/logo.jpg"
        alt="Top Car Logo"
        className="w-44 mt-12 md:w-52 md:mt-8"
      />
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm mt-8">
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        <form onSubmit={handleEmailLogin} className="mt-4 space-y-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <button className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition">
            Entrar
          </button>
        </form>
        <hr className="my-4 border-gray-600" />
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white text-black p-3 rounded hover:bg-gray-300 transition"
        >
          <FcGoogle size={20} /> Entrar com Google
        </button>
        <p className="text-center text-white mt-4">
          Não tem conta?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Registrar
          </a>
        </p>
      </div>
    </div>
  );
}
