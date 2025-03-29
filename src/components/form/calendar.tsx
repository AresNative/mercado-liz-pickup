import { InputFormProps } from "@/utils/constants/interfaces";
import { Calendar1 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CalendarComponent({ cuestion, setValue, register, errors }: InputFormProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [birthDate, setBirthDate] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Determinar la fecha inicial cuando se abre el selector
    const currentDate = birthDate ? new Date(birthDate) : new Date();
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState(currentDate.getMonth());
    const [day, setDay] = useState(currentDate.getDate());

    const years = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i);
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1);

    useEffect(() => {
        setValue(cuestion.name, birthDate);
    }, [birthDate]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDatePicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Ajuste para formatear correctamente el valor definido
    useEffect(() => {
        if (cuestion.valueDefined) {
            const parsedDate = new Date(cuestion.valueDefined);
            if (!isNaN(parsedDate.getTime())) {
                const formattedDate = parsedDate.toISOString().split("T")[0];
                setBirthDate(formattedDate);
                setYear(parsedDate.getFullYear());
                setMonth(parsedDate.getMonth());
                setDay(parsedDate.getDate());
            }
        }
    }, [cuestion.valueDefined]);

    const handleAccept = () => {
        const selectedDate = new Date(year, month, day);
        setBirthDate(selectedDate.toISOString().split("T")[0]);
        setShowDatePicker(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setBirthDate("");
        setValue(cuestion.name, "");
    };

    return (
        <div className="flex flex-col" ref={dropdownRef}>
            <label className="leading-loose flex items-center gap-2 dark:text-white">
                <Calendar1 className="w-4 h-4" />
                {cuestion.label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={birthDate}
                    onClick={() => {
                        setShowDatePicker(true);
                        // Asegurar que la fecha mostrada en los selects coincida con la fecha actual
                        const today = new Date();
                        setYear(today.getFullYear());
                        setMonth(today.getMonth());
                        setDay(today.getDate());
                    }}
                    readOnly
                    className="bg-white dark:bg-zinc-800 px-4 py-2 border focus:ring-purple-500 focus:border-purple-900 w-full sm:text-sm border-gray-300  dark:border-zinc-700 rounded-md focus:outline-none text-gray-600 dark:text-white cursor-pointer pr-8"
                    placeholder={cuestion.placeholder}
                    {...register(cuestion.name, cuestion.require ? { required: "El campo es obligatorio." } : {})}
                />
                {birthDate && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white"
                        aria-label="Limpiar fecha"
                    >
                        ×
                    </button>
                )}
                {showDatePicker && (
                    <div className="absolute z-10 mt-1 w-full dark:text-white bg-white dark:bg-zinc-800 border border-gray-300  dark:border-zinc-700 rounded-md shadow-lg p-2">
                        <div className="grid grid-cols-3 gap-2">
                            <select
                                aria-label="Seleccionar año"
                                className="bg-white dark:bg-zinc-800 border-gray-300 px-2 py-1 border dark:border-zinc-700 rounded-md"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                            <select
                                aria-label="Seleccionar mes"
                                className="bg-white dark:bg-zinc-800 border-gray-300 px-2 py-1 border dark:border-zinc-700 rounded-md"
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                            >
                                {months.map((m, index) => (
                                    <option key={m} value={index}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <select
                                aria-label="Seleccionar día"
                                className="bg-white dark:bg-zinc-800 border-gray-300 px-2 py-1 border dark:border-zinc-700 rounded-md"
                                value={day}
                                onChange={(e) => setDay(parseInt(e.target.value))}
                            >
                                {days.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            onClick={handleAccept}
                        >
                            Aceptar
                        </button>
                    </div>
                )}
            </div>
            {errors[cuestion.name] && <span className="text-red-400 p-1">{errors[cuestion.name]?.message}</span>}
        </div>
    );
}
