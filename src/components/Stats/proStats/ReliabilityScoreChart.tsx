/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  PolarRadiusAxis,
} from "recharts";
import styles from "./ReliabilityScoreChart.module.css";

export default function ReliabilityScoreChart({ cadete }: any) {
  if (!cadete) return null;

  const faltas = Number(cadete.faltas ?? 0);
  const llegadas = Number(cadete.llegadas_tarde ?? 0);
  const pedidos = Number(cadete.tardanza_pedido ?? 0);
  const activaciones = Number(cadete.activacion_tardia ?? 0);

  const data = [
    { metric: "Faltas", value: Math.max(0, 100 - faltas * 20) },
    { metric: "Llegadas", value: Math.max(0, 100 - llegadas * 10) },
    { metric: "Pedidos", value: Math.max(0, 100 - pedidos * 5) },
    { metric: "Activación", value: Math.max(0, 100 - activaciones * 10) },
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🔍 Score de Confiabilidad</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar
              dataKey="value"
              fill="#f472b6"
              stroke="#ec4899"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
