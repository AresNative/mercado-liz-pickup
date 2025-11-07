import React, { useState, useMemo, useCallback } from "react";
import {
    addMinutes,
    parseISO,
    isSameDay,
    isBefore,
    startOfDay,
    format,
    areIntervalsOverlapping,
} from "date-fns";
import { es } from "date-fns/locale";
import { timeOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";

type Cita = { nombre_lista: string };

const useTimeSlots = (selectedDate: string | null, citasExistentes: Cita[]) => {
    return useMemo(() => {
        if (!selectedDate) return { morningSlots: [], afternoonSlots: [] };

        const SLOT_MINUTES = 30;
        const day = startOfDay(parseISO(selectedDate));
        const now = new Date();
        const isToday = isSameDay(day, now);

        // Horario: 09:30 -> 16:00
        const startHour = 9;
        const startMinute = 30;
        const endHour = 16;
        const endMinute = 0;

        const startDate = new Date(day);
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(day);
        endDate.setHours(endHour, endMinute, 0, 0);

        // Transformar citas reservadas a intervalos
        const bookedIntervals = citasExistentes
            .map((c) => {
                try {
                    const start = parseISO(c.nombre_lista);
                    const end = addMinutes(start, SLOT_MINUTES);
                    return { start, end };
                } catch {
                    return null;
                }
            })
            .filter(Boolean) as { start: Date; end: Date }[];

        const slots: { id: string; time: string; isAvailable: boolean }[] = [];

        for (
            let t = startDate.getTime();
            t <= endDate.getTime();
            t += SLOT_MINUTES * 60_000
        ) {
            const slotStart = new Date(t);
            const slotEnd = addMinutes(slotStart, SLOT_MINUTES);

            // No mostrar slots que ya pasaron (solo para hoy)
            if (isToday && isBefore(slotStart, now)) continue;

            // Comprobar solapamiento con reservas
            const available = !bookedIntervals.some((b) =>
                areIntervalsOverlapping({ start: slotStart, end: slotEnd }, b)
            );

            slots.push({
                id: slotStart.toISOString(),
                time: slotStart.toISOString(),
                isAvailable: available,
            });
        }

        // Separar mañana/tarde por 13:00
        const midday = new Date(day);
        midday.setHours(13, 0, 0, 0);

        const morningSlots = slots.filter((s) => parseISO(s.time) < midday);
        const afternoonSlots = slots.filter((s) => parseISO(s.time) >= midday);

        return { morningSlots, afternoonSlots };
    }, [selectedDate, citasExistentes]);
};

interface TimeRanges {
    selectedDate: string | null;
    selectedTime: string | null;
    setSelectedTime: (time: string | null) => void;
}

const TimeSlots: React.FC<TimeRanges> = ({ selectedDate, setSelectedTime, selectedTime }) => {

    // ejemplo de citas existentes
    const citasExistentes = [
        { nombre_lista: "2025-11-01T10:00:00.000Z" },
        { nombre_lista: "2025-11-01T11:30:00.000Z" },
    ];

    const { morningSlots, afternoonSlots } = useTimeSlots(
        selectedDate,
        citasExistentes
    );

    const formatHour = useCallback((iso: string) => {
        return format(parseISO(iso), "hh:mm a", { locale: es });
    }, []);

    return (
        <section
            aria-labelledby="choose-time-heading"
            className="border-2 rounded-lg p-4 bg-white shadow-sm"
        >
            <header className="mb-3">
                <h2 id="choose-time-heading" className="text-lg font-semibold">
                    Selecciona hora
                </h2>
                <p className="text-sm text-gray-500">Elige un bloque disponible</p>
            </header>

            {!selectedDate ? (
                <p className="text-gray-500 text-sm" role="status">
                    Selecciona una fecha primero
                </p>
            ) : (
                <>
                    {morningSlots.length === 0 && afternoonSlots.length === 0 ? (
                        <p className="text-gray-500 text-sm" role="status">
                            No hay horarios disponibles para esta fecha
                        </p>
                    ) : (
                        <>
                            {morningSlots.length > 0 && (
                                <div className="mb-4" aria-labelledby="morning-label">
                                    <h3 id="morning-label" className="text-sm mb-2 text-gray-600">
                                        Mañana
                                    </h3>
                                    <ul className="grid grid-cols-3 gap-2" role="list">
                                        {morningSlots.map((slot) => {
                                            const disabled = !slot.isAvailable;
                                            const selected = selectedTime === slot.time;
                                            return (
                                                <li key={slot.id}>
                                                    <button
                                                        type="button"
                                                        aria-pressed={selected}
                                                        aria-label={`Hora ${formatHour(slot.time)} ${disabled ? "no disponible" : selected ? "seleccionada" : ""
                                                            }`}
                                                        disabled={disabled}
                                                        onClick={() => setSelectedTime(slot.time)}
                                                        className={`w-full p-2 rounded-md border text-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-400
                                                            ${selected ? "bg-purple-600 text-white border-purple-700" : ""}
                                                            ${!selected && !disabled ? "border-purple-200 hover:bg-purple-50" : ""}
                                                            ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed border-transparent" : ""}
                                                        `}
                                                    >
                                                        <IonIcon icon={timeOutline} />
                                                        <span>{formatHour(slot.time)}</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {afternoonSlots.length > 0 && (
                                <div aria-labelledby="afternoon-label">
                                    <h3 id="afternoon-label" className="text-sm mb-2 text-gray-600">
                                        Tarde
                                    </h3>
                                    <ul className="grid grid-cols-3 gap-2" role="list">
                                        {afternoonSlots.map((slot) => {
                                            const disabled = !slot.isAvailable;
                                            const selected = selectedTime === slot.time;
                                            return (
                                                <li key={slot.id}>
                                                    <button
                                                        type="button"
                                                        aria-pressed={selected}
                                                        aria-label={`Hora ${formatHour(slot.time)} ${disabled ? "no disponible" : selected ? "seleccionada" : ""
                                                            }`}
                                                        disabled={disabled}
                                                        onClick={() => setSelectedTime(slot.time)}
                                                        className={`w-full p-2 rounded-md border text-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-400
                                                            ${selected ? "bg-purple-600 text-white border-purple-700" : ""}
                                                            ${!selected && !disabled ? "border-purple-200 hover:bg-purple-50" : ""}
                                                            ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed border-transparent" : ""}
                                                        `}
                                                    >
                                                        <IonIcon icon={timeOutline} />
                                                        <span>{formatHour(slot.time)}</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <footer className="mt-4">
                <p className="text-xs text-gray-500" aria-live="polite">
                    {selectedTime
                        ? `Hora seleccionada: ${formatHour(selectedTime)}`
                        : "Ninguna hora seleccionada"}
                </p>
            </footer>
        </section>
    );
};

export default TimeSlots;
