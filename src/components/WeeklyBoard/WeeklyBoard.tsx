/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import styles from "./WeeklyBoard.module.css";
import DayTurnsModal from "../DayTurnsModal/DayTurnsModal";
import { createClient } from "@/lib/supabase/client";

export default function WeeklyBoard({ semanaRef, setSemanaRef }: any) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dayStats, setDayStats] = useState<Record<string, any>>({});
  const supabase = createClient();

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

  // 👉 Cargar estadísticas reales
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
      const turnosPorDia: Record<string, Set<string>> = {};

      (data || []).forEach((item: any) => {
        if (!item?.fecha_turno) return;

        const fecha = new Date(item.fecha_turno).toISOString().slice(0, 10);

        if (!stats[fecha]) {
          stats[fecha] = {
            turnos: 0,
            asignados: 0,
            completados: 0,
            urgentes: 0,
          };

          turnosPorDia[fecha] = new Set();
        }

        // 👉 Turnos únicos
        if (item.turno_id) {
          turnosPorDia[fecha].add(item.turno_id);
          stats[fecha].turnos = turnosPorDia[fecha].size;
        }

        // 👉 Asignados reales
        if (item.estado_turno === "asignado") {
          stats[fecha].asignados++;
        }

        if (item.estado_turno === "completado") {
          stats[fecha].completados++;
        }
      });

      setDayStats(stats);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  }

  const dias = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(semanaRef);
    d.setDate(d.getDate() + i);

    const fechaISO = d.toISOString().slice(0, 10);
    const hoy = new Date().toISOString().slice(0, 10);

    const stats = dayStats[fechaISO] || {
      turnos: 0,
      asignados: 0,
      completados: 0,
      urgentes: 0,
    };

    // 👉 PRIORIDAD ORIGINAL (no tocar badges)
    let priorityClass = "";
    if (stats.asignados === 0 && stats.turnos > 0) {
      priorityClass = styles.highPriority;
    } else if (stats.asignados < stats.turnos * 0.5) {
      priorityClass = styles.mediumPriority;
    } else if (stats.asignados === stats.turnos) {
      priorityClass = styles.completed;
    }

    return {
      fechaISO,
      label: d.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }),
      isToday: fechaISO === hoy,
      stats,
      priorityClass,
      notifications: stats.turnos - stats.asignados,
    };
  });

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.weekNav}>
        <button onClick={() => changeWeek(-1)}>
          <span>←</span> Semana Anterior
        </button>

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
            Ir a Hoy
          </button>

          <button onClick={() => changeWeek(1)}>
            Próxima Semana <span>→</span>
          </button>
        </div>
      </div>

      {/* GRID DIAS */}
      <div className={styles.daysGrid}>
        {dias.map((dia) => (
          <div
            key={dia.fechaISO}
            className={`${styles.dayCard} ${
              dia.isToday ? styles.today : ""
            } ${dia.priorityClass} ${loading ? styles.loading : ""}`}
            onClick={() => !loading && setSelectedDay(dia.fechaISO)}
            data-notifications={
              dia.notifications > 0 ? dia.notifications : undefined
            }
          >
            <div className={styles.dateLabel}>
              {dia.label}
              {dia.isToday && (
                <span style={{ fontSize: "0.8em", marginLeft: "8px" }}>📍</span>
              )}
            </div>

            <div className={styles.turnStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{dia.stats.turnos}</span>
                <span className={styles.statLabel}>Turnos</span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statValue}>{dia.stats.asignados}</span>
                <span className={styles.statLabel}>Asignados</span>
              </div>
            </div>

            {/* 👉 BADGE ORIGINAL RESTAURADO */}
            {dia.priorityClass === styles.highPriority && (
              <div
                style={{
                  position: "absolute",
                  bottom: "15px",
                  left: "15px",
                  background: "linear-gradient(135deg,#ef4444,#dc2626)",
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(239,68,68,.4)",
                }}
              >
                ¡Asignar!
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedDay && (
        <DayTurnsModal
          fecha={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* FOOTER INFO */}
      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          background: "rgba(255,255,255,.05)",
          borderRadius: "15px",
          border: "1px solid rgba(255,255,255,.1)",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <Legend color="#4f46e5" text="Turno asignado" />
        <Legend color="#10b981" text="Completado" />
        <Legend color="#ef4444" text="Urgente / Sin asignar" />
        <Legend color="#f59e0b" text="Asignación parcial" />
      </div>
    </div>
  );
}

function Legend({ color, text }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: "12px",
          height: "12px",
          background: color,
          borderRadius: "50%",
        }}
      />
      <span style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>{text}</span>
    </div>
  );
}
