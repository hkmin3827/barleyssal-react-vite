import { useWatchlistStore } from "../store/watchlistStore";
import StockRow from "../components/stock/StockRow";
import styles from "./WatchlistPage.module.css";

export default function WatchlistPage() {
  const items = useWatchlistStore((s) => s.items);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.title}>관심 종목</span>
        <span className={styles.count}>{items.length}개</span>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>★</div>
          <p>관심 종목이 없습니다.</p>
          <p className={styles.emptyHint}>
            종목 리스트에서 ★을 눌러 추가하세요.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((s) => (
            <StockRow key={s.code} code={s.code} name={s.name} />
          ))}
        </div>
      )}
    </div>
  );
}
