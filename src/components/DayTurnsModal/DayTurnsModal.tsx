/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import styles from "./DayTurnsModal.module.css";
import { createClient } from "@/lib/supabase/client";
import TurnoCard from "../TurnoCard/TurnoCard";

type Props = {
  fecha: string;
  onClose: () => void;
};

export default function DayTurnsModal({ fecha, onClose }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadTurnos();
  }, [fecha]);

  function getMonday(dateStr: string) {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);

    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  }

  async function loadTurnos() {
    setLoading(true);
    const monday = getMonday(fecha);

    const { data } = await supabase.rpc("get_tablero_semanal", {
      semana_ref: monday,
    });

    setData(data || []);
    setLoading(false);
  }

  const turnosDelDia = Object.values(
    data
      .filter(
        (x) => new Date(x.fecha_turno).toISOString().slice(0, 10) === fecha,
      )
      .reduce((acc: any, curr) => {
        if (!acc[curr.turno_id]) {
          acc[curr.turno_id] = {
            turnoId: curr.turno_id,
            horaInicio: curr.hora_inicio,
            horaFin: curr.hora_fin,
            cupoMax: curr.cupo_max,
            cadetes: [],
          };
        }

        if (curr.cadete_id) {
          acc[curr.turno_id].cadetes.push({
            id: curr.cadete_id,
            nombre: curr.nombre,
            falta: curr.falta,
            llegada_tarde: curr.llegada_tarde,
            tardanza_pedido: curr.tardanza_pedido,
            activacion_tardia: curr.activacion_tardia,
          });
        }

        return acc;
      }, {}),
  );

  const diaFormateado = new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const turnosAsignados = turnosDelDia.reduce(
    (total: number, t: any) => total + t.cadetes.length,
    0,
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.dateContainer}>
              <span className={styles.calendarIcon}>📅</span>
              <div>
                <h2 className={styles.title}>Turnos del Día</h2>
                <p className={styles.date}>{diaFormateado}</p>
              </div>
            </div>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{turnosDelDia.length}</span>
                <span className={styles.statLabel}>Turnos</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{turnosAsignados}</span>
                <span className={styles.statLabel}>Asignaciones</span>
              </div>
            </div>
          </div>
          <button className={styles.closeHeaderBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Cargando turnos...</p>
            </div>
          ) : turnosDelDia.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <h3 className={styles.emptyTitle}>No hay turnos programados</h3>
              <p className={styles.emptyText}>
                No se encontraron turnos para este día
              </p>
            </div>
          ) : (
            <div className={styles.turnosGrid}>
              {turnosDelDia.map((t: any) => (
                <div key={t.turnoId} className={styles.turnoCardWrapper}>
                  <div className={styles.turnoHeader}>
                    <span className={styles.timeBadge}>
                      ⏰ {t.horaInicio} - {t.horaFin}
                    </span>
                    <span
                      className={`${styles.cupoBadge} ${
                        t.cadetes.length >= t.cupoMax
                          ? styles.cupoFull
                          : t.cadetes.length === 0
                            ? styles.cupoEmpty
                            : styles.cupoPartial
                      }`}
                    >
                      {t.cadetes.length}/{t.cupoMax}
                    </span>
                  </div>
                  <TurnoCard
                    turnoId={t.turnoId}
                    horaInicio={t.horaInicio}
                    horaFin={t.horaFin}
                    fecha={fecha}
                    cadetes={t.cadetes}
                    cupoMax={t.cupoMax}
                    refresh={loadTurnos}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <span className={styles.infoTag}>
              Total del día: {turnosDelDia.length} turnos
            </span>
            <span className={styles.infoTag}>
              Asignaciones: {turnosAsignados}
            </span>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
}
