import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWatchlistStore } from "../store/watchlistStore";
import { useMarketStore } from "../store/marketStore";
import { useAuthStore } from "../store/authStore";
import { useWebSocket } from "../hooks/useWebSocket";
import { getStocksBatch } from "../api/goApi";
import { fmtPrice, fmtPct } from "../utils/format";
import styles from "./WatchlistPage.module.css";

function WatchRow({ code, name, onRemove }) {
  const navigate = useNavigate();
  const tick = useMarketStore((s) => s.prices[code]);
  const dir = tick?.prdyCtrt > 0 ? "up" : tick?.prdyCtrt < 0 ? "down" : "flat";
  const hasPrice = tick?.price != null && tick.price > 0;

  return (
    <div className={styles.row}>
      <div
        className={styles.rowMain}
        onClick={() => navigate(`/stock/${code}`)}
      >
        <div className={styles.rowLeft}>
          <div className={styles.rowName}>{name}</div>
          <div className={styles.rowCode}>{code}</div>
        </div>
        <div className={styles.rowRight}>
          <div className={styles.rowPrice}>
            {hasPrice ? `${fmtPrice(tick.price)}원` : "—"}
          </div>
          <div className={`${styles.rowRate} ${hasPrice ? dir : ""}`}>
            {hasPrice
              ? `${dir === "up" ? "▲" : dir === "down" ? "▼" : ""} ${fmtPct(tick.prdyCtrt)}`
              : "—"}
          </div>
          {hasPrice && tick.prdyVrss != null && (
            <div className={`${styles.rowDiff} ${dir}`}>
              {tick.prdyVrss >= 0 ? "+" : ""}
              {fmtPrice(tick.prdyVrss)}
            </div>
          )}
        </div>
      </div>
      <button
        className={styles.removeBtn}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(code);
        }}
        title="관심 해제"
        aria-label="관심 해제"
      >
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
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function WatchlistPage() {
  const { isLoggedIn } = useAuthStore();
  const items = useWatchlistStore((s) => s.items);
  const loading = useWatchlistStore((s) => s.loading);
  const initialized = useWatchlistStore((s) => s.initialized);
  const fetchFromServer = useWatchlistStore((s) => s.fetchFromServer);
  const remove = useWatchlistStore((s) => s.remove);
  const seedPrice = useMarketStore((s) => s.seedPrice);
  const navigate = useNavigate();

  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const prevCodesRef = useRef("");

  useEffect(() => {
    if (isLoggedIn) {
      fetchFromServer();
    }
  }, [isLoggedIn, fetchFromServer]);

  const codes = items.map((i) => i.stockCode ?? i);

  const fetchInitial = useCallback(
    async (codeList) => {
      if (codeList.length === 0) {
        setSeedDone(true);
        return;
      }
      setSeeding(true);
      try {
        const { stocks = [] } = await getStocksBatch(codeList);
        stocks.forEach((s) => {
          seedPrice(s.stockCode, {
            price: s.price,
            prdyCtrt: s.changeRate,
            prdyVrss: s.prdyVrss,
            acmlVol: s.acmlVol,
          });
        });
      } catch (err) {
        console.warn("[WatchlistPage] batch fetch failed:", err);
      } finally {
        setSeeding(false);
        setSeedDone(true);
      }
    },
    [seedPrice],
  );

  useEffect(() => {
    if (!initialized) return;
    const key = codes.join(",");
    if (key === prevCodesRef.current) return;
    prevCodesRef.current = key;
    fetchInitial(codes);
  }, [codes.join(","), initialized]); // eslint-disable-line

  useWebSocket(codes, { subscribeAccount: false });

  const isEmpty = initialized && items.length === 0;
  const isLoading = loading && !initialized;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h1 className={styles.title}>관심 종목</h1>
          {!isEmpty && items.length > 0 && (
            <span className={styles.count}>{items.length}개</span>
          )}
        </div>

        {isLoggedIn && isLoading && (
          <div className={styles.loadingBanner}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <span>관심종목 불러오는 중...</span>
          </div>
        )}

        {isLoggedIn && isEmpty && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className={styles.emptyText}>관심 종목이 없습니다.</div>
            <div className={styles.emptySub}>
              종목 페이지에서 ★ 버튼을 눌러 추가하세요.
            </div>
          </div>
        )}

        {isLoggedIn && !isLoading && items.length > 0 && (
          <>
            {seeding && !seedDone && (
              <div className={styles.loadingBanner}>
                <div className={styles.loadingDot} />
                <div className={styles.loadingDot} />
                <div className={styles.loadingDot} />
                <span>시세 불러오는 중...</span>
              </div>
            )}

            <div className={styles.list}>
              {items.map((item) => {
                const code = item.stockCode ?? item;
                const name = item.stockName ?? code;
                return (
                  <WatchRow
                    key={code}
                    code={code}
                    name={name}
                    onRemove={remove}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
