import { useState, useEffect } from "react";
import { useMarketStore } from "../../store/marketStore";
import { fmtPrice, fmtMoney } from "../../utils/format";
import { placeOrder } from "../../api/springApi";
import { getStockName } from "../../constants/stocks";
import styles from "./OrderDrawer.module.css";

/**
 * @param {{
 *   stockCode: string,
 *   side: 'BUY'|'SELL',
 *   onClose: () => void,
 *   onSuccess?: (exec: any) => void
 * }} props
 */
export default function OrderDrawer({ stockCode, side, onClose, onSuccess }) {
  const tick = useMarketStore((s) => s.prices[stockCode]);
  const isOpen = useMarketStore((s) => s.isMarketOpen(stockCode));
  const [orderType, setOrderType] = useState("MARKET");
  const [qty, setQty] = useState("");
  const [limitPx, setLimitPx] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentPrice = tick?.price ?? 0;
  const estTotal = (() => {
    const q = parseInt(qty);
    if (!q || q <= 0) return 0;
    const px = orderType === "MARKET" ? currentPrice : Number(limitPx);
    return px * q;
  })();

  const isBuy = side === "BUY";

  // Sync limit price to current price when switching to LIMIT
  useEffect(() => {
    if (orderType === "LIMIT" && currentPrice && !limitPx) {
      setLimitPx(String(currentPrice));
    }
  }, [orderType]);

  const handleSubmit = async () => {
    if (!isOpen) {
      setError("장 운영 시간이 아닙니다.");
      return;
    }
    const q = parseInt(qty);
    if (!q || q <= 0) {
      setError("수량을 입력하세요.");
      return;
    }
    if (orderType === "LIMIT" && (!limitPx || Number(limitPx) <= 0)) {
      setError("지정가를 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await placeOrder(
        stockCode,
        side,
        orderType,
        q,
        orderType === "LIMIT" ? Number(limitPx) : null,
      );
      onSuccess?.(result);
      onClose();
    } catch (e) {
      setError(
        e.response?.data?.message || "주문 실패. 잠시 후 다시 시도하세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop – click to close */}
      <div className={styles.backdrop} onClick={onClose} />

      <div className={`${styles.drawer} ${styles.slideUp}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span
              className={`${styles.sideTag} ${isBuy ? styles.buy : styles.sell}`}
            >
              {isBuy ? "매수" : "매도"}
            </span>
            <span className={styles.stockName}>{getStockName(stockCode)}</span>
            <span className={styles.stockCode}>{stockCode}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Market status warning */}
        {!isOpen && (
          <div className={styles.marketWarn}>
            ⚠ 현재 장 운영 시간이 아닙니다. 주문이 제한됩니다.
          </div>
        )}

        {/* Current price */}
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>현재가</span>
          <span className={`${styles.priceVal} num`}>
            {fmtPrice(currentPrice)}
          </span>
        </div>

        {/* Order type toggle */}
        <div className={styles.typeRow}>
          {["MARKET", "LIMIT"].map((t) => (
            <button
              key={t}
              className={`${styles.typeBtn} ${orderType === t ? styles.typeActive : ""}`}
              onClick={() => setOrderType(t)}
            >
              {t === "MARKET" ? "시장가" : "지정가"}
            </button>
          ))}
        </div>

        {/* Limit price input */}
        {orderType === "LIMIT" && (
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>지정가 (원)</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              value={limitPx}
              onChange={(e) => setLimitPx(e.target.value)}
              placeholder="가격 입력"
            />
          </div>
        )}

        {/* Quantity */}
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>수량 (주)</label>
          <div className={styles.qtyRow}>
            <button
              className={styles.qtyBtn}
              onClick={() =>
                setQty((q) => String(Math.max(0, parseInt(q || 0) - 1)))
              }
            >
              −
            </button>
            <input
              className={`${styles.input} ${styles.qtyInput}`}
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
            />
            <button
              className={styles.qtyBtn}
              onClick={() => setQty((q) => String(parseInt(q || 0) + 1))}
            >
              +
            </button>
          </div>
        </div>

        {/* Estimated total */}
        {estTotal > 0 && (
          <div className={styles.estRow}>
            <span>{isBuy ? "예상 매수 금액" : "예상 매도 금액"}</span>
            <span className="num">{fmtMoney(estTotal)}</span>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {/* Submit */}
        <button
          className={`${styles.submitBtn} ${isBuy ? styles.buyBtn : styles.sellBtn}`}
          onClick={handleSubmit}
          disabled={loading || !isOpen}
        >
          {loading ? "주문 중..." : `${isBuy ? "매수" : "매도"} 주문`}
        </button>
      </div>
    </>
  );
}
