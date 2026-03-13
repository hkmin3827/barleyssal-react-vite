import { useState, useMemo } from "react";
import { STOCKS } from "../constants/stocks";
import StockRow from "../components/stock/StockRow";
import styles from "./StocksPage.module.css";

export default function StocksPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name"); // 'name' | 'change' | 'vol'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STOCKS.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.code.includes(q),
    );
  }, [query]);

  return (
    <div className={styles.page}>
      {/* Search */}
      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.input}
          placeholder="종목명 또는 코드 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => setQuery("")}>
            ✕
          </button>
        )}
      </div>

      {/* Sort tabs */}
      <div className={styles.sortRow}>
        {[
          { key: "name", label: "종목명" },
          { key: "change", label: "등락률" },
          { key: "vol", label: "거래량" },
        ].map((t) => (
          <button
            key={t.key}
            className={`${styles.sortBtn} ${sort === t.key ? styles.sortActive : ""}`}
            onClick={() => setSort(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className={styles.listHeader}>
        <span>종목</span>
        <span>현재가 / 등락률 / 거래량</span>
      </div>

      {/* List */}
      <div className={styles.list}>
        {filtered.map((s) => (
          <StockRow key={s.code} code={s.code} name={s.name} />
        ))}
      </div>
    </div>
  );
}
