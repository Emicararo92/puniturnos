"use client";

import { useState } from "react";
import styles from "./WeeklyBoard.module.css";
import DayTurnsModal from "../DayTurnsModal/DayTurnsModal";

export default function WeeklyBoard() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [semanaRef, setSemanaRef] = useState(getMonday(new Date()));

  function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  }

  function changeWeek(offset: number) {
    const d = new Date(semanaRef);
    d.setDate(d.getDate() + offset * 7);
    setSemanaRef(getMonday(d));
  }

  const dias = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(semanaRef);
    d.setDate(d.getDate() + i);

    return {
      fechaISO: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }),
    };
  });

  return (
    <div className={styles.container}>
      {/* Selector semana */}
      <div className={styles.weekNav}>
        <button onClick={() => changeWeek(-1)}>← Semana</button>

        <strong>
          Semana del {new Date(semanaRef).toLocaleDateString("es-AR")}
        </strong>

        <div>
          <button onClick={() => setSemanaRef(getMonday(new Date()))}>
            Hoy
          </button>

          <button onClick={() => changeWeek(1)}>Semana →</button>
        </div>
      </div>

      {/* Días */}
      <div className={styles.daysGrid}>
        {dias.map((d) => (
          <div
            key={d.fechaISO}
            className={styles.dayCard}
            onClick={() => setSelectedDay(d.fechaISO)}
          >
            {d.label}
          </div>
        ))}
      </div>

      {selectedDay && (
        <DayTurnsModal
          fecha={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
