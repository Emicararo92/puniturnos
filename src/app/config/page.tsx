/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useZona } from "../../Context/zonaContext";
import styles from "./ConfigTurnos.module.css";

export default function ConfigTurnosPage() {
  const supabase = createClient();
  const { zonaSeleccionada } = useZona();

  const [semanaRef, setSemanaRef] = useState(getMonday(new Date()));
  const [maxTurnos, setMaxTurnos] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);

    d.setDate(diff);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dayNum = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${dayNum}`;
  }

  function changeWeek(offset: number) {
    const [y, m, d] = semanaRef.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset * 7);
    setSemanaRef(getMonday(date));
  }

  async function loadConfig() {
    if (!zonaSeleccionada) return;

    const { data } = await supabase
      .from("turnos_config")
      .select("max_turnos")
      .eq("zona_id", zonaSeleccionada)
      .lte("semana", semanaRef)
      .order("semana", { ascending: false })
      .limit(1)
      .maybeSingle();

    setMaxTurnos(data?.max_turnos ?? 0);
  }

  async function save() {
    if (!zonaSeleccionada) return;

    const hoy = getMonday(new Date());

    // 🔥 BLOQUEO SEMANAS PASADAS
    if (semanaRef < hoy) {
      alert("No podés modificar semanas pasadas");
      return;
    }

    if (maxTurnos < 1 || maxTurnos > 100) {
      alert("El valor debe estar entre 1 y 100");
      return;
    }

    setLoading(true);

    // 🔥 BORRAR FUTURAS
    const { error: deleteError } = await supabase
      .from("turnos_config")
      .delete()
      .eq("zona_id", zonaSeleccionada)
      .gt("semana", semanaRef);

    if (deleteError) {
      console.error(deleteError);
      alert("Error limpiando futuras");
      setLoading(false);
      return;
    }

    // 🔥 UPSERT MANUAL
    const { data: existing } = await supabase
      .from("turnos_config")
      .select("id")
      .eq("zona_id", zonaSeleccionada)
      .eq("semana", semanaRef)
      .maybeSingle();

    let error = null;

    if (existing?.id) {
      const res = await supabase
        .from("turnos_config")
        .update({ max_turnos: maxTurnos })
        .eq("id", existing.id);

      error = res.error;
    } else {
      const res = await supabase.from("turnos_config").insert({
        zona_id: zonaSeleccionada,
        semana: semanaRef,
        max_turnos: maxTurnos,
      });

      error = res.error;
    }

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Error guardando");
      return;
    }

    alert("Guardado correctamente");
    loadConfig();
  }

  useEffect(() => {
    loadConfig();
  }, [zonaSeleccionada, semanaRef]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Configuración de Turnos</h2>

      <div className={styles.weekNav}>
        <button onClick={() => changeWeek(-1)}>←</button>

        <span>
          {new Date(semanaRef).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
          })}
        </span>

        <button onClick={() => changeWeek(1)}>→</button>
      </div>

      <div className={styles.infoBox}>
        ⚙️ Se aplica desde esta semana hacia adelante
      </div>

      <input
        type="number"
        value={maxTurnos}
        onChange={(e) => setMaxTurnos(Number(e.target.value))}
      />

      <button onClick={save} disabled={loading}>
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}
    