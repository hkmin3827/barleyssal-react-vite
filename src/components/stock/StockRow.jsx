import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMarketStore } from "../../store/marketStore";
import {
  fmtPrice,
  fmtPct,
  fmtVol,
  prdySign,
  signStr,
} from "../../utils/format";
import { useWatchlistStore } from "../../store/watchlistStore";
import styles from "./StockRow.module.css";

export default function StockRow({ code, name }) {
  const navigate = useNavigate();
  const tick = useMarketStore((s) => s.prices[code]);
  const isWatched = useWatchlistStore((s) => s.isWatched(code));
  const toggle = useWatchlistStore((s) => s.toggle);
  const rowRef = useRef(null);
  const prevPrice = useRef(null);

  // Flash animation on price change
  useEffect(() => {
    if (!tick || !rowRef.current) return;
    if (prevPrice.current !== null && prevPrice.current !== tick.price) {
      const cls =
        tick.price > prevPrice.current ? styles.flashUp : styles.flashDown;
      rowRef.current.classList.remove(styles.flashUp, styles.flashDown);
      void rowRef.current.offsetWidth;
      rowRef.current.classList.add(cls);
      setTimeout(() => rowRef.current?.classList.remove(cls), 600);
    }
    prevPrice.current = tick.price;
  }, [tick?.price]);

  const dir = prdySign(tick?.prdyVrssSign);

  return (
    <div
      ref={rowRef}
      className={styles.row}
      onClick={() => navigate(`/stock/${code}`)}
    >
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.code}>{code}</span>
      </div>

      <div className={styles.nums}>
        <span className={`${styles.price} num ${dir}`}>
          {tick ? fmtPrice(tick.price) : "-"}
        </span>
        <span className={`${styles.change} num ${dir}`}>
          {tick
            ? `${signStr(tick.prdyVrssSign)} ${fmtPct(tick.prdyCtrt)}`
            : "-"}
        </span>
        <span className={`${styles.vol} num`}>
          {tick ? fmtVol(tick.acmlVol ?? tick.volume) : "-"}
        </span>
      </div>

      <button
        className={`${styles.star} ${isWatched ? styles.starred : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          toggle(code, name);
        }}
      >
        ★
      </button>
    </div>
  );
}
