import { useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { FcGoogle } from "react-icons/fc";
import UserInfoModal from "./UserInfoModal";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempUser, setTempUser] = useState<{
    uid: string;
    email: string;
  } | null>(null);

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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        console.log("Usuário já cadastrado:", docSnap.data());
      } else {
        setTempUser({ uid: user.uid, email: user.email! });
        setIsModalOpen(true);
      }
    } catch {
      setError("Erro ao fazer login com o Google.");
    }
  };

  const handleSaveUserInfo = async (name: string, phone: string) => {
    if (!tempUser) return;

    const userRef = doc(db, "users", tempUser.uid);
    await setDoc(userRef, {
      name,
      email: tempUser.email,
      phone,
      role: "user",
    });

    setIsModalOpen(false);
    setTempUser(null);
    console.log("Usuário salvo com sucesso!");
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
          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-blue-400 hover:underline active:underline text-sm transition"
            >
              Esqueceu sua senha?
            </a>
          </div>
          <button className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 active:bg-blue-700 active:scale-95 transition cursor-pointer">
            Entrar
          </button>
        </form>
        <hr className="my-4 border-gray-600" />
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white text-black p-3 rounded hover:bg-gray-300 active:bg-gray-400 active:scale-95 transition cursor-pointer"
        >
          <FcGoogle size={20} /> Entrar com Google
        </button>

        <p className="text-center text-white mt-4">
          Não tem conta?{" "}
          <a
            href="/register"
            className="text-blue-400 hover:underline active:underline transition"
          >
            Registrar
          </a>
        </p>
      </div>

      {/* Modal para solicitar Nome e Telefone */}
      <UserInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUserInfo}
      />
    </div>
  );
}
