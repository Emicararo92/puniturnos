/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./AssignCadeteModal.module.css";
import { createClient } from "@/lib/supabase/client";

type Props = {
  open: boolean;
  onClose: () => void;
  turnoId: string;
  fecha: string;
  onAssigned: () => void;
};

type Cadete = {
  id: string;
  nombre: string;
};

export default function AssignCadeteModal({
  open,
  onClose,
  turnoId,
  fecha,
  onAssigned,
}: Props) {
  const [cadetes, setCadetes] = useState<Cadete[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      loadCadetes();
      setSelected([]);
    }
  }, [open]);

  async function loadCadetes() {
    const { data } = await supabase
      .from("cadetes")
      .select("id,nombre")
      .eq("activo", true)
      .order("nombre");

    setCadetes(data || []);
  }

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function assignMultiple() {
    if (selected.length === 0) return;

    const payload = selected.map((cadeteId) => ({
      turno_id: turnoId,
      cadete_id: cadeteId,
      fecha,
      estado: "asignado",
    }));

    const { error } = await supabase
      .from("asignaciones_turno")
      .upsert(payload, {
        onConflict: "cadete_id,turno_id,fecha",
      });

    if (error) {
      console.error(error);
      alert("Error asignando cadetes");
      return;
    }

    onAssigned();
    setSelected([]);
  }

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Asignar Cadetes</h3>
          <p className={styles.subtitle}>Seleccioná uno o varios</p>
        </div>

        <div className={styles.content}>
          <div className={styles.list}>
            {cadetes.map((c) => (
              <label key={c.id} className={styles.item}>
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                />
                <span className={styles.itemName}>{c.nombre}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.assignBtn}
            onClick={assignMultiple}
            disabled={!selected.length}
          >
            Asignar ({selected.length})
          </button>

          <button className={styles.closeBtn} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
