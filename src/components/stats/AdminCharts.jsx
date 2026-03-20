import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./AdminCharts.module.css";

export function HourlyVolumeChart({ data = [] }) {
  if (!data.length)
    return <div className={styles.empty}>데이터가 없습니다.</div>;
  return (
    <div className={styles.wrap}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              fontSize: 13,
            }}
          />
          <Legend />
          <Bar dataKey="BUY" name="매수" fill="#dc2626" radius={[3, 3, 0, 0]} />
          <Bar
            dataKey="SELL"
            name="매도"
            fill="#2563eb"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyEfficiencyChart({ data = [] }) {
  if (!data.length)
    return <div className={styles.empty}>데이터가 없습니다.</div>;
  return (
    <div className={styles.wrap}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              fontSize: 13,
            }}
          />
          <Bar
            dataKey="count"
            name="체결"
            fill="#4f46e5"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
