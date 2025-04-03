import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Service = {
  id: string;
  name: string;
  description: string;
  vehicles: { type: string; price: number }[];
  extras?: { name: string; price: number }[];
};

export default function Booking() {
  const [step, setStep] = useState(1);
  const [vehicleType, setVehicleType] = useState<"carro" | "moto" | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [filtered, setFiltered] = useState<Service[]>([]);

  // Etapa 1: selecionar veículo
  const handleVehicleSelect = (type: "carro" | "moto") => {
    setVehicleType(type);
    setStep(2);
  };

  // Buscar serviços no Firestore
  useEffect(() => {
    const fetchServices = async () => {
      const snapshot = await getDocs(collection(db, "services"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Service, "id">),
      }));
      setServices(data);
    };

    fetchServices();
  }, []);

  // Filtrar serviços com base no tipo de veículo
  useEffect(() => {
    if (vehicleType) {
      const filteredList = services.filter(
        (service) =>
          Array.isArray(service.vehicles) &&
          service.vehicles.some((v) =>
            vehicleType === "carro"
              ? v.type === "carro_pequeno" || v.type === "carro_grande"
              : v.type === "moto"
          )
      );
      setFiltered(filteredList);
    }
  }, [services, vehicleType]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm text-center">
        {/* Etapa 1 - Seleção de veículo */}
        {step === 1 && (
          <>
            <h2 className="text-white text-2xl font-semibold mb-6">
              Selecione o tipo de veículo
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => handleVehicleSelect("carro")}
                className="w-1/2 p-3 rounded font-bold text-white transition cursor-pointer bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95"
              >
                Carro
              </button>
              <button
                onClick={() => handleVehicleSelect("moto")}
                className="w-1/2 p-3 rounded font-bold text-white transition cursor-pointer bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95"
              >
                Moto
              </button>
            </div>
          </>
        )}

        {/* Etapa 2 - Lista de serviços */}
        {step === 2 && (
          <div className="flex flex-col text-left">
            {/* Título + botão de voltar lado a lado */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setStep(1)}
                className="text-white text-2xl hover:text-blue-400 transition active:scale-95"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <h2 className="text-white text-2xl font-semibold text-center flex-1">
                Escolha um serviço
              </h2>
            </div>

            {/* Lista de serviços */}
            {filtered.length === 0 ? (
              <p className="text-gray-400 text-sm text-center">
                Nenhum serviço disponível
              </p>
            ) : (
              <ul className="space-y-2">
                {filtered.map((service) => (
                  <li
                    key={service.id}
                    className="bg-blue-500 px-4 py-4 rounded text-white font-bold text-center cursor-pointer 
                       hover:bg-blue-600 active:bg-blue-700 active:scale-95 transition"
                    onClick={() =>
                      console.log("Abrir modal para:", service.name)
                    }
                  >
                    {service.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
