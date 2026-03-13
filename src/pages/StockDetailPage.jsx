import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMarketStore } from "../store/marketStore";
import { useWatchlistStore } from "../store/watchlistStore";
import { getStockName } from "../constants/stocks";
import { getIntradayChart, getPeriodChart } from "../api/nodeApi";
import CandleChart from "../components/chart/CandleChart";
import OrderDrawer from "../components/order/OrderDrawer";
import {
  fmtPrice,
  fmtPct,
  fmtVol,
  fmtMoney,
  prdySign,
  signStr,
} from "../utils/format";
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

export default function StockDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const tick = useMarketStore((s) => s.prices[code]);
  const isOpen = useMarketStore((s) => s.isMarketOpen(code));
  const isWatched = useWatchlistStore((s) => s.isWatched(code));
  const toggle = useWatchlistStore((s) => s.toggle);

  const [tf, setTf] = useState("1m"); // active timeframe
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState("intraday"); // 'intraday'|'period'
  const [chartLoading, setChartLoading] = useState(false);
  const [drawer, setDrawer] = useState(null); // null | 'BUY' | 'SELL'
  const [orderDone, setOrderDone] = useState(null);

  const name = getStockName(code);

  // --- Chart fetch ---
  const fetchChart = useCallback(
    async (timeframe) => {
      setChartLoading(true);
      try {
        const isPeriod = PERIOD_TFS.includes(timeframe);
        if (isPeriod) {
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

  // Append realtime candle tick to intraday chart
  const prevTickRef = useRef(null);
  useEffect(() => {
    if (chartMode !== "intraday" || !tick) return;
    if (prevTickRef.current === tick) return;
    prevTickRef.current = tick;
    // Just refetch at most every 10 s (simple approach)
  }, [tick, chartMode]);

  const dir = prdySign(tick?.prdyVrssSign);
  const color =
    dir === "up"
      ? "var(--red)"
      : dir === "down"
        ? "var(--blue)"
        : "var(--text-secondary)";

  const handleOrderSuccess = (result) => {
    setOrderDone(`주문 접수 완료 (${result?.orderStatus ?? "PENDING"})`);
    setTimeout(() => setOrderDone(null), 4000);
  };

  return (
    <div className={styles.page}>
      {/* ── Top bar area ── */}
      <div className={styles.topArea}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>
        <div className={styles.titleGroup}>
          <span className={styles.stockName}>{name}</span>
          <span className={styles.stockCode}>{code}</span>
        </div>
        <button
          className={`${styles.starBtn} ${isWatched ? styles.starred : ""}`}
          onClick={() => toggle(code, name)}
        >
          ★
        </button>
      </div>

      {/* ── Price hero ── */}
      <div className={styles.priceHero}>
        <div className={styles.currentPrice} style={{ color }}>
          <span className="num">{tick ? fmtPrice(tick.price) : "—"}</span>
          <span className={styles.won}>원</span>
        </div>
        <div className={styles.priceRow2}>
          <span className={`${styles.change} num`} style={{ color }}>
            {tick
              ? `${signStr(tick.prdyVrssSign)} ${fmtPrice(tick.prdyVrss)}`
              : "—"}
          </span>
          <span className={`${styles.changePct} num`} style={{ color }}>
            {tick ? fmtPct(tick.prdyCtrt) : "—"}
          </span>
        </div>

        {/* Extra stats row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statL}>누적거래량</span>
            <span className="num">{tick ? fmtVol(tick.acmlVol) : "—"}</span>
          </div>
          {tick?.askp1 && (
            <div className={styles.stat}>
              <span className={styles.statL}>매도호가</span>
              <span className="num up">{fmtPrice(tick.askp1)}</span>
            </div>
          )}
          {tick?.bidp1 && (
            <div className={styles.stat}>
              <span className={styles.statL}>매수호가</span>
              <span className="num down">{fmtPrice(tick.bidp1)}</span>
            </div>
          )}
          {tick?.wghnAvrgStckPrc && (
            <div className={styles.stat}>
              <span className={styles.statL}>가중평균가</span>
              <span className="num">{fmtPrice(tick.wghnAvrgStckPrc)}</span>
            </div>
          )}
          {tick?.stckOprc && (
            <div className={styles.stat}>
              <span className={styles.statL}>시가</span>
              <span className="num">{fmtPrice(tick.stckOprc)}</span>
            </div>
          )}
          {tick?.stckHgpr && (
            <div className={styles.stat}>
              <span className={styles.statL}>고가</span>
              <span className="num up">{fmtPrice(tick.stckHgpr)}</span>
            </div>
          )}
          {tick?.stckLwpr && (
            <div className={styles.stat}>
              <span className={styles.statL}>저가</span>
              <span className="num down">{fmtPrice(tick.stckLwpr)}</span>
            </div>
          )}
          {tick?.cttr != null && (
            <div className={styles.stat}>
              <span className={styles.statL}>체결강도</span>
              <span className="num">{Number(tick.cttr).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Market status pill */}
        <div
          className={`${styles.marketPill} ${isOpen ? styles.marketOpen : styles.marketClosed}`}
        >
          <span className={styles.dot} />
          {isOpen ? "장 운영 중" : "장 마감"}
        </div>
      </div>

      {/* ── Timeframe tabs ── */}
      <div className={styles.tfBar}>
        {/* Intraday group */}
        <div className={styles.tfGroup}>
          {INTRADAY_TFS.map((t) => (
            <button
              key={t}
              className={`${styles.tfBtn} ${tf === t ? styles.tfActive : ""}`}
              onClick={() => setTf(t)}
            >
              {TF_LABELS[t]}
            </button>
          ))}
        </div>
        <div className={styles.tfDivider} />
        {/* Period group */}
        <div className={styles.tfGroup}>
          {PERIOD_TFS.map((t) => (
            <button
              key={t}
              className={`${styles.tfBtn} ${tf === t ? styles.tfActive : ""}`}
              onClick={() => setTf(t)}
            >
              {TF_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart ── */}
      <div className={styles.chartWrap}>
        {chartLoading ? (
          <div className="spinner" />
        ) : chartData.length === 0 ? (
          <div className={styles.noData}>차트 데이터가 없습니다.</div>
        ) : (
          <CandleChart data={chartData} mode={chartMode} height={320} />
        )}
      </div>

      {/* ── Order success toast ── */}
      {orderDone && <div className={styles.toast}>{orderDone}</div>}

      {/* ── Buy / Sell buttons ── */}
      <div className={styles.orderBar}>
        <button
          className={styles.buyBtn}
          onClick={() => {
            if (!isOpen) {
              alert("장 운영 시간이 아닙니다.");
              return;
            }
            setDrawer("BUY");
          }}
        >
          매수
        </button>
        <button
          className={styles.sellBtn}
          onClick={() => {
            if (!isOpen) {
              alert("장 운영 시간이 아닙니다.");
              return;
            }
            setDrawer("SELL");
          }}
        >
          매도
        </button>
      </div>

      {/* ── Order Drawer ── */}
      {drawer && (
        <OrderDrawer
          stockCode={code}
          side={drawer}
          onClose={() => setDrawer(null)}
          onSuccess={handleOrderSuccess}
        />
      )}
    </div>
  );
}
