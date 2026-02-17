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

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <div className={styles.tooltip}>
      <p>{data.nombre}</p>
      <p>
        Efectividad: <strong>{data.efectividad}%</strong>
      </p>
    </div>
  );
};

export default function ComparativeEffectivenessChart({ data = [] }: any) {
  if (!data.length) return null;

  const chartData = data.map((c: any) => ({
    nombre: c.nombre, // 👈 nombre completo SIEMPRE
    efectividad: Number(c.efectividad ?? 0),
  }));

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>📊 Efectividad Comparativa</h3>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 10, right: 20, bottom: 10, left: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />

            <XAxis type="number" domain={[0, 100]} />

            <YAxis type="category" dataKey="nombre" width={100} />

            <Tooltip content={<CustomTooltip />} />

            <Bar dataKey="efectividad" radius={[0, 6, 6, 0]}>
              {chartData.map((entry: any, i: number) => (
                <Cell
                  key={i}
                  fill={
                    entry.efectividad >= 95
                      ? "#22c55e"
                      : entry.efectividad >= 85
                        ? "#facc15"
                        : "#ef4444"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
