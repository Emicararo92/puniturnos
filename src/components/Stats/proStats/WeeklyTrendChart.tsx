/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import styles from "./WeeklyTrendChart.module.css";

export default function WeeklyTrendChart({ data = [] }: any) {
  if (!data.length) return null;

  const formattedData = data.map((c: any) => ({
    semana: c.nombre || "Sin nombre",
    efectividad: Number(c.efectividad ?? 0),
  }));

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>📈 Tendencia Semanal</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="efectividad"
              stroke="#ec4899"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
