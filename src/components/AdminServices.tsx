import { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { z } from "zod";

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
    .array(z.object({ name: z.string(), price: z.number().min(1) }))
    .optional(),
});

// Definição dos tipos
type Vehicle = { type: string; price: number };
type Extra = { name: string; price: number };

export default function AdminServices() {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { type: "carro_pequeno", price: 0 },
    { type: "carro_grande", price: 0 },
    { type: "moto", price: 0 },
  ]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [extraName, setExtraName] = useState<string>("");
  const [extraPrice, setExtraPrice] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Adicionar um novo extra
  const addExtra = (): void => {
    if (!extraName || !extraPrice) {
      alert("Preencha o nome e o preço do extra!");
      return;
    }
    setExtras([...extras, { name: extraName, price: parseFloat(extraPrice) }]);
    setExtraName("");
    setExtraPrice("");
  };

  // Remover extra
  const removeExtra = (index: number): void => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  // Atualizar preço de um tipo de veículo
  const updateVehiclePrice = (type: string, price: string): void => {
    setVehicles(
      vehicles.map((v) =>
        v.type === type ? { ...v, price: parseFloat(price) } : v
      )
    );
  };

  // Salvar serviço no Firestore
  const saveService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validação com Zod
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
    setVehicles([
      { type: "carro_pequeno", price: 0 },
      { type: "carro_grande", price: 0 },
      { type: "moto", price: 0 },
    ]);
    setExtras([]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-white text-center text-2xl font-semibold">
          Cadastrar Serviço
        </h2>

        {error && <p className="text-red-500 text-center mt-2">{error}</p>}

        <form onSubmit={saveService} className="space-y-4">
          {/* Nome do Serviço */}
          <label className="text-white block">Nome do Serviço:</label>
          <input
            type="text"
            className="w-full p-3 border rounded bg-gray-700 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Lavagem Completa"
          />

          {/* Descrição do Serviço */}
          <label className="text-white block">Descrição:</label>
          <textarea
            className="w-full p-3 border rounded bg-gray-700 text-white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva os detalhes do serviço"
          />

          {/* Preços por tipo de veículo */}
          <label className="text-white block">
            Preços por Tipo de Veículo:
          </label>
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.type}
              className="flex justify-between items-center mt-2"
            >
              <span className="text-white">
                {vehicle.type.replace("_", " ").toUpperCase()}:
              </span>
              <input
                type="number"
                className="w-20 p-2 border rounded bg-gray-700 text-white"
                value={vehicle.price}
                onChange={(e) =>
                  updateVehiclePrice(vehicle.type, e.target.value)
                }
              />
            </div>
          ))}

          {/* Extras */}
          <label className="text-white block">Extras Opcionais:</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 p-3 border rounded bg-gray-700 text-white"
              value={extraName}
              onChange={(e) => setExtraName(e.target.value)}
              placeholder="Nome do extra"
            />
            <input
              type="number"
              className="w-20 p-3 border rounded bg-gray-700 text-white"
              value={extraPrice}
              onChange={(e) => setExtraPrice(e.target.value)}
              placeholder="R$"
            />
            <button
              type="button"
              onClick={addExtra}
              className="bg-green-500 text-white p-3 rounded hover:bg-green-600 transition"
            >
              +
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
                  {extra.name} - R$ {extra.price}
                  <button
                    type="button"
                    onClick={() => removeExtra(index)}
                    className="text-red-500"
                  >
                    X
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Botão de Salvar */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded mt-4 hover:bg-blue-600 transition"
          >
            Cadastrar Serviço
          </button>
        </form>
      </div>
    </div>
  );
}
