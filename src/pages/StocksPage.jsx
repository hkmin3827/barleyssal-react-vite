import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { STOCKS } from "../constants/stocks";
import { useWebSocket } from "../hooks/useWebSocket";
import { useMarketStore } from "../store/marketStore";
import { getSortedStocks } from "../api/goApi";
import { prdySign } from "../utils/format";
import styles from "./StocksPage.module.css";

const ALL_CODES = STOCKS.map((s) => s.code);

// 이름순: 정적 데이터 — 컴포넌트 외부에서 1회만 생성 (마운트마다 재생성 방지)
const STOCKS_BY_NAME = [...STOCKS].sort((a, b) =>
  a.name.localeCompare(b.name, "ko"),
);

// 정렬 탭 정의
// useApi: false → 백엔드 호출 없이 프론트엔드 자체 처리
// useApi: true  → GET /api/stocks?sort={key} 호출
const SORT_TABS = [
  { key: "name", label: "이름순", useApi: false },
  { key: "changeRate", label: "등락률순", useApi: true },
  { key: "acmlVol", label: "거래량순", useApi: true },
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
  // ── WS 구독 유지 ─────────────────────────────────────────────────────────
  // 실시간 tick → prices 스토어 갱신 → mergedList 자동 반영
  // 언마운트 시: SUBSCRIBE_PRICE:[] 전송 → 서버에서 ALL_CODES 구독 전체 해제
  // StockDetailPage 진입 시: SUBSCRIBE_PRICE:[code] 전송 → 단일 종목만 구독
  useWebSocket(ALL_CODES, { subscribeAccount: false });

  const navigate = useNavigate();

  // prices: WS tick 수신 시 갱신되는 실시간 오버레이 소스
  const prices = useMarketStore((s) => s.prices);
  // sortedStocks: REST API 응답 (Redis ZSET 기준 정렬된 배열)
  const sortedStocks = useMarketStore((s) => s.sortedStocks);
  const setSortedStocks = useMarketStore((s) => s.setSortedStocks);

  const [query, setQuery] = useState("");
  // [수정] "change" → "changeRate" (SORT_TABS 키와 일치)
  const [sort, setSort] = useState("changeRate");
  const [loading, setLoading] = useState(false);
  // 이름순 탭 전용 로컬 리스트 (API 미호출, handleTabClick에서 생성)
  const [nameList, setNameList] = useState([]);

  // ── fetchSorted: 백엔드 정렬 API 호출 ────────────────────────────────────
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

  // ── 초기 마운트: 기본 탭(등락률순) fetch ─────────────────────────────────
  useEffect(() => {
    fetchSorted("changeRate");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── handleTabClick: 탭 전환 및 같은 탭 재클릭 처리 ───────────────────────
  // [변경] 기존: if (key === sort) return  → 같은 탭 재클릭 무시했음
  //        변경: guard 제거 → 같은 탭 재클릭도 Redis 최신 정렬을 re-fetch
  //        이유: 5초마다 ZSET이 갱신되므로 재클릭 시 최신 순위 반영 가능
  const handleTabClick = useCallback(
    (key) => {
      setSort(key);
      if (key === "name") {
        // 이름순: API 미호출. prices 스토어로 즉시 보완.
        // 같은 "이름순" 탭 재클릭 시에도 prices 최신값으로 nameList 재생성.
        const enriched = STOCKS_BY_NAME.map((s) => ({
          stockCode: s.code,
          stockName: s.name,
          price: prices[s.code]?.price ?? 0,
          changeRate: prices[s.code]?.prdyCtrt ?? 0,
          prdyVrss: prices[s.code]?.prdyVrss ?? 0,
          prdyVrssSign: prices[s.code]?.prdyVrssSign ?? "",
          acmlVol: prices[s.code]?.acmlVol ?? 0,
        }));
        setNameList(enriched);
      } else {
        // API 탭: 같은 탭 재클릭 포함 항상 Redis re-fetch
        fetchSorted(key);
      }
    },
    [fetchSorted, prices],
  );

  // ── rawList: 현재 탭의 기본 정렬 목록 ────────────────────────────────────
  const rawList = sort === "name" ? nameList : sortedStocks;

  // ── mergedList: rawList + prices 실시간 오버레이 ──────────────────────────
  // [핵심] 정렬 순서는 Redis 기준 유지. WS tick이 오면 가격/등락률만 갱신.
  // useMemo: rawList 또는 prices가 변경될 때만 재계산 (O(N) merge, 재정렬 없음)
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
          prdyVrssSign: tick.prdyVrssSign ?? item.prdyVrssSign,
          acmlVol: tick.acmlVol ?? item.acmlVol,
        };
      }),
    [rawList, prices],
  );

  // ── displayList: 검색 필터 적용 ──────────────────────────────────────────
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
        {/* 검색 + 정렬 탭 */}
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

          {/* [수정] 구 탭 [이름/가격/등락률] → 신 탭 [이름/등락률/거래량] */}
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

        {/* 로딩 인디케이터 */}
        {loading && <div className="spinner" />}

        {/* 데스크탑 테이블 */}
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
                  <th>거래량</th>
                </tr>
              </thead>
              <tbody>
                {/* [수정] 구 list(ranking 참조) → 신 displayList(sortedStocks + prices 오버레이) */}
                {displayList.map((s) => {
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
                        {s.acmlVol ? s.acmlVol.toLocaleString() : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 모바일 카드 */}
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
