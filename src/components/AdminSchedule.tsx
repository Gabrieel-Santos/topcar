import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus, faEdit } from "@fortawesome/free-solid-svg-icons";
import { z } from "zod";
import "./CalendarStyles.css";

// Esquema de validação com Zod
const scheduleSchema = z.object({
  date: z.string(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido"),
});

// Função para formatar a data no fuso horário de Brasília
const getBrasiliaDate = (date: Date) => {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("/")
    .reverse()
    .join("-"); // Retorna no formato YYYY-MM-DD
};

// Formatar data para exibição amigável (Ex: Segunda-feira, 14 de Março)
const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString + "T00:00:00-03:00"); // Força o fuso de Brasília
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

export default function AdminSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [time, setTime] = useState("");
  const [schedule, setSchedule] = useState<
    { id: string; date: string; time: string }[]
  >([]);
  const [editing, setEditing] = useState<{ id: string; time: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Carregar os horários do Firebase
  useEffect(() => {
    const fetchSchedule = async () => {
      const querySnapshot = await getDocs(collection(db, "schedule"));
      const fetchedSchedule = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as { id: string; date: string; time: string }[];
      setSchedule(fetchedSchedule);
    };

    fetchSchedule();
  }, []);

  // Adicionar horário ao Firebase com validação
  const addTimeSlot = async () => {
    if (!selectedDate || !time) return setError("Selecione um horário válido!");

    const dateString = getBrasiliaDate(selectedDate); // Corrige para Brasília

    // Validar com Zod
    const validation = scheduleSchema.safeParse({ date: dateString, time });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    // Verificar se o horário já existe
    const exists = schedule.some(
      (slot) => slot.date === dateString && slot.time === time
    );
    if (exists) {
      setError("Esse horário já está marcado!");
      return;
    }

    const newSlot = { date: dateString, time };
    const docRef = await addDoc(collection(db, "schedule"), newSlot);
    setSchedule([...schedule, { id: docRef.id, ...newSlot }]); // Atualiza a lista localmente
    setTime("");
    setError(null);
  };

  // Atualizar horário no Firebase
  const updateTimeSlot = async (id: string, newTime: string) => {
    const docRef = doc(db, "schedule", id);
    await updateDoc(docRef, { time: newTime });

    setSchedule(
      schedule.map((slot) =>
        slot.id === id ? { ...slot, time: newTime } : slot
      )
    );
    setEditing(null);
  };

  // Remover horário do Firebase
  const removeTimeSlot = async (id: string) => {
    const docRef = doc(db, "schedule", id);
    await deleteDoc(docRef);

    setSchedule(schedule.filter((slot) => slot.id !== id));
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-black p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-white text-center text-2xl font-semibold mb-4">
          Gerenciar Agenda
        </h2>

        {/* Exibição de erro */}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* Calendário estilizado */}
        <div className="mb-4 p-3 rounded-lg shadow-md bg-gray-700">
          <Calendar
            onChange={(date) => setSelectedDate(date as Date)}
            value={selectedDate}
            className="custom-calendar"
            next2Label={null} // Remove seta de avançar ano
            prev2Label={null} // Remove seta de retroceder ano
          />
        </div>

        {/* Exibição da data formatada */}
        {selectedDate && (
          <p className="text-white text-lg font-semibold text-center mb-2">
            {formatDisplayDate(getBrasiliaDate(selectedDate))}
          </p>
        )}

        {/* Input de horário estilizado e botão "+" aumentado */}
        {selectedDate && (
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <input
                type="time"
                className="w-full p-3 border rounded bg-gray-700 text-white appearance-none focus:ring focus:ring-blue-500"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <button
              onClick={addTimeSlot}
              className="bg-green-500 text-white px-5 py-4 rounded-lg hover:bg-green-600 active:bg-green-700 active:scale-95 transition flex items-center justify-center text-lg"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        )}

        {/* Lista de horários cadastrados */}
        <ul className="mt-4 w-full">
          {schedule.map((slot) => (
            <li
              key={slot.id}
              className="flex justify-between items-center bg-gray-700 p-3 rounded mt-2 text-white shadow-md border border-gray-600"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-blue-400">
                  {formatDisplayDate(slot.date)}
                </span>

                {editing?.id === slot.id ? (
                  <input
                    type="time"
                    className="mt-1 p-2 border rounded bg-gray-600 text-white"
                    value={editing.time}
                    onChange={(e) =>
                      setEditing({ ...editing, time: e.target.value })
                    }
                    onBlur={() => updateTimeSlot(slot.id, editing.time)}
                  />
                ) : (
                  <span className="text-lg font-bold">{slot.time}</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditing({ id: slot.id, time: slot.time })}
                  className="text-yellow-400 hover:text-yellow-500 active:text-yellow-600 active:scale-95 transition text-lg"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>

                <button
                  onClick={() => removeTimeSlot(slot.id)}
                  className="text-red-500 hover:text-red-700 active:text-red-800 active:scale-95 transition text-lg"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
