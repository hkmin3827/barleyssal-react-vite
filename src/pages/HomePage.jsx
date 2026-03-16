import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { STOCKS } from "../constants/stocks";
import { useMarketStore } from "../store/marketStore";
import { useAuthStore } from "../store/authStore";
import { getTopProfitableTrades, getPopularStocks } from "../api/springApi";
import { fmtPrice, fmtPct, prdySign, signStr } from "../utils/format";
import styles from "./HomePage.module.css";

const PIE_COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#a855f7",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#84cc16",
  "#f97316",
];

function getStockName(code) {
  return STOCKS.find((s) => s.code === code)?.name ?? code;
}

function TrendIcon({ up }) {
  return up ? (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ) : (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const prices = useMarketStore((s) => s.prices);
  const ranking = useMarketStore((s) => s.ranking);
  const [topTrades, setTopTrades] = useState([]);
  const [popularData, setPopularData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTopProfitableTrades(), getPopularStocks()])
      .then(([top, pop]) => {
        setTopTrades(Array.isArray(top) ? top.slice(0, 10) : []);
        setPopularData(pop && typeof pop === "object" ? pop : {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 파이차트 데이터
  const total = Object.values(popularData).reduce((a, b) => a + Number(b), 0);
  const pieData = Object.entries(popularData)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 6)
    .map(([code, cnt], i) => ({
      name: getStockName(code),
      value: Number(cnt),
      pct: total ? ((Number(cnt) / total) * 100).toFixed(1) : "0",
      fill: PIE_COLORS[i],
    }));

  // 실시간 주요 통계
  const topByVolume = ranking[0];
  const topByChange = [...ranking].sort(
    (a, b) => (b.changeRate || 0) - (a.changeRate || 0),
  )[0];

  return (
    <div className={styles.page}>
      {/* 인사 헤더 */}
      {isLoggedIn && (
        <div className={styles.greetBanner}>
          <span>
            👋 안녕하세요, <strong>{user?.userName}</strong>님
          </span>
        </div>
      )}

      <div className={styles.pageInner}>
        {/* 상단 2열 그리드 */}
        <div className={styles.topGrid}>
          {/* 파이차트 카드 */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>인기종목 매매비중</h2>
            {loading ? (
              <div className="spinner" />
            ) : total === 0 ? (
              <div className={styles.empty}>데이터가 없습니다.</div>
            ) : (
              <>
                <div className={styles.pieWrap}>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        labelLine={false}
                        label={({ name, pct }) => `${name} ${pct}%`}
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
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.legendList}>
                  {pieData.map((d) => (
                    <div key={d.name} className={styles.legendItem}>
                      <span
                        className={styles.legendDot}
                        style={{ background: d.fill }}
                      />
                      <span className={styles.legendName}>
                        {d.name}: {d.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 수익률 TOP 10 */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>수익률 TOP 10</h2>
            {loading ? (
              <div className="spinner" />
            ) : topTrades.length === 0 ? (
              <div className={styles.empty}>데이터가 없습니다.</div>
            ) : (
              <div className={styles.top10List}>
                {topTrades.map((t, i) => (
                  <div
                    key={t.id ?? i}
                    className={styles.top10Item}
                    onClick={() => navigate(`/stock/${t.stockCode}`)}
                  >
                    <div
                      className={styles.top10Rank}
                      style={
                        i < 3 ? { background: "#dbeafe", color: "#1d4ed8" } : {}
                      }
                    >
                      {i + 1}
                    </div>
                    <div className={styles.top10Info}>
                      <div className={styles.top10Name}>
                        {t.userName ?? "익명"}
                      </div>
                      <div className={styles.top10Code}>{t.stockCode}</div>
                    </div>
                    <div className={styles.top10Right}>
                      <div className={styles.top10Price}>
                        {fmtPrice(t.executedPrice)}원
                      </div>
                      <div
                        className={`${styles.top10Rate} ${(t.finalProfitRate ?? 0) >= 0 ? "up" : "down"}`}
                      >
                        <TrendIcon up={(t.finalProfitRate ?? 0) >= 0} />
                        {(t.finalProfitRate ?? 0) >= 0 ? "+" : ""}
                        {Number(t.finalProfitRate ?? 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 퀵스탯 3열 */}
        <div className={styles.statsGrid}>
          <div
            className={styles.statCard}
            style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}
          >
            <div className={styles.statLabel}>거래량 1위</div>
            <div className={styles.statValue}>
              {topByVolume?.stockName ?? "-"}
            </div>
            <div className={styles.statSub}>
              {topByVolume
                ? `${(topByVolume.volume || 0).toLocaleString()} 주`
                : ""}
            </div>
          </div>
          <div
            className={styles.statCard}
            style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}
          >
            <div className={styles.statLabel}>최고 상승률</div>
            <div className={styles.statValue}>
              {topByChange?.stockName ?? "-"}
            </div>
            <div className={styles.statSub}>
              {topByChange?.changeRate != null
                ? `+${topByChange.changeRate.toFixed(2)}%`
                : ""}
            </div>
          </div>
          <div
            className={styles.statCard}
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
          >
            <div className={styles.statLabel}>총 종목 수</div>
            <div className={styles.statValue}>
              {ranking.length > 0
                ? `${ranking.length}개`
                : `${STOCKS.length}개`}
            </div>
            <div className={styles.statSub}>거래 가능</div>
          </div>
        </div>
      </div>
    </div>
  );
}
