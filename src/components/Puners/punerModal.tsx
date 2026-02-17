/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./CadeteModal.module.css";

export default function CadeteModal({ cadete, onClose, onUpdated }: any) {
  const supabase = createClient();
  const [confirmBaja, setConfirmBaja] = useState(false);

  async function ejecutarToggle() {
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

  function toggleActivo() {
    if (cadete.activo) {
      setConfirmBaja(true);
    } else {
      ejecutarToggle();
    }
  }

  function abrirWhatsapp() {
    if (!cadete.telefono) return;

    const numero = cadete.telefono.replace(/\D/g, "");
    const mensaje = encodeURIComponent(
      `Hola ${cadete.nombre}, te escribo por los turnos 🚀`,
    );

    window.open(`https://wa.me/${numero}?text=${mensaje}`, "_blank");
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

        {cadete.telefono && (
          <button onClick={abrirWhatsapp}>💬 Enviar WhatsApp</button>
        )}

        {/* CONFIRMACION VISUAL */}
        {confirmBaja ? (
          <div className={styles.confirmBox}>
            <p>¿Dar de baja a {cadete.nombre}?</p>

            <div className={styles.confirmActions}>
              <button onClick={ejecutarToggle}>Sí, dar de baja</button>

              <button onClick={() => setConfirmBaja(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={toggleActivo}>
            {cadete.activo ? "Dar de baja" : "Reactivar"}
          </button>
        )}

        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
  