/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useZona } from "../../Context/zonaContext";
import styles from "./CadeteForm.module.css";

export default function CadeteForm({ onClose, onCreated }: any) {
  const supabase = createClient();
  const { zonaSeleccionada } = useZona();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [activo, setActivo] = useState(true);
  const [prioridad, setPrioridad] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!zonaSeleccionada) {
      alert("Seleccioná una zona antes de crear cadetes.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("cadetes").insert({
      nombre,
      telefono: telefono || null,
      notas: notas || null,
      activo,
      prioridad_manual: prioridad ? Number(prioridad) : null,
      zona_id: zonaSeleccionada,
    });

    setLoading(false);

    if (!error) {
      onCreated();
      onClose();
    } else {
      alert("Error guardando cadete");
      console.error(error);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className={styles.modalHeader}>
          <h3>Nuevo cadete</h3>
          <button
            type="button"
            className={styles.closeModalBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <input
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <input
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />

        <textarea
          placeholder="Notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />

        <input
          placeholder="Prioridad manual"
          type="number"
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={activo}
            onChange={() => setActivo(!activo)}
          />
          Activo
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </div>
  );
}
