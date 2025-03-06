import { useState } from "react";
import { auth } from "../firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "E-mail de redefinição de senha enviado! Verifique sua caixa de entrada."
      );
    } catch {
      setError("Erro ao enviar e-mail. Verifique se o e-mail está correto.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-white text-center text-2xl font-semibold">
          Recuperar Senha
        </h2>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        {message && (
          <p className="text-green-500 text-center mt-2">{message}</p>
        )}
        <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <button className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition">
            Enviar E-mail de Redefinição
          </button>
        </form>
        <p className="text-center text-white mt-4">
          <a href="/login" className="text-blue-400 hover:underline">
            Voltar para o Login
          </a>
        </p>
      </div>
    </div>
  );
}
