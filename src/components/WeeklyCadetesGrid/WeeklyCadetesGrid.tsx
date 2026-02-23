/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useZona } from "../../Context/zonaContext";
import styles from "./WeeklyCadetesGrid.module.css";

export default function WeeklyCadetesGrid({ semanaRef }: any) {
  const supabase = createClient();
  const { zonaSeleccionada } = useZona();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDays, setOpenDays] = useState<string[]>([]);
  const [allOpen, setAllOpen] = useState(false); // Estado para toggle general

  useEffect(() => {
    if (!zonaSeleccionada || !semanaRef) return;
    load();
  }, [zonaSeleccionada, semanaRef]);

  async function load() {
    setLoading(true);

    const { data } = await supabase.rpc("get_tablero_semanal_zona", {
      semana_ref: semanaRef,
      zona: zonaSeleccionada,
    });

    setData(data || []);
    setLoading(false);
  }

  // Toggle para día individual
  const toggleDay = (fecha: string) => {
    setOpenDays((prev) =>
      prev.includes(fecha) ? prev.filter((d) => d !== fecha) : [...prev, fecha],
    );
  };

  // Toggle para todos los días (solo desktop)
  const toggleAllDays = () => {
    if (allOpen) {
      setOpenDays([]);
    } else {
      setOpenDays(diasOrdenados);
    }
    setAllOpen(!allOpen);
  };

  // ===== AGRUPAR =====
  const estructura: Record<string, any> = {};

  data.forEach((item: any) => {
    if (!item?.fecha_turno) return;

    const fecha = item.fecha_turno;

    if (!estructura[fecha]) {
      estructura[fecha] = {};
    }

    if (!estructura[fecha][item.turno_id]) {
      estructura[fecha][item.turno_id] = {
        hora_inicio: item.hora_inicio,
        hora_fin: item.hora_fin,
        cadetes: [],
      };
    }

    if (item.estado_turno === "asignado" && item.nombre) {
      estructura[fecha][item.turno_id].cadetes.push(item.nombre);
    }
  });

  const diasOrdenados = Object.keys(estructura).sort();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Vista Semanal de Asignaciones</h3>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          {/* BOTÓN TOGGLE GENERAL (solo visible en desktop) */}
          <div className={styles.toggleContainer}>
            <button className={styles.toggleButton} onClick={toggleAllDays}>
              <span>{allOpen ? "Ocultar todos" : "Ver todos los días"}</span>
              <span
                className={`${styles.toggleIcon} ${allOpen ? styles.open : ""}`}
              >
                ▼
              </span>
            </button>
          </div>

          {/* ACORDEÓN */}
          <div className={styles.accordion}>
            {diasOrdenados.map((fecha) => {
              const fechaObj = new Date(fecha + "T00:00:00");
              const isOpen = openDays.includes(fecha);

              return (
                <div key={fecha} className={styles.accordionItem}>
                  <button
                    className={`${styles.accordionHeader} ${isOpen ? styles.active : ""}`}
                    onClick={() => toggleDay(fecha)}
                  >
                    <span>
                      {fechaObj.toLocaleDateString("es-AR", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span
                      className={`${styles.accordionIcon} ${isOpen ? styles.open : ""}`}
                    >
                      ▼
                    </span>
                  </button>

                  <div
                    className={`${styles.accordionContent} ${isOpen ? styles.open : ""}`}
                  >
                    <div className={styles.contentInner}>
                      {Object.values(estructura[fecha])
                        .sort((a: any, b: any) =>
                          a.hora_inicio.localeCompare(b.hora_inicio),
                        )
                        .map((turno: any, i: number) => (
                          <div key={i} className={styles.turnoBlock}>
                            <div className={styles.turnoHora}>
                              {turno.hora_inicio.slice(0, 5)} -{" "}
                              {turno.hora_fin.slice(0, 5)}
                            </div>

                            {turno.cadetes.length === 0 ? (
                              <div className={styles.empty}>Sin asignar</div>
                            ) : (
                              turno.cadetes.map(
                                (nombre: string, idx: number) => (
                                  <div key={idx} className={styles.cadete}>
                                    {nombre}
                                  </div>
                                ),
                              )
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
