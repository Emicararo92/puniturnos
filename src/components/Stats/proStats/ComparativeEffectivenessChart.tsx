/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import styles from "./ComparativeEffectivenessChart.module.css";

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================
export default function ComparativeEffectivenessChart({ data = [] }: any) {
  if (!data.length) return null;

  // Procesar datos para el gráfico
  const chartData = data.map((c: any) => ({
    nombre: c.nombre,
    efectividad: Number(c.efectividad ?? 0),
    id: c.cadete_id || c.id,
  }));

  // Colores basados en el nivel de efectividad
  const getBarColor = (efectividad: number) => {
    if (efectividad >= 95) return "#22c55e";
    if (efectividad >= 85) return "#facc15";
    return "#ef4444";
  };

  // Calcular altura dinámica basada en cantidad de datos
  const chartHeight = Math.max(400, chartData.length * 45);

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.titleIcon}>📊</span>
          Efectividad Comparativa
        </h3>
        <div className={styles.statsBadge}>{chartData.length} cadetes</div>
      </div>

      {/* GRÁFICO */}
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 20, right: 30, bottom: 20, left: 200 }}
          >
            {/* Grid */}
            <CartesianGrid
              strokeDasharray="4 4"
              horizontal={false}
              stroke="#22395a"
              opacity={0.1}
            />

            {/* Ejes */}
            <XAxis
              type="number"
              domain={[0, 100]}
              tickLine={false}
              axisLine={{ stroke: "#22395a", strokeWidth: 1.5 }}
              tick={{ fill: "#22395a", fontSize: 12, fontWeight: 500 }}
            />

            <YAxis
              type="category"
              dataKey="nombre"
              width={190}
              tickLine={false}
              axisLine={{ stroke: "#22395a", strokeWidth: 1.5 }}
              tick={{
                fill: "#22395a",
                fontSize: 14,
                fontWeight: 600,
                width: 180,
              }}
            />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} />

            {/* Barras */}
            <Bar dataKey="efectividad" radius={[0, 10, 10, 0]} maxBarSize={35}>
              {chartData.map((entry: any) => (
                <Cell
                  key={entry.id}
                  fill={getBarColor(entry.efectividad)}
                  className={styles.barCell}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* LEYENDA */}
      <div className={styles.legendContainer}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.excellent}`} />
          <span>Excelente (95-100%)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.good}`} />
          <span>Bueno (85-94%)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.bad}`} />
          <span>Regular (0-84%)</span>
        </div>
      </div>

      {/* FOOTER CON ESTADÍSTICAS */}
      <div className={styles.footer}>
        <div className={styles.footerStat}>
          <span className={styles.footerLabel}>Promedio</span>
          <span className={styles.footerValue}>
            {Math.round(
              chartData.reduce(
                (acc: any, c: { efectividad: any }) => acc + c.efectividad,
                0,
              ) / chartData.length,
            )}
            %
          </span>
        </div>
        <div className={styles.footerStat}>
          <span className={styles.footerLabel}>Mejor</span>
          <span className={styles.footerValue}>
            {Math.max(
              ...chartData.map((c: { efectividad: any }) => c.efectividad),
            )}
            %
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TOOLTIP PERSONALIZADO
// =============================================================================
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const colorClass =
    data.efectividad >= 95
      ? styles.tooltipExcellent
      : data.efectividad >= 85
        ? styles.tooltipGood
        : styles.tooltipBad;

  return (
    <div className={`${styles.tooltip} ${colorClass}`}>
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipName}>{data.nombre}</span>
      </div>
      <div className={styles.tooltipBody}>
        <span className={styles.tooltipLabel}>Efectividad</span>
        <span className={styles.tooltipValue}>{data.efectividad}%</span>
      </div>
      <div className={styles.tooltipFooter}>
        {data.efectividad >= 95 && "🔥 Excelente rendimiento"}
        {data.efectividad >= 85 && data.efectividad < 95 && "👍 Buen trabajo"}
        {data.efectividad < 85 && "📉 Necesita mejorar"}
      </div>
    </div>
  );
};
