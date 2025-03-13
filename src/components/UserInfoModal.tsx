import { useState } from "react";

interface UserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, phone: string) => void;
}

export default function UserInfoModal({ isOpen, onSave }: UserInfoModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
        7,
        11
      )}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-11/12 max-w-sm shadow-lg">
        <h2 className="text-white text-center text-xl font-semibold">
          Complete seu cadastro
        </h2>
        <p className="text-gray-400 text-center text-sm mb-4">
          Precisamos do seu nome e telefone para continuar.
        </p>

        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400 mb-3"
        />

        <input
          type="tel"
          placeholder="Telefone (WhatsApp)"
          value={phone}
          onChange={handlePhoneChange}
          maxLength={15}
          className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400 mb-4"
        />

        <button
          onClick={() => onSave(name, phone)}
          className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 active:bg-blue-700 active:scale-95 transition cursor-pointer"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
