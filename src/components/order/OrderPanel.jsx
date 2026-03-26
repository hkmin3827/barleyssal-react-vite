import { useState } from "react";
import { placeOrder } from "../../api/springApi";
import styles from "./OrderPanel.module.css";
import { useToastStore } from "../../store/toastStore";

export default function OrderPanel({
  stockCode,
  tick,
  isOpen,
  onSuccess,
  mobile = false,
}) {
  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("MARKET");
  const [qty, setQty] = useState(1);
  const [limitPrice, setLimitPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { addToast } = useToastStore.getState();

  const currentPrice = tick?.price ?? 0;

  const priceForCalc =
    orderType === "LIMIT" ? parseFloat(limitPrice) || 0 : currentPrice;
  const estTotal = qty > 0 ? priceForCalc * qty : 0;
  const neededDepositTotal = qty > 0 ? tick?.stckHgpr * qty : 0;

  const handleSideChange = (newSide) => {
    setSide(newSide);
  };

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    setLimitPrice("");
  };

  const handleLimitPriceChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setLimitPrice(raw);
  };

  const handleSubmit = async () => {
    if (!isOpen) {
      addToast("장 운영 시간이 아닙니다.");
      return;
    }
    if (!qty || qty <= 0) {
      addToast("수량을 입력하세요.");
      return;
    }
    if (orderType === "LIMIT") {
      const lp = parseFloat(limitPrice);
      if (!limitPrice || isNaN(lp) || lp <= 0) {
        addToast("주문 가격을 입력하세요.");
        return;
      }
    }

    setLoading(true);
    try {
      const lp = orderType === "LIMIT" ? parseFloat(limitPrice) : null;
      const result = await placeOrder(stockCode, side, orderType, qty, lp);
      onSuccess?.(result);
      setMobileOpen(false);
      setQty(1);
      setLimitPrice("");
      addToast("주문이 성공적으로 접수되었습니다.", "success");
    } catch (e) {
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
          onClick={() => handleSideChange("BUY")}
        >
          매수
        </button>
        <button
          className={`${styles.sideTab} ${side === "SELL" ? styles.sellActive : ""}`}
          onClick={() => handleSideChange("SELL")}
        >
          매도
        </button>
      </div>

      <div className={styles.orderTypeTabs}>
        <button
          className={`${styles.orderTypeTab} ${orderType === "MARKET" ? styles.orderTypeActive : ""}`}
          onClick={() => handleOrderTypeChange("MARKET")}
        >
          시장가
        </button>
        <button
          className={`${styles.orderTypeTab} ${orderType === "LIMIT" ? styles.orderTypeActive : ""}`}
          onClick={() => handleOrderTypeChange("LIMIT")}
        >
          지정가
        </button>
      </div>

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
            "실시간 체결 거래량",
            tick?.cntgVol ? `${tick.cntgVol.toLocaleString()}주` : "-",
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

      {orderType === "LIMIT" && (
        <div className={styles.priceSection}>
          <div className={styles.priceLabel}>주문 가격</div>
          <div className={styles.priceInputWrap}>
            <input
              className={styles.priceInput}
              type="text"
              inputMode="numeric"
              placeholder={
                currentPrice > 0
                  ? `현재가 ${currentPrice.toLocaleString()}`
                  : "가격 입력"
              }
              value={
                limitPrice ? parseInt(limitPrice, 10).toLocaleString() : ""
              }
              onChange={handleLimitPriceChange}
            />
            <span className={styles.priceUnit}>원</span>
          </div>
          {limitPrice && currentPrice > 0 && (
            <div
              className={`${styles.priceDiff} ${
                parseFloat(limitPrice) > currentPrice
                  ? styles.priceDiffUp
                  : parseFloat(limitPrice) < currentPrice
                    ? styles.priceDiffDown
                    : styles.priceDiffSame
              }`}
            >
              {parseFloat(limitPrice) > currentPrice
                ? `▲ 현재가 대비 +${(parseFloat(limitPrice) - currentPrice).toLocaleString()}원`
                : parseFloat(limitPrice) < currentPrice
                  ? `▼ 현재가 대비 −${(currentPrice - parseFloat(limitPrice)).toLocaleString()}원`
                  : "현재가와 동일"}
            </div>
          )}
        </div>
      )}

      {orderType === "MARKET" && (
        <div className={styles.marketNotice}>
          <span className={styles.marketNoticeIcon}>ℹ</span>
          시장가 주문은 실시간 체결가로 즉시 처리됩니다.
        </div>
      )}

      <div className={styles.qtySection}>
        <div className={styles.qtyLabel}>주문 수량</div>
        <div className={styles.qtyRow}>
          <button
            className={styles.qtyBtn}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
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

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>
          {orderType === "MARKET" ? "예상 주문 총액" : "주문 총액"}
        </span>
        <div className={styles.totalRight}>
          <span className={styles.totalVal}>
            {estTotal > 0 ? estTotal.toLocaleString() : "-"}원
          </span>
          {orderType === "MARKET" && (
            <span className={styles.totalNote}>체결가 기준 변동될 수 있음</span>
          )}
        </div>
      </div>
      {orderType === "MARKET" && side === "BUY" && (
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>필요 예수금 총액</span>
          <div className={styles.totalRight}>
            <span className={styles.totalVal}>
              {neededDepositTotal > 0
                ? neededDepositTotal.toLocaleString()
                : "-"}
              원
            </span>
          </div>
        </div>
      )}

      {!isOpen && (
        <div className={styles.closedNotice}>장 운영 시간이 아닙니다.</div>
      )}
      <div className={styles.closedNotice}>주문 기능 이용이 불가합니다.</div>
      <button
        className={`${styles.orderBtn} ${side === "BUY" ? styles.orderBuyBtn : styles.orderSellBtn}`}
        onClick={handleSubmit}
        // disabled={!isOpen || loading}
        disabled={true}
      >
        {loading ? (
          <span className="spinner-sm" />
        ) : (
          `${side === "BUY" ? "매수" : "매도"} ${orderType === "MARKET" ? "시장가" : "지정가"} 주문`
        )}
      </button>
      <div className={styles.disclaimer}>
        모의투자이므로 실제 거래가 발생하지 않습니다.
      </div>
    </div>
  );

  if (mobile) {
    return (
      <>
        <div className={styles.mobileBar}>
          <button
            className={styles.mobileBuyBtn}
            disabled={!isOpen}
            onClick={() => {
              setSide("BUY");
              setMobileOpen(true);
            }}
          >
            매수
          </button>
          <button
            className={styles.mobileSellBtn}
            disabled={!isOpen}
            onClick={() => {
              setSide("SELL");
              setMobileOpen(true);
            }}
          >
            매도
          </button>
        </div>
        {!isOpen && (
          <div className={styles.mobileClosedNotice}>
            장 운영 시간이 아닙니다.
          </div>
        )}
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
