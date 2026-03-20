import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { STOCKS } from "../constants/stocks";
import { useWebSocket } from "../hooks/useWebSocket";
import { useMarketStore } from "../store/marketStore";
import { getSortedStocks } from "../api/goApi";
import styles from "./StocksPage.module.css";

const ALL_CODES = STOCKS.map((s) => s.code);

const SORT_TABS = [
  { key: "name", label: "이름순" },
  { key: "changeRate", label: "등락률순" },
  { key: "acmlVol", label: "거래량순" },
];

function TrendIcon({ sign }) {
  const up = sign === "up";
  const down = sign === "down";
  if (up)
    return (
      <svg
        width="13"
        height="13"
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
  if (down)
    return (
      <svg
        width="13"
        height="13"
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

export default function StocksPage() {
  useWebSocket(ALL_CODES, { subscribeAccount: false });

  const navigate = useNavigate();

  const prices = useMarketStore((s) => s.prices);
  const sortedStocks = useMarketStore((s) => s.sortedStocks);
  const setSortedStocks = useMarketStore((s) => s.setSortedStocks);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("changeRate");
  const [loading, setLoading] = useState(false);

  const fetchSorted = useCallback(
    async (sortKey) => {
      setLoading(true);
      try {
        const res = await getSortedStocks(sortKey);
        if (Array.isArray(res?.stocks)) {
          setSortedStocks(res.stocks);
        }
      } catch (e) {
        console.error("getSortedStocks failed", e);
      } finally {
        setLoading(false);
      }
    },
    [setSortedStocks],
  );

  useEffect(() => {
    fetchSorted("changeRate");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabClick = useCallback(
    (key) => {
      setSort(key);
      fetchSorted(key);
    },
    [fetchSorted],
  );

  const rawList = sortedStocks;

  const mergedList = useMemo(
    () =>
      rawList.map((item) => {
        const tick = prices[item.stockCode];
        if (!tick) return item;
        return {
          ...item,
          price: tick.price ?? item.price,
          changeRate: tick.prdyCtrt ?? item.changeRate,
          prdyVrss: tick.prdyVrss ?? item.prdyVrss,
          acmlVol: tick.acmlVol ?? item.acmlVol,
        };
      }),
    [rawList, prices],
  );

  const displayList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mergedList;
    return mergedList.filter(
      (s) => s.stockName.toLowerCase().includes(q) || s.stockCode.includes(q),
    );
  }, [mergedList, query]);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.filterCard}>
          <div className={styles.searchWrap}>
            <svg
              className={styles.searchIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="종목명 또는 코드 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className={styles.sortBtns}>
            {SORT_TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.sortBtn} ${sort === key ? styles.sortActive : ""}`}
                onClick={() => handleTabClick(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="spinner" />}

        {!loading && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>종목명</th>
                  <th>코드</th>
                  <th>현재가</th>
                  <th>전일대비</th>
                  <th>등락률</th>
                  <th>누적거래량</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((s) => {
                  const sign =
                    s.changeRate > 0
                      ? "up"
                      : s.changeRate < 0
                        ? "down"
                        : "flat";
                  return (
                    <tr
                      key={s.stockCode}
                      onClick={() => navigate(`/stock/${s.stockCode}`)}
                      className={styles.row}
                    >
                      <td className={styles.nameCell}>{s.stockName}</td>
                      <td className={styles.codeCell}>{s.stockCode}</td>
                      <td className={styles.priceCell}>
                        {s.price ? `${s.price.toLocaleString()}원` : "-"}
                      </td>
                      <td className={`${styles.changeCell} ${sign}`}>
                        {s.prdyVrss != null
                          ? `${sign === "up" ? "▲" : sign === "down" ? "▼" : ""} ${s.prdyVrss.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className={`${styles.rateCell} ${sign}`}>
                        {s.changeRate != null && s.changeRate !== 0 ? (
                          <span className={styles.rateInner}>
                            <TrendIcon sign={sign} />
                            {s.changeRate > 0 ? "+" : ""}
                            {s.changeRate.toFixed(2)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className={styles.volCell}>
                        {s.acmlVol ? s.acmlVol.toLocaleString() : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div className={styles.mobileList}>
            {displayList.map((s) => {
              const sign =
                s.changeRate > 0 ? "up" : s.changeRate < 0 ? "down" : "flat";
              return (
                <div
                  key={s.stockCode}
                  className={styles.mobileCard}
                  onClick={() => navigate(`/stock/${s.stockCode}`)}
                >
                  <div className={styles.mobileTop}>
                    <div>
                      <div className={styles.mobileName}>{s.stockName}</div>
                      <div className={styles.mobileCode}>{s.stockCode}</div>
                    </div>
                    <div className={styles.mobileRight}>
                      <div className={styles.mobilePrice}>
                        {s.price ? `${s.price.toLocaleString()}원` : "-"}
                      </div>
                      <div className={`${styles.mobileRate} ${sign}`}>
                        {s.changeRate != null && s.changeRate !== 0 ? (
                          <>
                            <TrendIcon sign={sign} />{" "}
                            {s.changeRate > 0 ? "+" : ""}
                            {s.changeRate.toFixed(2)}%
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  </div>
                  {s.acmlVol > 0 && (
                    <div className={styles.mobileVol}>
                      거래량: {s.acmlVol.toLocaleString()}
                      {s.prdyVrss
                        ? ` · ${s.prdyVrss > 0 ? "+" : ""}${s.prdyVrss.toLocaleString()}원`
                        : ""}
                    </div>
                  )}
                </div>
              );
            })}
            {displayList.length === 0 && !loading && (
              <div className={styles.empty}>검색 결과가 없습니다.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
