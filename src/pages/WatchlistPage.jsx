import { useWatchlistStore } from "../store/watchlistStore";
import { useNavigate } from "react-router-dom";
import { useMarketStore } from "../store/marketStore";
import { fmtPrice, fmtPct, prdySign, signStr } from "../utils/format";
import { useWebSocket } from "../hooks/useWebSocket";
import styles from "./WatchlistPage.module.css";

function WatchRow({ code, name }) {
  const navigate = useNavigate();
  const tick = useMarketStore((s) => s.prices[code]);
  const { remove } = useWatchlistStore();
  const dir = prdySign(tick?.prdyVrssSign);
  return (
    <div className={styles.row}>
      <div
        className={styles.rowMain}
        onClick={() => navigate(`/stock/${code}`)}
      >
        <div className={styles.rowLeft}>
          <div className={styles.rowName}>{name}</div>
          <div className={styles.rowCode}>{code}</div>
        </div>
        <div className={styles.rowRight}>
          <div className={styles.rowPrice}>
            {tick ? `${fmtPrice(tick.price)}원` : "—"}
          </div>
          <div className={`${styles.rowRate} ${dir}`}>
            {tick
              ? `${signStr(tick.prdyVrssSign)} ${fmtPct(tick.prdyCtrt)}`
              : "—"}
          </div>
        </div>
      </div>
      <button
        className={styles.removeBtn}
        onClick={() => remove(code)}
        title="관심 해제"
      >
        ✕
      </button>
    </div>
  );
}

export default function WatchlistPage() {
  const items = useWatchlistStore((s) => s.items);
  useWebSocket({
    stocks: items.map((i) => i.code ?? i),
    subscribeAccount: false,
  });
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.title}>관심 종목</span>
          <span className={styles.count}>{items.length}개</span>
        </div>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>☆</div>
            <div className={styles.emptyText}>관심 종목이 없습니다.</div>
            <div className={styles.emptySub}>
              종목 페이지에서 ★ 버튼을 눌러 추가하세요.
            </div>
          </div>
        ) : (
          <div className={styles.list}>
            {items.map((item) => {
              const code = item.code ?? item;
              const name = item.name ?? code;
              return <WatchRow key={code} code={code} name={name} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
