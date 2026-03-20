import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMarketStore } from "../store/marketStore";
import { useWatchlistStore } from "../store/watchlistStore";
import { getStockName } from "../constants/stocks";
import { getIntradayChart, getPeriodChart, getStockInfo } from "../api/goApi";
import CandleChart from "../components/chart/CandleChart";
import OrderPanel from "../components/order/OrderPanel";
import { fmtPrice, fmtPct } from "../utils/format";
import { useWebSocket } from "../hooks/useWebSocket";
import styles from "./StockDetailPage.module.css";
const INTRADAY_TFS = ["1m", "5m", "10m", "30m"];
const PERIOD_TFS = ["D", "W", "M", "Y"];
const TF_LABELS = {
  "1m": "1분",
  "5m": "5분",
  "10m": "10분",
  "30m": "30분",
  D: "일",
  W: "주",
  M: "월",
  Y: "년",
};

function TrendIcon({ sign }) {
  if (sign === "up")
    return (
      <svg
        width="16"
        height="16"
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
    );
  if (sign === "down")
    return (
      <svg
        width="16"
        height="16"
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
  return null;
}

export default function StockDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  const tick = useMarketStore((s) => s.prices[code]);
  const seedPrice = useMarketStore((s) => s.seedPrice);
  const isOpen = useMarketStore((s) => s.isMarketOpen(code));
  const isWatched = useWatchlistStore((s) => s.isWatched(code));
  const toggle = useWatchlistStore((s) => s.toggle);

  const [tf, setTf] = useState("1m");
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState("intraday");
  const [chartLoading, setChartLoading] = useState(false);
  const [orderDone, setOrderDone] = useState(null);

  const sign = tick?.prdyCtrt > 0 ? "up" : tick?.prdyCtrt < 0 ? "down" : "flat";

  useWebSocket([code], { subscribeAccount: false });

  useEffect(() => {
    getStockInfo(code)
      .then((res) => {
        if (res?.price != null) {
          seedPrice(code, {
            price: res.price,
            prdyCtrt: res.changeRate,
            prdyVrss: res.prdyVrss,
            stckOprc: res.stckOprc,
            stckHgpr: res.stckHgpr,
            stckLwpr: res.stckLwpr,
            acmlVol: res.acmlVol,
            cntgVol: res.volume,
            mKopCode: res.mKopCode,
            ts: res.ts,
          });
        }
      })
      .catch(() => {});
  }, [code, seedPrice]);

  const name = getStockName(code);

  const priceColor =
    sign === "up"
      ? "var(--red)"
      : sign === "down"
        ? "var(--blue)"
        : "var(--text-secondary)";

  const fetchChart = useCallback(
    async (timeframe) => {
      setChartLoading(true);
      try {
        if (PERIOD_TFS.includes(timeframe)) {
          const res = await getPeriodChart(code, timeframe);
          setChartData(res?.data ?? []);
          setChartMode("period");
        } else {
          const res = await getIntradayChart(code, timeframe, 300);
          setChartData(res?.data ?? []);
          setChartMode("intraday");
        }
      } catch {
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    },
    [code],
  );

  useEffect(() => {
    fetchChart(tf);
  }, [tf, fetchChart]);

  const handleOrderSuccess = (result) => {
    setTimeout(() => setOrderDone(null), 4000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          이전
        </button>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={styles.infoCard}>
            <div className={styles.infoTop}>
              <div>
                <div className={styles.stockName}>{name}</div>
                <div className={styles.stockCode}>{code}</div>
              </div>
              <button
                className={`${styles.watchBtn} ${isWatched ? styles.watched : ""}`}
                onClick={() => toggle(code, name)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={isWatched ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            </div>

            <div className={styles.priceSection}>
              <div
                className={styles.currentPrice}
                style={{ color: priceColor }}
              >
                {tick ? `${tick.price.toLocaleString()}원` : "—"}
              </div>
              {tick?.prdyVrss != null && (
                <div
                  className={styles.priceChange}
                  style={{ color: priceColor }}
                >
                  <TrendIcon sign={sign} />
                  {sign === "up" ? "▲" : sign === "down" ? "▼" : ""}
                  {fmtPrice(tick.prdyVrss)}원 ({fmtPct(tick.prdyCtrt)})
                </div>
              )}
            </div>

            <div className={styles.separator} />

            <div className={styles.statsGrid}>
              {[
                ["시가", tick?.stckOprc, null],
                ["고가", tick?.stckHgpr, "var(--red)"],
                ["저가", tick?.stckLwpr, "var(--blue)"],
                [
                  "누적 거래량",
                  tick?.acmlVol ? `${tick.acmlVol.toLocaleString()}주` : null,
                  null,
                ],
              ].map(
                ([label, val, color]) =>
                  val != null && (
                    <div key={label}>
                      <div className={styles.statLabel}>{label}</div>
                      <div
                        className={styles.statValue}
                        style={color ? { color } : {}}
                      >
                        {typeof val === "number"
                          ? `${val.toLocaleString()}원`
                          : val}
                      </div>
                    </div>
                  ),
              )}
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>가격 차트</h3>
            <div className={styles.tfRow}>
              {[...INTRADAY_TFS, ...PERIOD_TFS].map((t) => (
                <button
                  key={t}
                  className={`${styles.tfBtn} ${tf === t ? styles.tfActive : ""}`}
                  onClick={() => setTf(t)}
                >
                  {TF_LABELS[t]}
                </button>
              ))}
            </div>
            <div className={styles.chartBox}>
              {chartLoading ? (
                <div className="spinner" />
              ) : chartData.length === 0 ? (
                <div className={styles.noData}>차트 데이터가 없습니다.</div>
              ) : (
                <CandleChart data={chartData} mode={chartMode} height={280} />
              )}
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          <OrderPanel
            stockCode={code}
            tick={tick}
            isOpen={isOpen}
            onSuccess={handleOrderSuccess}
          />
        </div>

        <div className={styles.mobileOrderBar}>
          <OrderPanel
            stockCode={code}
            tick={tick}
            isOpen={isOpen}
            onSuccess={handleOrderSuccess}
            mobile
          />
        </div>
      </div>
    </div>
  );
}
