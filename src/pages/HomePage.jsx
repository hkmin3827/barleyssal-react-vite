import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { STOCKS } from "../constants/stocks";
import { useMarketStore } from "../store/marketStore";
import { useAuthStore } from "../store/authStore";
import { getTopProfitableTrades, getPopularStocks } from "../api/springApi";
import PopularStocksChart from "../components/stats/PopularStocksChart";
import { fmtPrice, fmtPct, fmtMoney, prdySign, signStr } from "../utils/format";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const prices = useMarketStore((s) => s.prices);
  const [topTrades, setTopTrades] = useState([]);
  const [popularData, setPopularData] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTopProfitableTrades(), getPopularStocks()])
      .then(([top, pop]) => {
        setTopTrades(Array.isArray(top) ? top.slice(0, 5) : []);
        setPopularData(pop && typeof pop === "object" ? pop : {});
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const movers = STOCKS.slice(0, 8)
    .map((s) => ({
      ...s,
      tick: prices[s.code],
    }))
    .filter((s) => s.tick)
    .sort((a, b) => Math.abs(b.tick.prdyCtrt) - Math.abs(a.tick.prdyCtrt));

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLogo}>보리쌀</div>
          <p className={styles.heroSub}>실시간 주식 모의투자</p>
          {!isLoggedIn && (
            <button
              className={styles.heroBtn}
              onClick={() => navigate("/login")}
            >
              시작하기 →
            </button>
          )}
          {isLoggedIn && (
            <div className={styles.heroGreet}>
              안녕하세요, <strong>{user?.userName}</strong>님
            </div>
          )}
        </div>
      </div>

      {/* Top movers */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>실시간 급등락</span>
          <button
            className={styles.moreBtn}
            onClick={() => navigate("/stocks")}
          >
            전체 보기
          </button>
        </div>
        <div className={styles.moversGrid}>
          {movers.slice(0, 6).map((s) => {
            const dir = prdySign(s.tick?.prdyVrssSign);
            return (
              <div
                key={s.code}
                className={styles.moverCard}
                onClick={() => navigate(`/stock/${s.code}`)}
              >
                <div className={styles.moverName}>{s.name}</div>
                <div className={`${styles.moverPrice} num ${dir}`}>
                  {fmtPrice(s.tick.price)}
                </div>
                <div className={`${styles.moverChange} num ${dir}`}>
                  {signStr(s.tick.prdyVrssSign)} {fmtPct(s.tick.prdyCtrt)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular Stocks */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>인기 종목 매매 비중</span>
          <span className={styles.badge}>최근 14일</span>
        </div>
        <div className={styles.card}>
          {statsLoading ? (
            <div className="spinner" />
          ) : (
            <PopularStocksChart data={popularData} />
          )}
        </div>
      </section>

      {/* Top profitable trades */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>수익률 TOP</span>
          <span className={styles.badge}>최근 14일 매도</span>
        </div>
        <div className={styles.tradeList}>
          {statsLoading ? (
            <div className="spinner" />
          ) : topTrades.length === 0 ? (
            <div className={styles.empty}>데이터가 없습니다.</div>
          ) : (
            topTrades.map((t, i) => (
              <div key={t.id ?? i} className={styles.tradeCard}>
                <div
                  className={`${styles.tradeRank} ${i < 3 ? styles.gold : ""}`}
                >
                  {i + 1}
                </div>
                <div className={styles.tradeInfo}>
                  <div className={styles.tradeName}>{t.userName ?? "익명"}</div>
                  <div className={styles.tradeCode}>{t.stockCode}</div>
                </div>
                <div className={styles.tradeRight}>
                  <div
                    className={`${styles.tradePnl} num`}
                    style={{
                      color:
                        t.finalProfitRate >= 0 ? "var(--red)" : "var(--blue)",
                    }}
                  >
                    {t.finalProfitRate >= 0 ? "+" : ""}
                    {Number(t.finalProfitRate ?? 0).toFixed(2)}%
                  </div>
                  <div className={styles.tradeDetail}>
                    {fmtPrice(t.executedPrice)}원 ·{" "}
                    {(t.quantity ?? 0).toLocaleString()}주
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
