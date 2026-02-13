/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import styles from "./WeeklyBoard.module.css";
import DayTurnsModal from "../DayTurnsModal/DayTurnsModal";
import TurnSummaryModal from "../TurnSummaryModal/TurnSummaryModal";
import { createClient } from "@/lib/supabase/client";

export default function WeeklyBoard({ semanaRef, setSemanaRef }: any) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [summaryDay, setSummaryDay] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dayStats, setDayStats] = useState<Record<string, any>>({});

  const supabase = createClient();

  function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toLocaleDateString("sv-SE");
  }

  function changeWeek(offset: number) {
    const [y, m, d] = semanaRef.split("-").map(Number);
    const date = new Date(y, m - 1, d);

    date.setDate(date.getDate() + offset * 7);

    setSemanaRef(getMonday(date));
  }

  useEffect(() => {
    loadWeekStats();
  }, [semanaRef]);

  async function loadWeekStats() {
    setLoading(true);

    try {
      const { data } = await supabase.rpc("get_tablero_semanal", {
        semana_ref: semanaRef,
      });

      const stats: Record<string, any> = {};

      (data || []).forEach((item: any) => {
        if (!item?.fecha_turno) return;

        const fecha = item.fecha_turno;

        if (!stats[fecha]) {
          stats[fecha] = {
            totalTurnos: new Set(),
            turnos: {},
          };
        }

        stats[fecha].totalTurnos.add(item.turno_id);

        if (!stats[fecha].turnos[item.turno_id]) {
          stats[fecha].turnos[item.turno_id] = {
            hora_inicio: item.hora_inicio,
            hora_fin: item.hora_fin,
            asignados: 0,
          };
        }

        const estado = item.estado_turno || item.estado;

        if (estado === "asignado") {
          stats[fecha].turnos[item.turno_id].asignados++;
        }
      });

      Object.keys(stats).forEach((f) => {
        stats[f].totalTurnos = stats[f].totalTurnos.size;
      });

      setDayStats(stats);
    } catch (error) {
      console.error("Error tablero:", error);
    } finally {
      setLoading(false);
    }
  }

  const dias = Object.keys(dayStats).map((fechaISO) => {
    const d = new Date(fechaISO + "T00:00:00");
    const hoy = new Date().toLocaleDateString("sv-SE");

    return {
      fechaISO,
      label: d.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }),
      isToday: fechaISO === hoy,
      stats: dayStats[fechaISO],
    };
  });

  return (
    <div className={styles.container}>
      <div className={styles.weekNav}>
        <button onClick={() => changeWeek(-1)}>← Semana Anterior</button>

        <strong>
          Semana del{" "}
          {new Date(semanaRef).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </strong>

        <div>
          <button onClick={() => setSemanaRef(getMonday(new Date()))}>
            Hoy
          </button>
          <button onClick={() => changeWeek(1)}>Próxima →</button>
        </div>
      </div>

      <div className={styles.daysGrid}>
        {dias.map((dia) => (
          <div
            key={dia.fechaISO}
            className={`${styles.dayCard} ${
              dia.isToday ? styles.today : ""
            } ${loading ? styles.loading : ""}`}
          >
            <span className={styles.dateLabel}>{dia.label}</span>

            <div className={styles.buttonGroup}>
              <button
                className={styles.summaryBtn}
                onClick={() => setSummaryDay(dia)}
              >
                Ver resumen
              </button>

              <button
                className={styles.assignBtn}
                onClick={() => setSelectedDay(dia.fechaISO)}
              >
                Asignar
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedDay && (
        <DayTurnsModal
          fecha={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {summaryDay && (
        <TurnSummaryModal
          day={summaryDay}
          onClose={() => setSummaryDay(null)}
        />
      )}
    </div>
  );
}
