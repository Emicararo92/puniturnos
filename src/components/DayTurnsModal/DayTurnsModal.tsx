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
    const monday = getMonday(fecha);

    const { data } = await supabase.rpc("get_tablero_semanal", {
      semana_ref: monday,
    });

    setData(data || []);
  }

  // Turnos fijos (estructura operativa)
  const turnos = [
    { inicio: "10:00:00", fin: "12:00:00" },
    { inicio: "12:00:00", fin: "16:00:00" },
    { inicio: "16:00:00", fin: "20:00:00" },
    { inicio: "20:00:00", fin: "00:00:00" },
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>{new Date(fecha).toLocaleDateString()}</h3>

        {turnos.map((t) => {
          const turnoData = data.filter(
            (x) => x.hora_inicio === t.inicio && x.fecha_turno === fecha,
          );

          const turnoId = data.find(
            (x) => x.hora_inicio === t.inicio,
          )?.turno_id;

          const cadetes = turnoData.map((c) => ({
            id: c.cadete_id,
            nombre: c.nombre,
          }));

          return (
            <TurnoCard
              key={t.inicio}
              turnoId={turnoId}
              horaInicio={t.inicio}
              horaFin={t.fin}
              fecha={fecha}
              cadetes={cadetes}
              cupoMax={turnoData[0]?.cupo_max}
              refresh={loadTurnos}
            />
          );
        })}

        <button onClick={onClose} className={styles.close}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
