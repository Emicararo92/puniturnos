/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useEffect, useState } from "react";
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
  const supabase = createClient();

  useEffect(() => {
    if (open) loadCadetes();
  }, [open]);

  async function loadCadetes() {
    const { data } = await supabase
      .from("cadetes")
      .select("id,nombre")
      .eq("activo", true)
      .order("nombre");

    setCadetes(data || []);
  }

  async function assign(cadeteId: string) {
    await supabase.from("asignaciones_turno").upsert({
      turno_id: turnoId,
      cadete_id: cadeteId,
      fecha,
      estado: "asignado",
    });

    onAssigned();
    onClose();
  }

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Asignar cadete</h3>

        <div className={styles.list}>
          {cadetes.map((c) => (
            <button
              key={c.id}
              className={styles.item}
              onClick={() => assign(c.id)}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        <button className={styles.close} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
