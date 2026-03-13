import { useNavigate } from "react-router-dom";
import { getStockName } from "../../constants/stocks";
import { fmtPrice, fmtMoney, fmtPct } from "../../utils/format";
import styles from "./HoldingCard.module.css";

export default function HoldingCard({ holding }) {
  const navigate = useNavigate();
  const {
    stockCode,
    totalQuantity,
    avgPrice,
    currentPrice,
    holdValue,
    pnlRate,
    pnlAmount,
  } = holding;

  const isUp = pnlRate >= 0;

  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/stock/${stockCode}`)}
    >
      <div className={styles.header}>
        <div>
          <div className={styles.name}>{getStockName(stockCode)}</div>
          <div className={styles.code}>{stockCode}</div>
        </div>
        <div className={`${styles.pnlBadge} ${isUp ? styles.up : styles.down}`}>
          {isUp ? "+" : ""}
          {fmtPct(pnlRate)}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.item}>
          <span className={styles.label}>현재가</span>
          <span className={`${styles.val} num ${isUp ? "up" : "down"}`}>
            {fmtPrice(currentPrice)}
          </span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>평균단가</span>
          <span className={`${styles.val} num`}>{fmtPrice(avgPrice)}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>보유수량</span>
          <span className={`${styles.val} num`}>
            {totalQuantity?.toLocaleString()}주
          </span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>평가금액</span>
          <span className={`${styles.val} num`}>{fmtMoney(holdValue)}</span>
        </div>
      </div>

      <div className={`${styles.pnlRow} ${isUp ? styles.up : styles.down}`}>
        <span>평가손익</span>
        <span className="num">
          {pnlAmount >= 0 ? "+" : ""}
          {fmtMoney(pnlAmount)}
        </span>
      </div>
    </div>
  );
}
