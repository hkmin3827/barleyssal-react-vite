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
import { useWebSocket } from "../hooks/useWebSocket";
import { fmtPrice } from "../utils/format";
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

  // [변경] topChangeRate / topBuyVolume: Go WS home_update 이벤트로 수신
  // BroadcastToAll 5초 주기 → ZSET ZREVRANGE TOP 10 기반
  const topChangeRate = useMarketStore((s) => s.topChangeRate); // 등락률 TOP 10
  const topBuyVolume = useMarketStore((s) => s.topBuyVolume); // 매수 비중 TOP 10 (buyVolPct 포함)

  // [변경] useWebSocket([], ...) — 개별 종목 가격 구독 불필요
  // 홈페이지는 home_update(BroadcastToAll)만 수신하면 충분
  // [수정] 기존 오류: useWebSocket([ALL_CODES], ...) → [ALL_CODES]는 배열 안 배열 (이중 중첩)
  useWebSocket([], { subscribeAccount: false });

  // ── 파이차트 데이터: topBuyVolume 기반 ──────────────────────────────────
  // [변경] 기존: getPopularStocks() Spring DB 누적 체결 건수
  //        변경: topBuyVolume[].buyVolPct — WS로 받은 금일 매수 비중(%)
  // buyVolPct: PriceService.GetTopBuyVolume()에서 전체 score 합산 후 비중 계산
  const pieData = topBuyVolume.map((item, i) => ({
    name: item.stockName,
    value: parseFloat((item.buyVolPct ?? 0).toFixed(2)),
    pct: (item.buyVolPct ?? 0).toFixed(1),
    fill: PIE_COLORS[i % PIE_COLORS.length],
    stockCode: item.stockCode,
  }));
  const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0);

  // ── 퀵스탯 소스 ────────────────────────────────────────────────────────
  // [수정] topByVolume(미정의) → topByBuyVol (topBuyVolume[0])
  // [수정] ranking.length(미정의) → STOCKS.length (고정값)
  const topByBuyVol = topBuyVolume[0]; // 매수 비중 1위
  const topByChange = topChangeRate[0]; // 등락률 1위

  return (
    <div className={styles.page}>
      {isLoggedIn && (
        <div className={styles.greetBanner}>
          <span>
            👋 안녕하세요, <strong>{user?.userName}</strong>님
          </span>
        </div>
      )}

      <div className={styles.pageInner}>
        <div className={styles.topGrid}>
          {/* ── 파이차트: 인기종목 매매비중 (Go WS topBuyVolume 기반) ─────── */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>인기종목 매매비중</h2>
            {pieData.length === 0 ? (
              // WS home_update 첫 수신 전까지 (최대 5초) 스피너 표시
              <div className="spinner" />
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
                        onClick={(d) => navigate(`/stock/${d.stockCode}`)}
                      >
                        {pieData.map((e, i) => (
                          <Cell key={i} fill={e.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n, p) => [
                          `${v.toFixed(1)}% (매수비중)`,
                          n,
                        ]}
                      />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.legendList}>
                  {pieData.map((d) => (
                    <div
                      key={d.stockCode}
                      className={styles.legendItem}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/stock/${d.stockCode}`)}
                    >
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

          {/* ── 등락률 TOP 10 (Go WS topChangeRate 기반) ───────────────── */}
          {/* [변경] 수익률 TOP 10(Spring 체결 수익률) → 등락률 TOP 10(Go ZSET) */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>등락률 TOP 10</h2>
            {topChangeRate.length === 0 ? (
              <div className="spinner" />
            ) : (
              <div className={styles.top10List}>
                {topChangeRate.map((t, i) => {
                  const isUp = (t.changeRate ?? 0) >= 0;
                  return (
                    <div
                      key={t.stockCode}
                      className={styles.top10Item}
                      onClick={() => navigate(`/stock/${t.stockCode}`)}
                    >
                      {/* 순위 배지 */}
                      <div
                        className={styles.top10Rank}
                        style={
                          i < 3
                            ? { background: "#dbeafe", color: "#1d4ed8" }
                            : {}
                        }
                      >
                        {i + 1}
                      </div>

                      {/* 종목 정보 */}
                      <div className={styles.top10Info}>
                        <div className={styles.top10Name}>{t.stockName}</div>
                        <div className={styles.top10Code}>{t.stockCode}</div>
                      </div>

                      {/* 현재가 + 등락률 */}
                      <div className={styles.top10Right}>
                        <div className={styles.top10Price}>
                          {t.price ? `${t.price.toLocaleString()}원` : "-"}
                        </div>
                        <div
                          className={`${styles.top10Rate} ${isUp ? "up" : "down"}`}
                        >
                          <TrendIcon up={isUp} />
                          {isUp ? "+" : ""}
                          {(t.changeRate ?? 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── 퀵스탯 3열 ─────────────────────────────────────────────────── */}
        <div className={styles.statsGrid}>
          {/* 매수 비중 1위 */}
          {/* [수정] topByVolume(미정의) → topByBuyVol(topBuyVolume[0]) */}
          <div
            className={styles.statCard}
            style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}
          >
            <div className={styles.statLabel}>매수 비중 1위</div>
            <div className={styles.statValue}>
              {topByBuyVol?.stockName ?? "-"}
            </div>
            <div className={styles.statSub}>
              {topByBuyVol?.buyVolPct != null
                ? `${topByBuyVol.buyVolPct.toFixed(1)}%`
                : ""}
            </div>
          </div>

          {/* 최고 상승률 */}
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

          {/* 총 종목 수 */}
          {/* [수정] ranking.length(미정의) → STOCKS.length */}
          <div
            className={styles.statCard}
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
          >
            <div className={styles.statLabel}>총 종목 수</div>
            <div className={styles.statValue}>{STOCKS.length}개</div>
            <div className={styles.statSub}>거래 가능</div>
          </div>
        </div>
      </div>
    </div>
  );
}
