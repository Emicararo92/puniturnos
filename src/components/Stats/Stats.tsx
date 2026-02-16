/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./EstadisticasPage.module.css";

export default function EstadisticasPage() {
  const supabase = createClient();

  const [data, setData] = useState<any[]>([]);
  const [prevData, setPrevData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [semanaRef, setSemanaRef] = useState(getMonday(new Date()));
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("efectividad");

  useEffect(() => {
    load();
  }, [semanaRef]);

  async function load() {
    setLoading(true);

    const { data } = await supabase.rpc("metricas_cadete", {
      semana_ref: semanaRef,
    });

    // semana anterior para tendencia
    const prevMonday = getMonday(
      new Date(new Date(semanaRef).getTime() - 7 * 86400000),
    );

    const { data: prev } = await supabase.rpc("metricas_cadete", {
      semana_ref: prevMonday,
    });

    setData(data || []);
    setPrevData(prev || []);
    setLoading(false);
  }

  function changeWeek(offset: number) {
    const [y, m, d] = semanaRef.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset * 7);
    setSemanaRef(getMonday(date));
  }

  const filtered = [...data]
    .filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (filtro === "llegadas") return b.llegadas_tarde - a.llegadas_tarde;
      if (filtro === "faltas") return b.faltas - a.faltas;
      if (filtro === "turnos") return b.turnos - a.turnos;
      return b.efectividad - a.efectividad;
    });

  // Calcular rango de la semana para mostrar
  const semanaInicio = new Date(semanaRef);
  const semanaFin = new Date(semanaRef);
  semanaFin.setDate(semanaFin.getDate() + 6);

  const formatoSemana = `${semanaInicio.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  })} - ${semanaFin.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>📊 Dashboard Cadetes</h2>
      </div>

      {/* NAV SEMANA Y CONTROLES */}
      <div className={styles.controls}>
        <div className={styles.weekNav}>
          <button
            onClick={() => changeWeek(-1)}
            className={styles.weekBtn}
            aria-label="Semana anterior"
          >
            ←
          </button>

          <div className={styles.weekInfo}>
            <span className={styles.weekLabel}>Semana actual</span>
            <strong className={styles.weekRange}>{formatoSemana}</strong>
          </div>

          <button
            onClick={() => changeWeek(1)}
            className={styles.weekBtn}
            aria-label="Semana siguiente"
          >
            →
          </button>

          <button
            onClick={() => setSemanaRef(getMonday(new Date()))}
            className={styles.weekBtnToday}
          >
            Hoy
          </button>
        </div>

        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            placeholder="Buscar cadete..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={styles.selectFilter}
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="efectividad">Mayor efectividad</option>
            <option value="llegadas">Más llegadas tarde</option>
            <option value="faltas">Más faltas</option>
            <option value="turnos">Más turnos</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando estadísticas…</p>
        </div>
      )}

      <div className={styles.cardsGrid}>
        {filtered.map((c) => {
          const prev = prevData.find((p) => p.cadete_id === c.cadete_id);

          return <CadeteCard key={c.cadete_id} cadete={c} prev={prev} />;
        })}
      </div>
    </div>
  );
}

function CadeteCard({ cadete, prev }: any) {
  const tendencia = prev
    ? cadete.efectividad > prev.efectividad
      ? "⬆ Mejora"
      : cadete.efectividad < prev.efectividad
        ? "⬇ Empeoró"
        : "➡ Estable"
    : "—";

  const confiabilidad =
    cadete.turnos > 0
      ? Math.round(
          ((cadete.turnos - cadete.faltas - cadete.llegadas_tarde * 0.5) /
            cadete.turnos) *
            100,
        )
      : 0;

  const recomendacion =
    cadete.faltas > 0
      ? "⚠ Revisar asistencia"
      : cadete.llegadas_tarde > 2
        ? "⏰ Problemas de puntualidad"
        : confiabilidad < 80
          ? "📉 Riesgo operativo"
          : cadete.efectividad >= 95
            ? "✅ Excelente rendimiento"
            : "🙂 Rendimiento normal";

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{cadete.nombre}</h3>
        <span className={styles.confiabilidad}>{confiabilidad}%</span>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Turnos</span>
          <span className={styles.metricValue}>{cadete.turnos}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>❌ Faltas</span>
          <span
            className={`${styles.metricValue} ${cadete.faltas > 0 ? styles.metricBad : ""}`}
          >
            {cadete.faltas}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>⏰ Llegadas</span>
          <span
            className={`${styles.metricValue} ${cadete.llegadas_tarde > 2 ? styles.metricWarning : ""}`}
          >
            {cadete.llegadas_tarde}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>📉 Pedidos</span>
          <span className={styles.metricValue}>{cadete.pedidos_tarde}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>⚡ Activaciones</span>
          <span className={styles.metricValue}>
            {cadete.activaciones_tarde}
          </span>
        </div>
      </div>

      <div className={styles.efectividadBar}>
        <div
          className={`${styles.efectividadFill} ${
            cadete.efectividad >= 95
              ? styles.fillAlta
              : cadete.efectividad >= 85
                ? styles.fillMedia
                : styles.fillBaja
          }`}
          style={{ width: `${cadete.efectividad}%` }}
        />
        <span className={styles.efectividadText}>{cadete.efectividad}%</span>
      </div>

      <div className={styles.tendencia}>
        <span className={styles.tendenciaLabel}>📈 Tendencia:</span>
        <span
          className={`${styles.tendenciaValue} ${
            tendencia.includes("⬆")
              ? styles.tendenciaUp
              : tendencia.includes("⬇")
                ? styles.tendenciaDown
                : styles.tendenciaStable
          }`}
        >
          {tendencia}
        </span>
      </div>

      <div
        className={`${styles.recomendacion} ${
          recomendacion.includes("Excelente")
            ? styles.recomendacionBuena
            : recomendacion.includes("Rendimiento normal") ||
                recomendacion.includes("Revisar")
              ? styles.recomendacionNeutral
              : styles.recomendacionMala
        }`}
      >
        {recomendacion}
      </div>
    </div>
  );
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}
