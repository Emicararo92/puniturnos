/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

  function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  }

  function getWeekDays(monday: string) {
    const days = [];
    const date = new Date(monday);

    for (let i = 0; i < 7; i++) {
      const current = new Date(date);
      current.setDate(date.getDate() + i);
      days.push({
        fecha: current.toISOString().slice(0, 10),
        dia: current.toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "short",
        }),
        diaCorto: current.toLocaleDateString("es-AR", { weekday: "short" }),
        numero: current.getDate(),
      });
    }
    return days;
  }

  async function generarPDF() {
    if (!cadete?.id || !zonaSeleccionada) return;

    const semana = semanaRef || getMonday(new Date());

    const { data } = await supabase.rpc("get_tablero_semanal_zona", {
      semana_ref: semana,
      zona: zonaSeleccionada,
    });

    if (!data) return;

    // ===== Filtrar solo turnos del cadete =====
    const turnosCadete = data.filter(
      (r: any) => r.estado_turno === "asignado" && r.cadete_id === cadete.id,
    );

    // ===== Organizar por día =====
    const diasSemana = getWeekDays(semana);
    const turnosPorDia: Record<string, string[]> = {};

    diasSemana.forEach((d) => {
      turnosPorDia[d.fecha] = [];
    });

    turnosCadete.forEach((t: any) => {
      if (turnosPorDia[t.fecha_turno]) {
        turnosPorDia[t.fecha_turno].push(
          `${t.hora_inicio.slice(0, 5)} - ${t.hora_fin.slice(0, 5)}`,
        );
      }
    });

    // ===== PDF con formato CALENDARIO SEMANAL =====
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // ===== HEADER =====
    doc.setFillColor(34, 57, 90); // #22395a
    doc.rect(0, 0, 297, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("PuniWorks", 14, 15);

    doc.setFontSize(11);
    doc.text(`Calendario de Turnos - ${cadete.nombre}`, 14, 22);

    // ===== INFO CADETE =====
    doc.setTextColor(34, 57, 90);
    doc.setFontSize(10);
    doc.text(
      `Semana: ${new Date(semana).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
      14,
      32,
    );

    // ===== CALENDARIO SEMANAL =====
    let startY = 40;
    const colWidth = 38; // Ancho para cada día
    const startX = 14;

    // Encabezados de días
    diasSemana.forEach((dia, index) => {
      const x = startX + index * colWidth;

      // Fondo del día
      doc.setFillColor(248, 187, 209); // #f8bbd1
      doc.rect(x, startY, colWidth - 1, 12, "F");

      // Texto del día
      doc.setTextColor(34, 57, 90);
      doc.setFontSize(9);
      doc.text(dia.diaCorto.toUpperCase(), x + 2, startY + 7);
      doc.setFontSize(11);
      doc.text(dia.numero.toString(), x + colWidth - 8, startY + 7);
    });

    // Turnos por día
    const currentY = startY + 15;
    const maxTurnosPorDia = Math.max(
      ...Object.values(turnosPorDia).map((t) => t.length),
    );

    for (let fila = 0; fila < maxTurnosPorDia; fila++) {
      for (let col = 0; col < 7; col++) {
        const fecha = diasSemana[col].fecha;
        const turnos = turnosPorDia[fecha] || [];
        const x = startX + col * colWidth;
        const y = currentY + fila * 8;

        if (fila < turnos.length) {
          // Celda con turno
          doc.setFillColor(240, 240, 240);
          doc.rect(x, y, colWidth - 1, 7, "F");

          doc.setTextColor(34, 57, 90);
          doc.setFontSize(8);
          doc.text(turnos[fila], x + 2, y + 4);
        } else {
          // Celda vacía (borde sutil)
          doc.setDrawColor(220, 220, 220);
          doc.rect(x, y, colWidth - 1, 7);
        }
      }
    }

    // ===== RESUMEN SEMANAL =====
    const totalTurnos = turnosCadete.length;
    const diasConTurnos = Object.values(turnosPorDia).filter(
      (t) => t.length > 0,
    ).length;

    startY = currentY + maxTurnosPorDia * 8 + 15;

    doc.setFillColor(34, 57, 90);
    doc.rect(14, startY, 100, 15, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("RESUMEN SEMANAL", 20, startY + 7);

    doc.setTextColor(34, 57, 90);
    doc.setFontSize(9);
    doc.text(`Total turnos: ${totalTurnos}`, 20, startY + 20);
    doc.text(`Días con turnos: ${diasConTurnos}`, 20, startY + 25);
    doc.text(
      `Promedio diario: ${(totalTurnos / 7).toFixed(1)}`,
      20,
      startY + 30,
    );

    // ===== LEYENDA =====
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Generado por PuniWorks - Sistema de Gestión de Turnos", 14, 190);

    doc.save(`turnos-${cadete.nombre}-semana.pdf`);
  }

  return (
    <button
      onClick={generarPDF}
      className={`${styles.exportButton} ${className}`}
    >
      <span>📅</span> Calendario semanal PDF
    </button>
  );
}
