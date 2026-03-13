import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getStockName } from "../../constants/stocks";
import styles from "./PopularStocksChart.module.css";

const COLORS = [
  "#3d8bff",
  "#00d17a",
  "#ff3d5a",
  "#f5a623",
  "#a855f7",
  "#06b6d4",
  "#f43f5e",
  "#84cc16",
  "#fb923c",
  "#e879f9",
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className={styles.tooltip}>
      <div className={styles.ttName}>{d.name}</div>
      <div className={styles.ttVal}>
        {d.value.toLocaleString()}건 ({d.payload.pct}%)
      </div>
    </div>
  );
};

export default function PopularStocksChart({ data = {} }) {
  // data: { stockCode: count }
  const total = Object.values(data).reduce((a, b) => a + Number(b), 0);
  if (!total) return <div className={styles.empty}>데이터가 없습니다.</div>;

  const sorted = Object.entries(data)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 10);

  const chartData = sorted.map(([code, count]) => ({
    name: getStockName(code),
    code,
    value: Number(count),
    pct: ((Number(count) / total) * 100).toFixed(1),
  }));

  return (
    <div className={styles.wrap}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, i) => (
              <Cell key={entry.code} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className={styles.legendLabel}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className={styles.list}>
        {chartData.map((d, i) => (
          <div key={d.code} className={styles.item}>
            <span
              className={styles.rank}
              style={{ color: COLORS[i % COLORS.length] }}
            >
              {i + 1}
            </span>
            <span className={styles.itemName}>{d.name}</span>
            <span className={styles.itemCode}>{d.code}</span>
            <div className={styles.barWrap}>
              <div
                className={styles.bar}
                style={{
                  width: `${d.pct}%`,
                  background: COLORS[i % COLORS.length],
                }}
              />
            </div>
            <span className={styles.pct}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
