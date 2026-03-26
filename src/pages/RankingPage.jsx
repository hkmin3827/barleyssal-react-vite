import { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  getTopProfitableTrades,
  getPopularStocks,
  getHourlyTradeVolume,
} from "../api/springApi";
import { STOCKS } from "../constants/stocks";
import styles from "./RankingPage.module.css";

const COLORS = [
  "#4f46e5",
  "#2563eb",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#84cc16",
  "#f97316",
];

function getStockName(code) {
  return STOCKS.find((s) => s.code === code)?.name ?? code;
}

function parseHourly(raw) {
  try {
    const buckets = raw?.hourlyData;
    if (!Array.isArray(buckets)) return [];
    const map = new Map();
    for (const b of buckets) {
      const hour = (b.hour ?? "").slice(11, 16);
      const prev = map.get(hour) ?? { 매수: 0, 매도: 0 };
      map.set(hour, {
        매수: prev.매수 + (b.bySide?.BUY ?? 0),
        매도: prev.매도 + (b.bySide?.SELL ?? 0),
      });
    }
    return Array.from(map.entries()).map(([hour, v]) => ({ hour, ...v }));
  } catch {
    return [];
  }
}

const TABS = [
  { key: "popular", label: "인기 종목" },
  { key: "profit", label: "수익률 TOP" },
  { key: "hourly", label: "시간대별 거래" },
];

export default function RankingPage() {
  const [tab, setTab] = useState("popular");
  const [popularData, setPopularData] = useState({});
  const [topTrades, setTopTrades] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Promise.all([
    //   getTopProfitableTrades(),
    //   getPopularStocks(),
    //   getHourlyTradeVolume(),
    // ])
    //   .then(([top, pop, hourly]) => {
    //     setTopTrades(Array.isArray(top) ? top : []);
    //     setPopularData(pop && typeof pop === "object" ? pop : {});
    //     setHourlyData(parseHourly(hourly));
    //   })
    //   .catch(() => {})
    //   .finally(() => setLoading(false));
    setTopTrades([]);
    setPopularData({});
    setHourlyData([]);
  }, []);

  const total = Object.values(popularData).reduce((a, b) => a + Number(b), 0);
  const pieData = useMemo(
    () =>
      Object.entries(popularData)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 10)
        .map(([code, cnt], i) => ({
          code,
          name: getStockName(code),
          value: Number(cnt),
          pct: total ? ((Number(cnt) / total) * 100).toFixed(1) : "0",
          fill: COLORS[i],
        })),
    [popularData, total],
  );

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>랭킹</h1>
          <span className={styles.subLabel}>
            Elasticsearch 기반 · 최근 14일
          </span>
        </div>

        <div className={styles.tabBar}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : (
          <>
            {tab === "popular" && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>인기종목 매매비중</span>
                  <span className={styles.cardSub}>
                    14일간 가장 많이 거래된 종목
                  </span>
                </div>
                {total === 0 ? (
                  <div className={styles.empty}>데이터가 없습니다.</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          labelLine={false}
                          label={({ name, pct }) =>
                            parseFloat(pct) > 4 ? `${name} ${pct}%` : ""
                          }
                          dataKey="value"
                        >
                          {pieData.map((e, i) => (
                            <Cell key={i} fill={e.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, n, p) => [
                            `${v.toLocaleString()}건 (${p.payload.pct}%)`,
                            n,
                          ]}
                        />
                        <Legend iconType="circle" iconSize={9} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className={styles.listGrid}>
                      {pieData.map((d, i) => (
                        <div key={d.code} className={styles.listItem}>
                          <span
                            className={styles.listRank}
                            style={{ color: d.fill }}
                          >
                            {i + 1}
                          </span>
                          <div className={styles.listInfo}>
                            <span className={styles.listName}>{d.name}</span>
                            <span className={styles.listCode}>{d.code}</span>
                          </div>
                          <div className={styles.listBarWrap}>
                            <div
                              className={styles.listBar}
                              style={{ width: `${d.pct}%`, background: d.fill }}
                            />
                          </div>
                          <span className={styles.listPct}>{d.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === "profit" && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>매도 수익률 TOP 10</span>
                  <span className={styles.cardSub}>최근 14일 매도 기준</span>
                </div>
                {topTrades.length === 0 ? (
                  <div className={styles.empty}>데이터가 없습니다.</div>
                ) : (
                  <div className={styles.profitList}>
                    {topTrades.map((t, i) => (
                      <div key={t.id ?? i} className={styles.profitRow}>
                        <div
                          className={styles.profitRank}
                          style={
                            i < 3
                              ? { background: "#dbeafe", color: "#1d4ed8" }
                              : {}
                          }
                        >
                          {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                        </div>
                        <div className={styles.profitInfo}>
                          <div className={styles.profitUser}>
                            {t.userName ?? "익명"}
                          </div>
                          <div className={styles.profitCode}>
                            {t.stockCode} ·{" "}
                            {t.orderSide === "SELL" ? "매도" : "매수"}
                          </div>
                        </div>
                        <div className={styles.profitRight}>
                          <div
                            className={`${styles.profitRate} ${(t.finalProfitRate ?? 0) >= 0 ? "up" : "down"}`}
                          >
                            {(t.finalProfitRate ?? 0) >= 0 ? "+" : ""}
                            {Number(t.finalProfitRate ?? 0).toFixed(2)}%
                          </div>
                          <div className={styles.profitDetail}>
                            {(t.executedPrice ?? 0).toLocaleString()}원 ·{" "}
                            {(t.quantity ?? 0).toLocaleString()}주
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "hourly" && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>
                    시간대별 매수·매도 건수
                  </span>
                  <span className={styles.cardSub}>최근 14일 집계</span>
                </div>
                {hourlyData.length === 0 ? (
                  <div className={styles.empty}>데이터가 없습니다.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={hourlyData}
                      margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          fontSize: 13,
                        }}
                      />
                      <Legend />
                      <Bar dataKey="매수" stackId="a" fill="#dc2626" />
                      <Bar
                        dataKey="매도"
                        stackId="a"
                        fill="#2563eb"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
