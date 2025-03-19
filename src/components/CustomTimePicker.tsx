import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface CustomTimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

const hours: string[] = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
const minutes: string[] = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
);

export default function CustomTimePicker({
  value,
  onChange,
}: CustomTimePickerProps) {
  const [hour, setHour] = useState<string>(value ? value.split(":")[0] : "12");
  const [minute, setMinute] = useState<string>(
    value ? value.split(":")[1] : "00"
  );
  const [isHourOpen, setIsHourOpen] = useState<boolean>(false);
  const [isMinuteOpen, setIsMinuteOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsHourOpen(false);
        setIsMinuteOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (value) {
      const [newHour, newMinute] = value.split(":");
      setHour(newHour);
      setMinute(newMinute);
    }
  }, [value]);

  const updateTime = (newHour: string, newMinute: string) => {
    setHour(newHour);
    setMinute(newMinute);
    onChange(`${newHour}:${newMinute}`);
  };

  return (
    <div
      ref={dropdownRef}
      className="flex flex-wrap items-center gap-2 bg-gray-800 p-3 rounded-lg shadow-md w-full max-w-xs mx-auto"
    >
      <FontAwesomeIcon icon={faClock} className="text-gray-400 text-lg" />

      <div className="relative w-20 text-lg">
        <button
          onClick={() => setIsHourOpen(!isHourOpen)}
          className="w-full bg-gray-900 text-white p-2 rounded-md flex justify-between items-center hover:bg-gray-900 active:bg-gray-950 active:scale-95 transition"
        >
          {hour}{" "}
          <FontAwesomeIcon icon={faChevronDown} className="text-gray-400" />
        </button>
        {isHourOpen && (
          <ul className="absolute left-0 w-full bg-gray-900 text-white rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg z-50">
            {hours.map((h) => (
              <li
                key={h}
                className="p-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  updateTime(h, minute);
                  setIsHourOpen(false);
                }}
              >
                {h}
              </li>
            ))}
          </ul>
        )}
      </div>

      <span className="text-white font-bold text-lg">:</span>
      <div className="relative w-20 text-lg">
        <button
          onClick={() => setIsMinuteOpen(!isMinuteOpen)}
          className="w-full bg-gray-900 text-white p-2 rounded-md flex justify-between items-center hover:bg-gray-900 active:bg-gray-950 active:scale-95 transition"
        >
          {minute}{" "}
          <FontAwesomeIcon icon={faChevronDown} className="text-gray-400" />
        </button>

        {isMinuteOpen && (
          <ul className="absolute left-0 w-full bg-gray-900 text-white rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg z-50">
            {minutes.map((m) => (
              <li
                key={m}
                className="p-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  updateTime(hour, m);
                  setIsMinuteOpen(false);
                }}
              >
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
