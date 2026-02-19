/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useZona } from "../../Context/zonaContext";
import styles from "./HomeWeeklyTurns.module.css";

export default function HomeWeeklyTurns({ semanaRef = null }: any) {
  const supabase = createClient();
  const { zonaSeleccionada } = useZona();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Zona:", zonaSeleccionada);
    console.log("SemanaRef:", semanaRef);

    if (!zonaSeleccionada || !semanaRef) return;

    load();
  }, [zonaSeleccionada, semanaRef]);
  async function load() {
    setLoading(true);

    const { data } = await supabase.rpc("get_tablero_semanal_zona", {
      semana_ref: semanaRef,
      zona: zonaSeleccionada,
    });

    if (!data) {
      setLoading(false);
      return;
    }

    const resumen: Record<string, any> = {};

    data.forEach((r: any) => {
      if (r.estado_turno !== "asignado" || !r.cadete_id) return;

      if (!resumen[r.cadete_id]) {
        resumen[r.cadete_id] = {
          id: r.cadete_id,
          nombre: r.nombre,
          turnos: 0,
        };
      }

      resumen[r.cadete_id].turnos++;
    });

    const resultado = Object.values(resumen).sort(
      (a: any, b: any) => b.turnos - a.turnos,
    );

    setData(resultado);
    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Turnos de la semana</h3>

      {loading ? (
        <p>Cargando…</p>
      ) : data.length === 0 ? (
        <p>No hay asignaciones</p>
      ) : (
        <div className={styles.list}>
          {data.map((c: any, index: number) => (
            <div key={c.id ?? `${c.nombre}-${index}`} className={styles.row}>
              <span>{c.nombre}</span>
              <strong>{c.turnos}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
