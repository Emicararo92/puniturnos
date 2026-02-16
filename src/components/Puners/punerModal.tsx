/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import styles from "./CadeteModal.module.css";

export default function CadeteModal({ cadete, onClose }: any) {
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

        {cadete.prioridad_manual !== null && (
          <p>
            <strong>Prioridad:</strong> {cadete.prioridad_manual}
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

        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
