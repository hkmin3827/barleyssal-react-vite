import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMarketStore } from "../store/marketStore";
import { useWatchlistStore } from "../store/watchlistStore";
import { getStockName } from "../constants/stocks";
import { getIntradayChart, getPeriodChart } from "../api/goApi";
import CandleChart from "../components/chart/CandleChart";
import OrderPanel from "../components/order/OrderPanel";
import { fmtPrice, fmtPct, fmtVol, prdySign, signStr } from "../utils/format";
import styles from "./StockDetailPage.module.css";
import { useWebSocket } from "../hooks/useWebSocket";

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

function TrendIcon({ up }) {
  return up ? (
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
  ) : (
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
}

export default function StockDetailPage() {
  const { code } = useParams();
  useWebSocket({ stocks: [code], subscribeAccount: false });
  const navigate = useNavigate();
  const tick = useMarketStore((s) => s.prices[code]);
  const isOpen = useMarketStore((s) => s.isMarketOpen(code));
  const isWatched = useWatchlistStore((s) => s.isWatched(code));
  const toggle = useWatchlistStore((s) => s.toggle);

  const [tf, setTf] = useState("1m");
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState("intraday");
  const [chartLoading, setChartLoading] = useState(false);
  const [orderDone, setOrderDone] = useState(null);

  const name = getStockName(code);
  const dir = prdySign(tick?.prdyVrssSign);
  const priceColor =
    dir === "up"
      ? "var(--red)"
      : dir === "down"
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
    setOrderDone(`주문 접수 완료 (${result?.orderStatus ?? "PENDING"})`);
    setTimeout(() => setOrderDone(null), 4000);
  };

  return (
    <div className={styles.page}>
      {/* 뒤로가기 헤더 */}
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
          종목 목록
        </button>
      </div>

      {/* 메인 레이아웃: 좌측 + 우측(주문) */}
      <div className={styles.layout}>
        {/* 좌측: 종목정보 + 차트 */}
        <div className={styles.leftCol}>
          {/* 종목 헤더 카드 */}
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
              {tick && (
                <div
                  className={styles.priceChange}
                  style={{ color: priceColor }}
                >
                  <TrendIcon up={dir === "up"} />
                  {signStr(tick.prdyVrssSign)}
                  {fmtPrice(tick.prdyVrss)}원 ({fmtPct(tick.prdyCtrt)})
                </div>
              )}
            </div>

            <div className={styles.separator} />

            {/* 4열 stats 그리드 */}
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
                    <div key={label} className={styles.statItem}>
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

          {/* 차트 카드 */}
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

        {/* 우측: 주문 패널 (데스크탑) */}
        <div className={styles.rightCol}>
          <OrderPanel
            stockCode={code}
            tick={tick}
            isOpen={isOpen}
            onSuccess={handleOrderSuccess}
          />
        </div>

        {/* 모바일: 하단 버튼 */}
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

      {orderDone && <div className={styles.toast}>{orderDone}</div>}
    </div>
  );
}
