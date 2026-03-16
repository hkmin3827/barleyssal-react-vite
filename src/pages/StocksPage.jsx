import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { STOCKS } from "../constants/stocks";
import { useWebSocket } from "../hooks/useWebSocket";
import { useMarketStore } from "../store/marketStore";
import { fmtPrice, fmtPct, prdySign, signStr } from "../utils/format";
import styles from "./StocksPage.module.css";

const ALL_CODES = STOCKS.map((s) => s.code);

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
  useWebSocket({ stocks: ALL_CODES, subscribeAccount: false });
  const navigate = useNavigate();
  const ranking = useMarketStore((s) => s.ranking);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("change");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let src =
      ranking.length > 0
        ? [...ranking]
        : STOCKS.map((s) => ({
            stockCode: s.code,
            stockName: s.name,
            volume: 0,
            changeRate: 0,
            price: 0,
          }));
    if (q)
      src = src.filter(
        (s) => s.stockName.toLowerCase().includes(q) || s.stockCode.includes(q),
      );
    src.sort((a, b) => {
      if (sort === "name") return a.stockName.localeCompare(b.stockName);
      if (sort === "price") return (b.price || 0) - (a.price || 0);
      return (b.changeRate || 0) - (a.changeRate || 0);
    });
    return src;
  }, [query, ranking, sort]);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* 검색 + 정렬 */}
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
            {[
              ["name", "이름순"],
              ["price", "가격순"],
              ["change", "등락률"],
            ].map(([k, l]) => (
              <button
                key={k}
                className={`${styles.sortBtn} ${sort === k ? styles.sortActive : ""}`}
                onClick={() => setSort(k)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* 데스크탑 테이블 */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>종목명</th>
                <th>코드</th>
                <th>현재가</th>
                <th>전일대비</th>
                <th>등락률</th>
                <th>거래량</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const sign =
                  prdySign(s.prdyVrssSign) ||
                  (s.changeRate > 0
                    ? "up"
                    : s.changeRate < 0
                      ? "down"
                      : "flat");
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
                        ? `${s.prdyVrss > 0 ? "+" : ""}${s.prdyVrss?.toLocaleString()}`
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
                      {s.volume ? s.volume.toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 */}
        <div className={styles.mobileList}>
          {list.map((s) => {
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
                {s.volume > 0 && (
                  <div className={styles.mobileVol}>
                    거래량: {s.volume.toLocaleString()}
                    {s.prdyVrss
                      ? ` · ${s.prdyVrss > 0 ? "+" : ""}${s.prdyVrss.toLocaleString()}원`
                      : ""}
                  </div>
                )}
              </div>
            );
          })}
          {list.length === 0 && (
            <div className={styles.empty}>검색 결과가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
