import { useNavigate } from "react-router-dom";
import { useMarketStore } from "../../store/marketStore";
import { fmtPrice, fmtPct, prdySign, signStr } from "../../utils/format";
import styles from "./StockRow.module.css";

export default function StockRow({ code, name }) {
  const navigate = useNavigate();
  const tick = useMarketStore((s) => s.prices[code]);
  const dir = prdySign(tick?.prdyVrssSign);

  return (
    <div className={styles.row} onClick={() => navigate(`/stock/${code}`)}>
      <div className={styles.left}>
        <div className={styles.name}>{name}</div>
        <div className={styles.code}>{code}</div>
      </div>
      <div className={styles.center}>
        {tick?.acmlVol ? (
          <span className={styles.vol}>
            거래량: {tick.acmlVol.toLocaleString()}
          </span>
        ) : null}
        {tick?.prdyVrss ? (
          <span className={`${styles.diff} ${dir}`}>
            {tick.prdyVrss > 0 ? "+" : ""}
            {tick.prdyVrss.toLocaleString()}원
          </span>
        ) : null}
      </div>
      <div className={styles.right}>
        <div className={styles.price}>
          {tick ? `${fmtPrice(tick.price)}원` : "—"}
        </div>
        <div className={`${styles.rate} ${dir}`}>
          {tick
            ? `${signStr(tick.prdyVrssSign)} ${fmtPct(tick.prdyCtrt)}`
            : "—"}
        </div>
      </div>
    </div>
  );
}
