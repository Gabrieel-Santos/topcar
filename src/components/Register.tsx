import { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

const registerSchema = z
  .object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z
      .string()
      .min(6, "A senha deve ter pelo menos 6 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const validation = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role: "user",
      });

      alert("Conta criada com sucesso!");
      navigate("/login");
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === "auth/email-already-in-use") {
          setError(
            "Este e-mail já está cadastrado. Faça login ou use outro e-mail."
          );
        } else {
          setError("Erro ao criar conta. Verifique os dados informados.");
        }
      } else {
        setError("Erro desconhecido ao criar conta.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-white text-center text-2xl font-semibold">
          Criar Conta
        </h2>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        <form onSubmit={handleRegister} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
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
          <input
            type="password"
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <button className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition">
            Registrar
          </button>
        </form>
        <p className="text-center text-white mt-4">
          Já tem uma conta?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
}
