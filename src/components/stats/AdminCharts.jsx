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
          <Bar
            dataKey="BUY"
            name="매수"
            stackId="a"
            fill="#dc2626"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="SELL"
            name="매도"
            stackId="a"
            fill="#2563eb"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EfficiencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const executed =
    payload.find((p) => p.dataKey === "executedCount")?.value ?? 0;
  const remain = payload.find((p) => p.dataKey === "remainCount")?.value ?? 0;
  const total = executed + remain;
  const rate = total > 0 ? ((executed / total) * 100).toFixed(1) : "0.0";
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 13,
      }}
    >
      <p style={{ margin: 0, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ margin: 0, color: "#4f46e5" }}>체결: {executed}</p>
      <p style={{ margin: 0, color: "#9ca3af" }}>총 주문: {total}</p>
      <p style={{ margin: 0, color: "#f59e0b", fontWeight: 600 }}>
        체결률: {rate}%
      </p>
    </div>
  );
}

export function DailyEfficiencyChart({ data = [] }) {
  if (!data.length)
    return <div className={styles.empty}>데이터가 없습니다.</div>;

  const chartData = data.map((d) => ({
    ...d,
    remainCount: Math.max(0, (d.totalCount ?? 0) - (d.executedCount ?? 0)),
  }));

  return (
    <div className={styles.wrap}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <Tooltip content={<EfficiencyTooltip />} />
          <Legend />
          <Bar dataKey="executedCount" name="체결" stackId="a" fill="#4f46e5" />
          <Bar
            dataKey="remainCount"
            name="미체결"
            stackId="a"
            fill="#55ce92"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
