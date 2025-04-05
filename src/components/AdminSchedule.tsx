import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
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

const fixedTimes = ["07:00", "08:30", "14:00"];

const scheduleSchema = z.object({
  date: z.string(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido"),
});

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
    .join("-");
};

const isDateDisabled = ({ date, view }: { date: Date; view: string }) => {
  if (view === "month") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const calendarDate = new Date(date);
    calendarDate.setHours(0, 0, 0, 0);
    return calendarDate < today;
  }
  return false;
};

const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString + "T00:00:00-03:00");
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
};

export default function AdminSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [time, setTime] = useState("12:00");
  const [schedule, setSchedule] = useState<
    { id: string; date: string; time: string; removed?: boolean }[]
  >([]);

  const [dailyTimes, setDailyTimes] = useState<
    { time: string; type: "fixed" | "extra"; id?: string; booked?: boolean }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    id: string;
    date: string;
    time: string;
  } | null>(null);

  // Carrega todos os horários futuros do banco
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unsubscribe = onSnapshot(collection(db, "schedule"), (snapshot) => {
      snapshot.docs.forEach(async (doc) => {
        const slot = doc.data() as { date: string; time: string };
        const slotDate = new Date(slot.date + "T00:00:00-03:00");

        if (slotDate < today) {
          await deleteDoc(doc.ref); // Remove horários passados
        }
      });

      const fetched = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as { date: string; time: string }),
        }))
        .filter((slot) => {
          const slotDate = new Date(slot.date + "T00:00:00-03:00");
          return slotDate >= today;
        });

      setSchedule(fetched);
    });

    return () => unsubscribe();
  }, []);

  // Monta os horários visíveis da data clicada
  useEffect(() => {
    if (!selectedDate) return;

    const dateStr = getBrasiliaDate(selectedDate);

    // Horários extras válidos (sem 'removed')
    const extras = schedule.filter((s) => s.date === dateStr && !s.removed);

    // Horários removidos (marcados com removed: true)
    const removedTimes = schedule
      .filter((s) => s.date === dateStr && s.removed)
      .map((s) => s.time);

    // Junta fixos e extras, mas remove os removidos
    const fixedPlusExtras = Array.from(
      new Set([...fixedTimes, ...extras.map((e) => e.time)])
    ).filter((time) => !removedTimes.includes(time));

    // Monta o array final com metadados
    const fullList = fixedPlusExtras.map((time) => {
      const found = extras.find((s) => s.time === time);
      return {
        time,
        id: found?.id,
        type: fixedTimes.includes(time)
          ? ("fixed" as const)
          : ("extra" as const),
        booked: false, // você pode usar isso depois com appointments
      };
    });

    setDailyTimes(fullList.sort((a, b) => a.time.localeCompare(b.time)));
  }, [selectedDate, schedule]);

  const confirmDelete = (slot: { id: string; date: string; time: string }) => {
    setSelectedSlot(slot);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (selectedSlot) {
      if (selectedSlot.id) {
        // horário extra
        await deleteDoc(doc(db, "schedule", selectedSlot.id));
        setSchedule((prev) => prev.filter((s) => s.id !== selectedSlot.id));
      } else {
        // horário fixo – marcar como removido
        await addDoc(collection(db, "schedule"), {
          date: selectedSlot.date,
          time: selectedSlot.time,
          removed: true,
        });
      }

      setModalOpen(false);
      setSelectedSlot(null);
      toast.success("Horário removido com sucesso!");
    }
  };

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

    // Verifica se o horário já está visivelmente marcado
    const horarioJaExiste = dailyTimes.some((slot) => slot.time === time);
    if (horarioJaExiste) {
      setError("Esse horário já está marcado!");
      return;
    }

    // Verifica se já existe no banco com 'removed: true'
    const slotRemovido = schedule.find(
      (s) => s.date === dateString && s.time === time && s.removed
    );

    if (slotRemovido) {
      // Atualiza removed: false
      await updateDoc(doc(db, "schedule", slotRemovido.id), {
        removed: false,
      });
      setSchedule((prev) =>
        prev.map((s) =>
          s.id === slotRemovido.id ? { ...s, removed: false } : s
        )
      );
      toast.success("Horário reativado com sucesso!");
      setError(null);
      return;
    }

    // Caso contrário, adiciona como novo horário extra
    const newSlot = { date: dateString, time, removed: false };
    const docRef = await addDoc(collection(db, "schedule"), newSlot);
    setSchedule((prev) => [...prev, { id: docRef.id, ...newSlot }]);

    setError(null);
    toast.success("Horário cadastrado com sucesso!");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-black p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-white text-center text-2xl font-semibold mb-4">
          Gerenciar Agenda
        </h2>

        {/* Erro */}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* Calendário */}
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

        {/* Adicionar horário extra */}
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

        {/* Lista de horários da data selecionada */}
        {dailyTimes.length === 0 ? (
          <p className="text-gray-400 text-center mt-4">
            Nenhum horário disponível.
          </p>
        ) : (
          <>
            {selectedDate && (
              <h3 className="text-blue-400 text-center text-lg font-semibold mb-4 mt-4">
                {selectedDate.toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  weekday: "long",
                })}
              </h3>
            )}

            <div className="grid grid-cols-2 gap-2 w-full">
              {dailyTimes.map((slot) => (
                <div
                  key={slot.time}
                  className="flex justify-between items-center bg-gray-700 px-4 py-4 rounded text-white text-lg shadow border border-gray-600"
                >
                  <span className="font-bold text-xl">{slot.time}</span>

                  {slot.booked ? (
                    <span className="text-green-400 font-bold text-sm">
                      Marcado
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (slot.id) {
                          confirmDelete({
                            id: slot.id,
                            date: getBrasiliaDate(selectedDate!),
                            time: slot.time,
                          });
                        } else if (slot.type === "fixed") {
                          setSelectedSlot({
                            id: "",
                            date: getBrasiliaDate(selectedDate!),
                            time: slot.time,
                          });
                          setModalOpen(true);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 active:text-red-800 active:scale-95 transition text-lg"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de confirmação */}
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
