import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

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
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [selectedExtras, setSelectedExtras] = useState<
    { name: string; price: number }[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

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

  // Buscar horários disponíveis com base na data
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (!selectedDate) return;

      const dateStr = selectedDate.toISOString().split("T")[0];

      // Consulta todos os horários criados para esse dia
      const q = query(collection(db, "schedule"), where("date", "==", dateStr));
      const snapshot = await getDocs(q);

      // Pega apenas os horários que ainda não foram agendados (ou todos, se não houver flag de reservado)
      const times = snapshot.docs.map((doc) => doc.data().time);

      setAvailableTimes(times);
    };

    fetchAvailableTimes();
  }, [selectedDate]);

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
            <div className="relative w-full mb-6 h-10 flex items-center justify-center">
              <h2 className="text-white text-2xl font-semibold">
                Escolha um serviço
              </h2>
              <button
                onClick={() => setStep(1)}
                className="absolute left-0 text-white text-2xl hover:text-blue-400 active:scale-95 transition p-2 rounded"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
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
                    onClick={() => {
                      setSelectedService(service);
                      setSelectedExtras([]); // zera extras caso volte
                      setSelectedDate(null);
                      setSelectedTime(null);
                      setStep(3);
                    }}
                  >
                    {service.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 3 && selectedService && (
          <div className="flex flex-col text-left items-center">
            {/* Cabeçalho */}
            <div className="relative w-full mb-4 h-10 flex items-center justify-center">
              <h2 className="text-white text-2xl font-semibold">
                Agendar horário
              </h2>
              <button
                onClick={() => {
                  setSelectedService(null);
                  setStep(2);
                }}
                className="absolute left-0 text-white text-xl hover:text-blue-400 active:scale-95 transition p-2 rounded"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            </div>

            {/* Serviço selecionado */}
            <div className="text-white text-left mb-4 w-full space-y-2">
              <p className="font-bold">{selectedService.name}</p>
              <p className="text-sm text-gray-300">
                {selectedService.description}
              </p>

              <div className="text-sm text-blue-300">
                {vehicleType === "carro" && (
                  <>
                    {selectedService.vehicles.find(
                      (v) => v.type === "carro_pequeno"
                    ) && (
                      <p>
                        Carro Pequeno: R$
                        {
                          selectedService.vehicles.find(
                            (v) => v.type === "carro_pequeno"
                          )?.price
                        }
                      </p>
                    )}
                    {selectedService.vehicles.find(
                      (v) => v.type === "carro_grande"
                    ) && (
                      <p>
                        Carro Grande: R$
                        {
                          selectedService.vehicles.find(
                            (v) => v.type === "carro_grande"
                          )?.price
                        }
                      </p>
                    )}
                  </>
                )}
                {vehicleType === "moto" && (
                  <p>
                    R${" "}
                    {
                      selectedService.vehicles.find((v) => v.type === "moto")
                        ?.price
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Extras */}
            {selectedService.extras && selectedService.extras.length > 0 && (
              <div className="text-white mb-4 w-full">
                <p className="font-semibold mb-2">Extras:</p>
                <ul className="space-y-2">
                  {selectedService.extras.map((extra, index) => {
                    const isSelected = selectedExtras.some(
                      (e) => e.name === extra.name
                    );
                    return (
                      <li
                        key={index}
                        className={`bg-gray-700 p-2 rounded flex justify-between items-center text-sm cursor-pointer
                  ${isSelected ? "border border-blue-400" : ""}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedExtras((prev) =>
                              prev.filter((e) => e.name !== extra.name)
                            );
                          } else {
                            setSelectedExtras((prev) => [...prev, extra]);
                          }
                        }}
                      >
                        <span>{extra.name}</span>
                        <span className="text-blue-400 font-semibold">
                          R$ {extra.price.toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Calendário */}
            <div className="bg-gray-700 p-3 rounded-lg shadow-md w-full mb-4">
              <Calendar
                onChange={(date) => setSelectedDate(date as Date)}
                value={selectedDate}
                minDate={new Date()}
                tileDisabled={({ date, view }) => {
                  if (view === "month") {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const d = new Date(date);
                    d.setHours(0, 0, 0, 0);
                    return d < today;
                  }
                  return false;
                }}
                className="custom-calendar"
                next2Label={null}
                prev2Label={null}
                maxDetail="month"
              />
            </div>

            {/* Horários disponíveis (vindos do banco) */}
            <div className="grid grid-cols-2 gap-3 w-full mb-4">
              {selectedDate && availableTimes.length === 0 ? (
                <p className="text-gray-400 text-sm col-span-2 text-center">
                  Nenhum horário disponível
                </p>
              ) : (
                availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 rounded font-bold text-white transition active:scale-95 ${
                      selectedTime === time
                        ? "bg-blue-600"
                        : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                    }`}
                  >
                    {time}
                  </button>
                ))
              )}
            </div>

            {/* Preço total */}
            <div className="text-white font-semibold mb-4">
              Total: R$
              {(
                (selectedService.vehicles.find((v) =>
                  vehicleType === "moto"
                    ? v.type === "moto"
                    : v.type === "carro_pequeno" || v.type === "carro_grande"
                )?.price || 0) +
                selectedExtras.reduce((acc, item) => acc + item.price, 0)
              ).toFixed(2)}
            </div>

            {/* Botão Confirmar */}
            <button
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep(4)}
              className={`w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold p-3 rounded transition active:scale-95 ${
                !selectedDate || !selectedTime
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              Confirmar horário
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
