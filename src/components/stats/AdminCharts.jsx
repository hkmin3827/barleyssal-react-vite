import { useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import styles from "./AdminCharts.module.css";

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.ttLabel}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }} className={styles.ttRow}>
          {p.name}: <span className="num">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

/** Hourly BUY/SELL volume bar chart */
export function HourlyVolumeChart({ data = [] }) {
  if (!data.length) return <div className={styles.empty}>데이터 없음</div>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1d27" />
        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#7a8099" }} />
        <YAxis tick={{ fontSize: 10, fill: "#7a8099" }} />
        <Tooltip content={<TT />} />
        <Legend
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "#7a8099" }}
        />
        <Bar
          dataKey="BUY"
          fill="#ff3d5a"
          radius={[2, 2, 0, 0]}
          maxBarSize={20}
        />
        <Bar
          dataKey="SELL"
          fill="#3d8bff"
          radius={[2, 2, 0, 0]}
          maxBarSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Daily efficiency line chart */
export function DailyEfficiencyChart({ data = [] }) {
  if (!data.length) return <div className={styles.empty}>데이터 없음</div>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1d27" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7a8099" }} />
        <YAxis tick={{ fontSize: 10, fill: "#7a8099" }} />
        <Tooltip content={<TT />} />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#00d17a"
          strokeWidth={2}
          dot={false}
          name="체결건수"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
