interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  confirmColor?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmação",
  message = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  confirmColor = "bg-red-500 hover:bg-red-600",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-6 rounded-lg shadow-lg text-white w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-center text-blue-400 mb-3">
          {title}
        </h2>

        <p className="text-lg text-gray-300 text-center leading-relaxed">
          {message}
        </p>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-5 py-2 rounded-lg hover:bg-gray-700 active:bg-gray-800 active:scale-95 transition"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className={`${confirmColor} px-5 py-2 rounded-lg text-white hover:brightness-110 active:brightness-90 active:scale-95 transition`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
