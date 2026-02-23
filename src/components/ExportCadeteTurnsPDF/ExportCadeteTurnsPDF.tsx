/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { createClient } from "@/lib/supabase/client";
import { useZona } from "../../Context/zonaContext";
import styles from "./ExportCadeteTurnsPDF.module.css";

export default function ExportCadeteTurnsPDF({
  cadete,
  semanaRef,
  className = "",
}: any) {
  const supabase = createClient();
  const { zonaSeleccionada } = useZona();

  const [open, setOpen] = useState(false);
  const [turnos, setTurnos] = useState<any[]>([]);
  const capturaRef = useRef<HTMLDivElement>(null);

  /* =========================
     UTILIDADES SEGURAS FECHA
  ========================== */

  function parseLocalDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function formatLocalDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return formatLocalDate(monday);
  }

  function getWeekDays(monday: string) {
    const days = [];
    const base = parseLocalDate(monday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);

      days.push({
        fecha: formatLocalDate(d),
        label: d.toLocaleDateString("es-AR", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      });
    }

    return days;
  }

  /* ========================= */

  async function cargarTurnos() {
    if (!cadete?.id || !zonaSeleccionada) return;

    const semana = semanaRef || getMonday(new Date());

    const { data } = await supabase.rpc("get_tablero_semanal_zona", {
      semana_ref: semana,
      zona: zonaSeleccionada,
    });

    if (!data) return;

    const filtrados = data.filter(
      (r: any) => r.estado_turno === "asignado" && r.cadete_id === cadete.id,
    );

    setTurnos(filtrados);
    setOpen(true);
  }

  async function capturarYEnviar() {
    if (!capturaRef.current || !cadete.telefono) return;

    const element = capturaRef.current;
    const rect = element.getBoundingClientRect();

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      width: rect.width,
      height: rect.height,
      windowWidth: rect.width,
      windowHeight: rect.height,
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = imgData;
    link.download = `turnos-${cadete.nombre}.png`;
    link.click();

    const numero = cadete.telefono.replace(/\D/g, "");
    const mensaje = encodeURIComponent(
      `Hola ${cadete.nombre} 👋\nTe paso tu calendario semanal.`,
    );

    window.open(`https://wa.me/${numero}?text=${mensaje}`, "_blank");
  }

  const semana = semanaRef || getMonday(new Date());
  const diasSemana = getWeekDays(semana);

  const turnosPorDia: Record<string, string[]> = {};
  diasSemana.forEach((d) => (turnosPorDia[d.fecha] = []));

  turnos.forEach((t: any) => {
    if (turnosPorDia[t.fecha_turno]) {
      turnosPorDia[t.fecha_turno].push(
        `${t.hora_inicio.slice(0, 5)} - ${t.hora_fin.slice(0, 5)}`,
      );
    }
  });

  return (
    <>
      <button
        onClick={cargarTurnos}
        className={`${styles.exportButton} ${className}`}
      >
        📅 Ver calendario semanal
      </button>

      {open && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div ref={capturaRef} className={styles.capturaContent}>
              <h3>Calendario de {cadete.nombre}</h3>

              <div className={styles.subtitulo}>
                Semana del {parseLocalDate(semana).toLocaleDateString("es-AR")}
              </div>

              <div className={styles.calendar}>
                {diasSemana.map((dia) => (
                  <div key={dia.fecha} className={styles.dayColumn}>
                    <div className={styles.dayHeader}>{dia.label}</div>

                    {turnosPorDia[dia.fecha].length === 0 ? (
                      <div className={styles.empty}>—</div>
                    ) : (
                      turnosPorDia[dia.fecha].map(
                        (turno: string, i: number) => (
                          <div key={i} className={styles.turnoItem}>
                            {turno}
                          </div>
                        ),
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <button onClick={capturarYEnviar}>
                📸 Capturar y enviar por WhatsApp
              </button>

              <button onClick={() => setOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
