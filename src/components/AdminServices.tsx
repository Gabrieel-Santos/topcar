import { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";

// Definição do Schema de Validação com Zod
const serviceSchema = z.object({
  name: z.string().min(3, "O nome do serviço deve ter pelo menos 3 caracteres"),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres"),
  vehicles: z
    .array(
      z.object({
        type: z.string(),
        price: z.number().min(1, "O preço deve ser maior que 0"),
      })
    )
    .nonempty("Adicione pelo menos um tipo de veículo"),
  extras: z
    .array(
      z.object({
        name: z.string().min(1, "O nome do extra é obrigatório"),
        price: z.number().min(1, "O preço do extra deve ser maior que 0"),
      })
    )
    .optional(),
});

// Tipos
type Vehicle = { type: string; price: number };
type Extra = { name: string; price: number };

export default function AdminServices() {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [extraName, setExtraName] = useState<string>("");
  const [extraPrice, setExtraPrice] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(
    new Set()
  );

  // Alternar seleção de veículos
  const toggleVehicleSelection = (type: string) => {
    setSelectedVehicles((prev) => {
      const updated = new Set(prev);
      if (updated.has(type)) {
        updated.delete(type);
      } else {
        updated.add(type);
      }
      return updated;
    });
  };

  // Adicionar um novo extra
  const addExtra = (): void => {
    const validation = z
      .object({
        name: z.string().min(1, "O nome do extra é obrigatório"),
        price: z.number().min(1, "O preço do extra deve ser maior que 0"),
      })
      .safeParse({ name: extraName, price: parseFloat(extraPrice) });

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setExtras([...extras, { name: extraName, price: parseFloat(extraPrice) }]);
    setExtraName("");
    setExtraPrice("");
    setError(""); // Limpa o erro ao adicionar com sucesso
  };

  // Remover extra
  const removeExtra = (index: number): void => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  // Atualizar preço de um tipo de veículo
  const updateVehiclePrice = (type: string, price: string): void => {
    setVehicles((prev) => {
      const updatedVehicles = prev.filter((v) => v.type !== type);
      return [...updatedVehicles, { type, price: parseFloat(price) }];
    });
  };

  // Salvar serviço no Firestore
  const saveService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const validation = serviceSchema.safeParse({
      name,
      description,
      vehicles,
      extras,
    });

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    await addDoc(collection(db, "services"), {
      name,
      description,
      vehicles,
      extras,
    });

    alert("Serviço cadastrado com sucesso!");
    setName("");
    setDescription("");
    setVehicles([]);
    setExtras([]);
    setSelectedVehicles(new Set());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-white text-center text-2xl font-semibold mb-4">
          Cadastrar Serviço
        </h2>

        {error && <p className="text-red-500 text-center mt-2">{error}</p>}

        <form onSubmit={saveService} className="space-y-4">
          {/* Nome do Serviço */}
          <input
            type="text"
            className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do Serviço (Ex: Lavagem completa)"
          />

          {/* Descrição do Serviço */}
          <textarea
            className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do Serviço"
          />

          {/* Seleção do Tipo de Veículo */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleVehicleSelection("carro")}
              className={`w-1/2 p-3 rounded font-bold text-white transition cursor-pointer ${
                selectedVehicles.has("carro") ? "bg-blue-500" : "bg-gray-700"
              } hover:bg-blue-600 active:bg-blue-700 active:scale-95`}
            >
              Carro
            </button>

            <button
              type="button"
              onClick={() => toggleVehicleSelection("moto")}
              className={`w-1/2 p-3 rounded font-bold text-white transition cursor-pointer ${
                selectedVehicles.has("moto") ? "bg-blue-500" : "bg-gray-700"
              } hover:bg-blue-600 active:bg-blue-700 active:scale-95`}
            >
              Moto
            </button>
          </div>

          {selectedVehicles.has("carro") && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">R$</span>
                <input
                  type="number"
                  className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400 appearance-none"
                  placeholder="Carro Pequeno"
                  onChange={(e) =>
                    updateVehiclePrice("carro_pequeno", e.target.value)
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">R$</span>
                <input
                  type="number"
                  className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400 appearance-none"
                  placeholder="Carro Grande"
                  onChange={(e) =>
                    updateVehiclePrice("carro_grande", e.target.value)
                  }
                />
              </div>
            </>
          )}

          {selectedVehicles.has("moto") && (
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">R$</span>
              <input
                type="number"
                className="w-full p-3 border rounded bg-gray-700 text-white placeholder-gray-400 appearance-none"
                placeholder="Preço Moto"
                onChange={(e) => updateVehiclePrice("moto", e.target.value)}
              />
            </div>
          )}

          {/* Extras */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              className="flex-1 min-w-0 p-3 border rounded bg-gray-700 text-white"
              value={extraName}
              onChange={(e) => setExtraName(e.target.value)}
              placeholder="Nome do extra"
            />
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">R$</span>
              <input
                type="number"
                className="w-20 p-3 border rounded bg-gray-700 text-white appearance-none"
                value={extraPrice}
                onChange={(e) => setExtraPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <button
              type="button"
              onClick={addExtra}
              className="bg-green-500 text-white p-3 rounded hover:bg-green-600 active:bg-green-700 active:scale-95 transition cursor-pointer flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>

          {/* Lista de Extras adicionados */}
          {extras.length > 0 && (
            <ul className="mt-4 text-white">
              {extras.map((extra, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center bg-gray-700 p-2 rounded mt-2"
                >
                  <span className="flex items-center gap-1">
                    {extra.name} - <strong>R$</strong> {extra.price}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExtra(index)}
                    className="text-red-500 hover:text-red-700 active:text-red-800 active:scale-95 cursor-pointer transition"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Botão de Salvar */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-bold p-3 rounded mt-4 hover:bg-blue-600 active:bg-blue-700 active:scale-95 transition cursor-pointer"
          >
            Cadastrar
          </button>
        </form>
      </div>
    </div>
  );
}
