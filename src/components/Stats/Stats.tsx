/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useZona } from "../../Context/zonaContext";
import styles from "./EstadisticasPage.module.css";

// Componentes de gráficos
import ComparativeEffectivenessChart from "../../components/Stats/proStats/ComparativeEffectivenessChart";
import ReliabilityRadarChart from "../../components/Stats/proStats/ReliabilityScoreChart";
import TrendPerformanceChart from "../../components/Stats/proStats/WeeklyTrendChart";

export default function EstadisticasPage() {
  // =========================================================================
  // HOOKS Y ESTADO
  // =========================================================================
  const supabase = createClient();
  const { zonaSeleccionada } = useZona();

  const [data, setData] = useState<any[]>([]);
  const [prevData, setPrevData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [semanaRef, setSemanaRef] = useState(getMonday(new Date()));
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("efectividad");
  const [cadeteSeleccionado, setCadeteSeleccionado] = useState<any>(null);

  // =========================================================================
  // EFECTOS
  // =========================================================================
  useEffect(() => {
    if (!zonaSeleccionada) return;
    loadData();
  }, [semanaRef, zonaSeleccionada]);

  // =========================================================================
  // FUNCIONES
  // =========================================================================
  async function loadData() {
    setLoading(true);

    // Datos de la semana actual
    const { data: currentData } = await supabase.rpc("metricas_cadete_zona", {
      semana_ref: semanaRef,
      zona: zonaSeleccionada,
    });

    // Datos de la semana anterior
    const prevMonday = getMonday(
      new Date(new Date(semanaRef).getTime() - 7 * 86400000),
    );
    const { data: previousData } = await supabase.rpc("metricas_cadete_zona", {
      semana_ref: prevMonday,
      zona: zonaSeleccionada,
    });

    setData(currentData || []);
    setPrevData(previousData || []);
    setLoading(false);
  }

  function changeWeek(offset: number) {
    const [y, m, d] = semanaRef.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset * 7);
    setSemanaRef(getMonday(date));
    setCadeteSeleccionado(null); // Limpiar selección al cambiar semana
  }

  // =========================================================================
  // DATA PROCESADA
  // =========================================================================
  const filteredData = (data || [])
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

  // Formato de fecha para la navegación
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

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className={styles.pageContainer}>
      {/* HEADER */}
      <Header />

      {/* CONTROLES */}
      <Controls
        semanaRef={semanaRef}
        formatoSemana={formatoSemana}
        onPrevWeek={() => changeWeek(-1)}
        onNextWeek={() => changeWeek(1)}
        onToday={() => setSemanaRef(getMonday(new Date()))}
        search={search}
        onSearchChange={setSearch}
        filtro={filtro}
        onFiltroChange={setFiltro}
      />

      {/* SELECTOR DE CADETE */}
      {!loading && filteredData.length > 0 && (
        <CadeteSelector
          cadetes={filteredData}
          cadeteSeleccionado={cadeteSeleccionado}
          onSelect={setCadeteSeleccionado}
        />
      )}

      {/* LOADING */}
      {loading && <LoadingState />}

      {/* GRÁFICOS (SOLO DESKTOP) */}
      {!loading && filteredData.length > 0 && (
        <div className="desktopCharts">
          <ComparativeEffectivenessChart data={filteredData} />
          <ReliabilityRadarChart cadete={cadeteSeleccionado} />
          <TrendPerformanceChart data={filteredData} prevData={prevData} />
        </div>
      )}

      {/* CARD EXPANDIDA DEL CADETE SELECCIONADO */}
      {cadeteSeleccionado && (
        <ExpandedCadeteCard
          cadete={cadeteSeleccionado}
          prevData={prevData.find(
            (p) => p.cadete_id === cadeteSeleccionado.cadete_id,
          )}
        />
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTES
// =============================================================================

function Header() {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>📊 Dashboard Cadetes</h2>
    </div>
  );
}

// -----------------------------------------------------------------------------
interface ControlsProps {
  semanaRef: string;
  formatoSemana: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filtro: string;
  onFiltroChange: (value: string) => void;
}

function Controls({
  semanaRef,
  formatoSemana,
  onPrevWeek,
  onNextWeek,
  onToday,
  search,
  onSearchChange,
  filtro,
  onFiltroChange,
}: ControlsProps) {
  return (
    <div className={styles.controls}>
      {/* Navegación de semanas */}
      <div className={styles.weekNav}>
        <button onClick={onPrevWeek}>←</button>

        <div>
          <span>Semana</span>
          <strong>{formatoSemana}</strong>
        </div>

        <button onClick={onNextWeek}>→</button>
        <button onClick={onToday}>Hoy</button>
      </div>

      {/* Filtros y búsqueda */}
      <div>
        <input
          placeholder="Buscar cadete..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <select value={filtro} onChange={(e) => onFiltroChange(e.target.value)}>
          <option value="efectividad">Mayor efectividad</option>
          <option value="llegadas">Más llegadas tarde</option>
          <option value="faltas">Más faltas</option>
          <option value="turnos">Más turnos</option>
        </select>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
interface CadeteSelectorProps {
  cadetes: any[];
  cadeteSeleccionado: any;
  onSelect: (cadete: any) => void;
}

function CadeteSelector({
  cadetes,
  cadeteSeleccionado,
  onSelect,
}: CadeteSelectorProps) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <select
        className={styles.selectCadete}
        value={cadeteSeleccionado?.cadete_id || ""}
        onChange={(e) => {
          const selected = cadetes.find((c) => c.cadete_id === e.target.value);
          onSelect(selected || null);
        }}
      >
        <option value="">📋 Seleccionar cadete para ver detalles...</option>
        {cadetes.map((c) => (
          <option key={c.cadete_id} value={c.cadete_id}>
            {c.nombre} - {c.efectividad}% efectividad
          </option>
        ))}
      </select>
    </div>
  );
}

// -----------------------------------------------------------------------------
function LoadingState() {
  return (
    <div className={styles.loadingState}>
      <div className={styles.loadingSpinner}></div>
      <p>Cargando estadísticas…</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
interface ExpandedCadeteCardProps {
  cadete: any;
  prevData: any;
}

function ExpandedCadeteCard({ cadete, prevData }: ExpandedCadeteCardProps) {
  // Cálculo de confiabilidad
  const confiabilidad =
    cadete.total_turnos > 0
      ? Math.round(
          ((cadete.total_turnos - cadete.faltas - cadete.llegadas_tarde * 0.5) /
            cadete.total_turnos) *
            100,
        )
      : 0;

  // Cálculo de tendencia
  const tendencia = prevData
    ? cadete.efectividad > prevData.efectividad
      ? "⬆ Mejora"
      : cadete.efectividad < prevData.efectividad
        ? "⬇ Empeoró"
        : "➡ Estable"
    : "—";

  // Clase para la barra de confiabilidad
  const barClass =
    confiabilidad > 90 ? "excellent" : confiabilidad > 75 ? "good" : "bad";

  return (
    <div className={styles.expandedCard}>
      {/* Nombre del cadete */}
      <h2>{cadete.nombre}</h2>

      {/* Barra de confiabilidad */}
      <div className={styles.reliabilityContainer}>
        <strong className={styles.reliabilityLabel}>
          Confiabilidad {confiabilidad}%
        </strong>
        <div className={styles.reliabilityBar}>
          <div
            className={`${styles.reliabilityFill} ${styles[barClass]}`}
            style={{ width: `${confiabilidad}%` }}
          />
        </div>
      </div>

      {/* Grid de métricas principales */}
      <div className={styles.metricsGrid}>
        <MetricCard label="Efectividad" value={`${cadete.efectividad}%`} />
        <MetricCard label="Turnos" value={cadete.total_turnos} />
        <MetricCard label="Faltas" value={cadete.faltas} type="faltas" />
        <MetricCard
          label="Llegadas"
          value={cadete.llegadas_tarde}
          type="llegadas"
        />
        <MetricCard label="Pedidos" value={cadete.tardanza_pedido} />
        <MetricCard label="Activación" value={cadete.activacion_tardia} />
      </div>

      {/* Lista detallada */}
      <div className={styles.detailsList}>
        <DetailItem label="📊 Efectividad" value={`${cadete.efectividad}%`} />
        <DetailItem label="📅 Turnos" value={cadete.total_turnos} />
        <DetailItem label="❌ Faltas" value={cadete.faltas} />
        <DetailItem label="⏰ Llegadas tarde" value={cadete.llegadas_tarde} />
        <DetailItem label="📉 Pedidos tardíos" value={cadete.tardanza_pedido} />
        <DetailItem
          label="⚡ Activación tardía"
          value={cadete.activacion_tardia}
        />
      </div>

      {/* Tendencia */}
      <div className={styles.tendenciaContainer}>
        <span className={styles.tendenciaLabel}>Tendencia</span>
        <span
          className={`${styles.tendenciaValue} ${
            tendencia.includes("⬆")
              ? styles.mejora
              : tendencia.includes("⬇")
                ? styles.empeora
                : styles.estable
          }`}
        >
          {tendencia}
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
interface MetricCardProps {
  label: string;
  value: string | number;
  type?: string;
}

function MetricCard({ label, value, type }: MetricCardProps) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <strong className={`${styles.metricValue} ${type ? styles[type] : ""}`}>
        {value}
      </strong>
    </div>
  );
}

// -----------------------------------------------------------------------------
interface DetailItemProps {
  label: string;
  value: string | number;
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}

// =============================================================================
// UTILS
// =============================================================================
function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}
