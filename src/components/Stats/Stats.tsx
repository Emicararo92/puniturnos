/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useZona } from "../../Context/zonaContext";
import styles from "./EstadisticasPage.module.css";

import ComparativeEffectivenessChart from "../../components/Stats/proStats/ComparativeEffectivenessChart";
import ReliabilityRadarChart from "../../components/Stats/proStats/ReliabilityScoreChart";
import TrendPerformanceChart from "../../components/Stats/proStats/WeeklyTrendChart";

export default function EstadisticasPage() {
  const supabase = createClient();
  const { zonaSeleccionada } = useZona();

  const [data, setData] = useState<any[]>([]);
  const [prevData, setPrevData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [semanaRef, setSemanaRef] = useState(getMonday(new Date()));
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("efectividad");

  const [cadeteSeleccionado, setCadeteSeleccionado] = useState<any>(null);

  useEffect(() => {
    if (!zonaSeleccionada) return;
    load();
  }, [semanaRef, zonaSeleccionada]);

  async function load() {
    setLoading(true);

    const { data } = await supabase.rpc("metricas_cadete_zona", {
      semana_ref: semanaRef,
      zona: zonaSeleccionada,
    });

    const prevMonday = getMonday(
      new Date(new Date(semanaRef).getTime() - 7 * 86400000),
    );

    const { data: prev } = await supabase.rpc("metricas_cadete_zona", {
      semana_ref: prevMonday,
      zona: zonaSeleccionada,
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

  const filtered = (data || [])
    .filter((c) => c && c.nombre)
    .map((c) => ({
      ...c,
      faltas: c.faltas ?? 0,
      llegadas_tarde: c.llegadas_tarde ?? 0,
      tardanza_pedido: c.tardanza_pedido ?? 0,
      activacion_tardia: c.activacion_tardia ?? 0,
      total_turnos: c.total_turnos ?? 0,
      efectividad: Number(c.efectividad ?? 0),
    }))
    .filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (filtro === "llegadas") return b.llegadas_tarde - a.llegadas_tarde;
      if (filtro === "faltas") return b.faltas - a.faltas;
      if (filtro === "turnos") return b.total_turnos - a.total_turnos;
      return b.efectividad - a.efectividad;
    });

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

      {/* CONTROLES */}
      <div className={styles.controls}>
        <div className={styles.weekNav}>
          <button onClick={() => changeWeek(-1)}>←</button>

          <div>
            <span>Semana</span>
            <strong>{formatoSemana}</strong>
          </div>

          <button onClick={() => changeWeek(1)}>→</button>
          <button onClick={() => setSemanaRef(getMonday(new Date()))}>
            Hoy
          </button>
        </div>

        <div>
          <input
            placeholder="Buscar cadete..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="efectividad">Mayor efectividad</option>
            <option value="llegadas">Más llegadas tarde</option>
            <option value="faltas">Más faltas</option>
            <option value="turnos">Más turnos</option>
          </select>
        </div>
      </div>

      {/* SELECTOR CADENTE */}
      {!loading && filtered.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <select
            value={cadeteSeleccionado?.cadete_id || ""}
            onChange={(e) => {
              const selected = filtered.find(
                (c) => c.cadete_id === e.target.value,
              );
              setCadeteSeleccionado(selected || null);
            }}
          >
            <option value="">Seleccionar cadete…</option>
            {filtered.map((c) => (
              <option key={c.cadete_id} value={c.cadete_id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* CHARTS SOLO DESKTOP */}
      {!loading && filtered.length > 0 && (
        <div className="desktopCharts">
          <ComparativeEffectivenessChart data={filtered} />
          <ReliabilityRadarChart cadete={cadeteSeleccionado} />
          <TrendPerformanceChart data={filtered} prevData={prevData} />
        </div>
      )}

      {/* CARD GRANDE SELECCIONADA */}
      {cadeteSeleccionado && (
        <CadeteCardExpanded
          cadete={cadeteSeleccionado}
          prev={prevData.find(
            (p) => p.cadete_id === cadeteSeleccionado.cadete_id,
          )}
        />
      )}
    </div>
  );
}

function CadeteCardExpanded({ cadete, prev }: any) {
  const confiabilidad =
    cadete.total_turnos > 0
      ? Math.round(
          ((cadete.total_turnos - cadete.faltas - cadete.llegadas_tarde * 0.5) /
            cadete.total_turnos) *
            100,
        )
      : 0;

  const tendencia = prev
    ? cadete.efectividad > prev.efectividad
      ? "⬆ Mejora"
      : cadete.efectividad < prev.efectividad
        ? "⬇ Empeoró"
        : "➡ Estable"
    : "—";

  return (
    <div style={{ padding: 24, borderRadius: 16, background: "#fff" }}>
      <h2>{cadete.nombre}</h2>

      <div style={{ margin: "12px 0" }}>
        <strong>Confiabilidad {confiabilidad}%</strong>
        <div
          style={{
            height: 10,
            background: "#eee",
            borderRadius: 8,
            overflow: "hidden",
            marginTop: 6,
          }}
        >
          <div
            style={{
              width: `${confiabilidad}%`,
              height: "100%",
              background:
                confiabilidad > 90
                  ? "#22c55e"
                  : confiabilidad > 75
                    ? "#facc15"
                    : "#ef4444",
            }}
          />
        </div>
      </div>

      <p>Efectividad: {cadete.efectividad}%</p>
      <p>Turnos: {cadete.total_turnos}</p>
      <p>Faltas: {cadete.faltas}</p>
      <p>Llegadas tarde: {cadete.llegadas_tarde}</p>
      <p>Tardanza pedidos: {cadete.tardanza_pedido}</p>
      <p>Activación tardía: {cadete.activacion_tardia}</p>
      <p>Tendencia: {tendencia}</p>
    </div>
  );
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}
