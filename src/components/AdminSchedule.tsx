import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { z } from "zod";
import "./CalendarStyles.css";
import CustomTimePicker from "./CustomTimePicker";
import ConfirmModal from "./ConfirmModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

const isDateDisabled = ({ date, view }: { date: Date; view: string }) => {
  if (view === "month") {
    // Só desativa os dias, permitindo navegação entre meses/anos
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarDate = new Date(date);
    calendarDate.setHours(0, 0, 0, 0);

    return calendarDate < today; // Desativa apenas dias anteriores a hoje
  }
  return false; // Permite seleção de meses e anos
};

// Formatar data para exibição amigável (Ex: Segunda-feira, 14 de Março)
const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString + "T00:00:00-03:00"); // Força o fuso de Brasília
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
};

export default function AdminSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [time, setTime] = useState("12:00");
  const [schedule, setSchedule] = useState<
    { id: string; date: string; time: string }[]
  >([]);
  const [editing, setEditing] = useState<{ id: string; time: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    id: string;
    date: string;
    time: string;
  } | null>(null);

  // Carregar os horários do Firebase
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remove a parte do horário para comparação

    const unsubscribe = onSnapshot(collection(db, "schedule"), (snapshot) => {
      snapshot.docs.forEach(async (doc) => {
        const slot = doc.data() as { date: string; time: string };
        const slotDate = new Date(slot.date + "T00:00:00-03:00");

        if (slotDate < today) {
          await deleteDoc(doc.ref); // Exclui horários passados do Firebase
        }
      });

      // Atualiza a lista sem horários antigos
      const fetchedSchedule = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as { date: string; time: string }),
        }))
        .filter((slot) => {
          const slotDate = new Date(slot.date + "T00:00:00-03:00");
          return slotDate >= today;
        });

      setSchedule(fetchedSchedule);
    });

    return () => unsubscribe(); // Cancela a escuta ao desmontar o componente
  }, []);

  // Adicionar horário ao Firebase com validação
  const addTimeSlot = async () => {
    if (!selectedDate || !time.trim()) {
      setError("Selecione um horário válido!");
      return;
    }

    const dateString = getBrasiliaDate(selectedDate);
    const today = getBrasiliaDate(new Date());

    if (dateString < today) {
      setError("Não é possível marcar horários para dias anteriores!");
      return;
    }

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
    setSchedule([...schedule, { id: docRef.id, ...newSlot }]);

    setError(null);
    toast.success("Horário cadastrado com sucesso!");
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

  // Agrupar horários por dia da semana
  const groupedByWeekday = schedule.reduce((acc, slot) => {
    const date = new Date(slot.date + "T00:00:00-03:00");
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });

    if (!acc[weekday]) {
      acc[weekday] = [];
    }

    acc[weekday].push(slot);
    return acc;
  }, {} as Record<string, { id: string; date: string; time: string }[]>);

  // Ordenar os dias da semana corretamente
  const weekOrder = [
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
    "domingo",
  ];
  const sortedWeekdays = weekOrder.filter((day) => groupedByWeekday[day]);

  const confirmDelete = (slot: { id: string; date: string; time: string }) => {
    setSelectedSlot(slot);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (selectedSlot) {
      await deleteDoc(doc(db, "schedule", selectedSlot.id));
      setModalOpen(false);
      setSelectedSlot(null);

      toast.success("Horário excluído com sucesso!");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-black p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-white text-center text-2xl font-semibold mb-4">
          Gerenciar Agenda
        </h2>

        {/* Exibição de erro */}
        {error && <p className="text-red-500 text-center">{error}</p>}
        <div className="mb-4 p-3 rounded-lg shadow-md bg-gray-700">
          <Calendar
            onChange={(date) => setSelectedDate(date as Date)}
            value={selectedDate}
            className="custom-calendar"
            minDate={new Date(new Date().setHours(0, 0, 0, 0))}
            tileDisabled={isDateDisabled}
            next2Label={null}
            prev2Label={null}
            maxDetail="month"
          />
        </div>
        {selectedDate && (
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <CustomTimePicker value={time} onChange={setTime} />
            </div>

            <button
              onClick={addTimeSlot}
              className="bg-green-500 text-white px-5 py-4 rounded-lg hover:bg-green-600 active:bg-green-700 active:scale-95 transition flex items-center justify-center text-lg"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        )}
        {schedule.length === 0 ? (
          <p className="text-gray-400 text-center mt-4">
            Nenhum horário marcado.
          </p>
        ) : (
          sortedWeekdays.map((weekday) => (
            <div key={weekday} className="mt-6 w-full">
              <h3 className="text-center text-blue-400 text-xl font-bold mb-2">
                {weekday.charAt(0).toUpperCase() + weekday.slice(1)}
              </h3>

              <ul className="w-full">
                {groupedByWeekday[weekday].map((slot) => {
                  return (
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
                          onClick={() => confirmDelete(slot)}
                          className="text-red-500 hover:text-red-700 active:text-red-800 active:scale-95 transition text-lg"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Horário"
        message={`Tem certeza que deseja excluir o horário ${
          selectedSlot?.time
        } - ${formatDisplayDate(selectedSlot?.date ?? "")}?`}
        confirmText="Excluir"
        confirmColor="bg-red-500 hover:bg-red-600"
      />
    </div>
  );
}
