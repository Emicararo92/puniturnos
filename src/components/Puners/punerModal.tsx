/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createClient } from "@/lib/supabase/client";
import styles from "./CadeteModal.module.css";

export default function CadeteModal({ cadete, onClose, onUpdated }: any) {
  const supabase = createClient();

  async function toggleActivo() {
    const hoy = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("cadetes")
      .update({
        activo: !cadete.activo,
        fecha_baja: cadete.activo ? hoy : null,
      })
      .eq("id", cadete.id);

    if (!error) {
      onUpdated?.();
      onClose();
    } else {
      console.error(error);
      alert("Error actualizando cadete");
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{cadete.nombre}</h3>

        <p>
          <strong>Estado:</strong> {cadete.activo ? "Activo" : "Inactivo"}
        </p>

        {cadete.telefono && (
          <p>
            <strong>Teléfono:</strong>{" "}
            <a href={`tel:${cadete.telefono}`}>{cadete.telefono}</a>
          </p>
        )}

        {cadete.notas && (
          <p>
            <strong>Notas:</strong> {cadete.notas}
          </p>
        )}

        {cadete.created_at && (
          <p>
            <strong>Alta:</strong>{" "}
            {new Date(cadete.created_at).toLocaleDateString("es-AR")}
          </p>
        )}

        {cadete.fecha_baja && (
          <p>
            <strong>Baja:</strong>{" "}
            {new Date(cadete.fecha_baja).toLocaleDateString("es-AR")}
          </p>
        )}

        <button onClick={toggleActivo}>
          {cadete.activo ? "Dar de baja" : "Reactivar"}
        </button>

        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
