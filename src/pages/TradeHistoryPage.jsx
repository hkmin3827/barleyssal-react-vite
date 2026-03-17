import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getMyOrders, cancelOrder } from "../api/springApi";
import { getStockName } from "../constants/stocks";
import { fmtMoney } from "../utils/format";
import styles from "./TradeHistoryPage.module.css";

// ─── 상수 ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const SIDE_FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "BUY", label: "매수" },
  { key: "SELL", label: "매도" },
];

const STATUS_FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "FILLED", label: "체결" },
  { key: "PENDING", label: "대기" },
  { key: "CANCELLED", label: "취소" },
  { key: "EXPIRED", label: "만료" },
];

const STATUS_LABEL = {
  PENDING: { text: "대기", cls: "wait" },
  SUBMITTED: { text: "접수", cls: "wait" },
  FILLED: { text: "체결", cls: "filled" },
  CANCELLED: { text: "취소", cls: "cancelled" },
  EXPIRED: { text: "만료", cls: "expired" },
  REJECTED: { text: "거부", cls: "cancelled" },
};

const TYPE_LABEL = { MARKET: "시장가", LIMIT: "지정가" };

function fmtInstant(isoStr) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

// ─── 컴포넌트 ──────────────────────────────────────────────────────────
export default function TradeHistoryPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  const [allOrders, setAllOrders] = useState([]); // Spring에서 받은 전체 목록
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sideFilter, setSideFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1); // 현재 표시 페이지
  const [cancelling, setCancelling] = useState(null); // 취소 중인 orderId

  const loaderRef = useRef(null); // 무한스크롤 센티넬

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [isLoggedIn]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyOrders();
      // 최신 순 정렬
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setAllOrders(sorted);
    } catch {
      setError("거래 내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 필터 적용 ────────────────────────────────────────────────────────
  const filtered = allOrders.filter((o) => {
    if (sideFilter !== "ALL" && o.orderSide !== sideFilter) return false;
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING")
      return o.orderStatus === "PENDING" || o.orderStatus === "SUBMITTED";
    return o.orderStatus === statusFilter;
  });

  // ── 페이지네이션 (표시 슬라이스) ──────────────────────────────────────
  const displayed = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = displayed.length < filtered.length;

  // ── 무한 스크롤 ─────────────────────────────────────────────────────
  useEffect(() => {
    setPage(1); // 필터 바뀌면 페이지 초기화
  }, [sideFilter, statusFilter]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) setPage((p) => p + 1);
      },
      { rootMargin: "120px" },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  // ── 주문 취소 ────────────────────────────────────────────────────────
  const handleCancel = async (orderId) => {
    if (!window.confirm("해당 주문을 취소하시겠습니까?")) return;
    setCancelling(orderId);
    try {
      await cancelOrder(orderId);
      setAllOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, orderStatus: "CANCELLED" } : o,
        ),
      );
    } catch (e) {
      alert(e.response?.data?.message || "취소 실패. 잠시 후 다시 시도하세요.");
    } finally {
      setCancelling(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* 헤더 */}
        <div className={styles.headerRow}>
          <h1 className={styles.title}>거래 내역</h1>
          <button
            className={styles.refreshBtn}
            onClick={fetchOrders}
            disabled={loading}
            title="새로고침"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>

        {/* 필터 바 */}
        <div className={styles.filterBar}>
          {/* 매수/매도 */}
          <div className={styles.filterGroup}>
            {SIDE_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`${styles.filterBtn} ${sideFilter === f.key ? styles.filterActive : ""}`}
                onClick={() => setSideFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* 상태 */}
          <div className={styles.filterGroup}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`${styles.filterBtn} ${statusFilter === f.key ? styles.filterActive : ""}`}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 요약 */}
        <div className={styles.summary}>
          총 <strong>{filtered.length}</strong>건
        </div>

        {/* 로딩 */}
        {loading && (
          <div className={styles.center}>
            <div className="spinner" />
          </div>
        )}

        {/* 에러 */}
        {!loading && error && <div className={styles.errorBox}>{error}</div>}

        {/* 빈 상태 */}
        {!loading && !error && filtered.length === 0 && (
          <div className={styles.empty}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p>거래 내역이 없습니다.</p>
          </div>
        )}

        {/* 주문 목록 */}
        {!loading && !error && displayed.length > 0 && (
          <div className={styles.list}>
            {displayed.map((order) => {
              const st = STATUS_LABEL[order.orderStatus] ?? {
                text: order.orderStatus,
                cls: "wait",
              };
              const isBuy = order.orderSide === "BUY";
              const canCancel =
                order.orderStatus === "PENDING" ||
                order.orderStatus === "SUBMITTED";
              const execAmt = order.executedPrice
                ? order.executedPrice * order.executedQuantity
                : null;

              return (
                <div key={order.id} className={styles.card}>
                  {/* 카드 헤더 */}
                  <div className={styles.cardHead}>
                    <div className={styles.cardLeft}>
                      <span
                        className={`${styles.sideTag} ${isBuy ? styles.buy : styles.sell}`}
                      >
                        {isBuy ? "매수" : "매도"}
                      </span>
                      <span className={styles.stockName}>
                        {getStockName(order.stockCode)}
                      </span>
                      <span className={styles.stockCode}>
                        {order.stockCode}
                      </span>
                    </div>
                    <div className={styles.cardRight}>
                      <span className={`${styles.statusTag} ${styles[st.cls]}`}>
                        {st.text}
                      </span>
                      {canCancel && (
                        <button
                          className={styles.cancelBtn}
                          onClick={() => handleCancel(order.id)}
                          disabled={cancelling === order.id}
                        >
                          {cancelling === order.id ? "취소중..." : "주문취소"}
                        </button>
                      )}
                    </div>
                    {order.orderStatus === "REJECTED" &&
                      order.orderRejectReason && (
                        <button className={styles.cancelBtn} disabled={true}>
                          {order.orderRejectReason}
                        </button>
                      )}
                  </div>

                  {/* 카드 바디 */}
                  <div className={styles.cardBody}>
                    <div className={styles.row}>
                      <span className={styles.rowLabel}>주문 유형</span>
                      <span className={styles.rowVal}>
                        {TYPE_LABEL[order.orderType] ?? order.orderType}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span className={styles.rowLabel}>주문 수량</span>
                      <span className={styles.rowVal}>
                        {order.quantity.toLocaleString()}주
                      </span>
                    </div>
                    {order.orderType === "LIMIT" && order.limitPrice && (
                      <div className={styles.row}>
                        <span className={styles.rowLabel}>주문 가격</span>
                        <span className={styles.rowVal}>
                          {fmtMoney(order.limitPrice)}
                        </span>
                      </div>
                    )}
                    {order.executedQuantity > 0 && (
                      <>
                        <div className={styles.row}>
                          <span className={styles.rowLabel}>체결 수량</span>
                          <span className={styles.rowVal}>
                            {order.executedQuantity.toLocaleString()}주
                          </span>
                        </div>
                        <div className={styles.row}>
                          <span className={styles.rowLabel}>체결 가격</span>
                          <span className={styles.rowVal}>
                            {fmtMoney(order.executedPrice)}
                          </span>
                        </div>
                        <div className={`${styles.row} ${styles.totalRow}`}>
                          <span className={styles.rowLabel}>체결 금액</span>
                          <span
                            className={styles.rowVal}
                            style={{
                              fontWeight: 700,
                              color: isBuy ? "var(--red)" : "var(--blue)",
                            }}
                          >
                            {isBuy ? "−" : "+"}
                            {fmtMoney(execAmt)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className={`${styles.row} ${styles.dateRow}`}>
                      <span className={styles.rowLabel}>주문 시각</span>
                      <span className={`${styles.rowVal} ${styles.dateVal}`}>
                        {fmtInstant(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 무한 스크롤 센티넬 */}
        {hasMore && (
          <div ref={loaderRef} className={styles.loadMore}>
            <div className="spinner" style={{ width: 24, height: 24 }} />
          </div>
        )}

        {!hasMore && !loading && filtered.length > PAGE_SIZE && (
          <div className={styles.endMsg}>모든 거래 내역을 불러왔습니다.</div>
        )}
      </div>
    </div>
  );
}
