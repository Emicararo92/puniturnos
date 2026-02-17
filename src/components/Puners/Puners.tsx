/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useZona } from "../../Context/zonaContext";
import CadeteModal from "./punerModal";
import CadeteForm from "./punerForm";
import styles from "./Puners.module.css";

export default function Puners() {
  const supabase = createClient();
  const { zonaSeleccionada } = useZona();

  const [cadetes, setCadetes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadCadetes() {
    if (!zonaSeleccionada) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("cadetes")
      .select("*")
      .eq("zona_id", zonaSeleccionada)
      .order("activo", { ascending: false })
      .order("prioridad_manual", { ascending: true, nullsFirst: false })
      .order("nombre", { ascending: true });

    if (!error && data) setCadetes(data);

    setLoading(false);
  }

  useEffect(() => {
    loadCadetes();
  }, [zonaSeleccionada]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Cadetes</h2>

        <button className={styles.newBtn} onClick={() => setShowForm(true)}>
          + Nuevo cadete
        </button>
      </div>

      {loading && <p>Cargando…</p>}

      <div className={styles.list}>
        {cadetes.map((c) => (
          <div
            key={c.id}
            className={`${styles.card} ${!c.activo ? styles.inactive : ""}`}
            onClick={() => setSelected(c)}
          >
            <strong>{c.nombre}</strong>
            <span>{c.activo ? "Activo" : "Inactivo"}</span>
          </div>
        ))}
      </div>

      {selected && (
        <CadeteModal
          cadete={selected}
          onClose={() => setSelected(null)}
          onUpdated={loadCadetes}
        />
      )}

      {showForm && (
        <CadeteForm
          onClose={() => setShowForm(false)}
          onCreated={loadCadetes}
        />
      )}
    </div>
  );
}
