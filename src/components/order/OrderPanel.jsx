import { useState, useEffect } from "react";
import { useMarketStore } from "../../store/marketStore";
import { fmtPrice } from "../../utils/format";
import { placeOrder } from "../../api/springApi";
import { getStockName } from "../../constants/stocks";
import styles from "./OrderPanel.module.css";

/**
 * 피그마 디자인 기반 주문 패널
 * desktop: rightCol에 sticky card
 * mobile: 하단 바 + sheet
 */
export default function OrderPanel({
  stockCode,
  tick,
  isOpen,
  onSuccess,
  mobile = false,
}) {
  const [side, setSide] = useState("BUY");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPrice = tick?.price ?? 0;
  const estTotal = qty > 0 ? currentPrice * qty : 0;

  const handleSubmit = async () => {
    if (!isOpen) {
      setError("장 운영 시간이 아닙니다.");
      return;
    }
    if (!qty || qty <= 0) {
      setError("수량을 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await placeOrder(stockCode, side, "MARKET", qty, null);
      onSuccess?.(result);
      setMobileOpen(false);
      setQty(1);
    } catch (e) {
      setError(
        e.response?.data?.message || "주문 실패. 잠시 후 다시 시도하세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  const panel = (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>주문하기</h3>

      {/* 매수/매도 탭 */}
      <div className={styles.sideTabs}>
        <button
          className={`${styles.sideTab} ${side === "BUY" ? styles.buyActive : ""}`}
          onClick={() => {
            setSide("BUY");
            setError("");
          }}
        >
          매수
        </button>
        <button
          className={`${styles.sideTab} ${side === "SELL" ? styles.sellActive : ""}`}
          onClick={() => {
            setSide("SELL");
            setError("");
          }}
        >
          매도
        </button>
      </div>

      {/* 호가 정보 */}
      <div className={styles.infoList}>
        {[
          ["현재가", tick ? `${currentPrice.toLocaleString()}원` : "-"],
          [
            "시가",
            tick?.stckOprc ? `${tick.stckOprc.toLocaleString()}원` : "-",
          ],
          [
            "고가",
            tick?.stckHgpr ? `${tick.stckHgpr.toLocaleString()}원` : "-",
            "var(--red)",
          ],
          [
            "저가",
            tick?.stckLwpr ? `${tick.stckLwpr.toLocaleString()}원` : "-",
            "var(--blue)",
          ],
          [
            "거래량",
            tick?.acmlVol ? `${tick.acmlVol.toLocaleString()}주` : "-",
          ],
        ].map(([label, val, color]) => (
          <div key={label} className={styles.infoRow}>
            <span className={styles.infoLabel}>{label}</span>
            <span
              className={styles.infoVal}
              style={color ? { color, fontWeight: 600 } : {}}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      {/* 수량 */}
      <div className={styles.qtySection}>
        <div className={styles.qtyLabel}>주문 수량</div>
        <div className={styles.qtyRow}>
          <button
            className={styles.qtyBtn}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            -
          </button>
          <input
            className={styles.qtyInput}
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <button
            className={styles.qtyBtn}
            onClick={() => setQty((q) => q + 1)}
          >
            +
          </button>
        </div>
      </div>

      {/* 총액 */}
      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>주문 총액</span>
        <span className={styles.totalVal}>{estTotal.toLocaleString()}원</span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* 주문 버튼 */}
      <button
        className={`${styles.orderBtn} ${side === "BUY" ? styles.orderBuyBtn : styles.orderSellBtn}`}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <span className="spinner-sm" />
        ) : (
          `${side === "BUY" ? "매수" : "매도"} 주문`
        )}
      </button>
      <div className={styles.disclaimer}>
        모의투자이므로 실제 거래가 발생하지 않습니다.
      </div>
    </div>
  );

  // 모바일: 하단 고정 바 + 슬라이드업 시트
  if (mobile) {
    return (
      <>
        <div className={styles.mobileBar}>
          <button
            className={styles.mobileBuyBtn}
            onClick={() => {
              setSide("BUY");
              setMobileOpen(true);
            }}
          >
            매수
          </button>
          <button
            className={styles.mobileSellBtn}
            onClick={() => {
              setSide("SELL");
              setMobileOpen(true);
            }}
          >
            매도
          </button>
        </div>
        {mobileOpen && (
          <>
            <div
              className={styles.backdrop}
              onClick={() => setMobileOpen(false)}
            />
            <div className={styles.sheet}>{panel}</div>
          </>
        )}
      </>
    );
  }

  return <div className={styles.stickyWrap}>{panel}</div>;
}
