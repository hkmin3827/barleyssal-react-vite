import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useMarketStore } from "../store/marketStore";
import { getMyAccount, setPrincipal } from "../api/springApi";
import HoldingCard from "../components/account/HoldingCard";
import { fmtMoney, fmtPct } from "../utils/format";
import styles from "./AccountPage.module.css";

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const pnlData = useMarketStore((s) => s.pnlData);
  const executions = useMarketStore((s) => s.executions);

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setPrinMode, setSetPrinMode] = useState(false);
  const [prinInput, setPrinInput] = useState("");
  const [prinLoading, setPrinLoading] = useState(false);
  const [prinError, setPrinError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    getMyAccount()
      .then(setAccount)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const handleSetPrincipal = async () => {
    const val = Number(prinInput);
    if (!val || val <= 0 || val % 10 !== 0) {
      setPrinError("10원 단위의 양수 원금을 입력하세요.");
      return;
    }
    setPrinLoading(true);
    setPrinError("");
    try {
      const updated = await setPrincipal(val);
      setAccount(updated);
      setSetPrinMode(false);
      setPrinInput("");
    } catch (e) {
      setPrinError(e.response?.data?.message || "설정 실패");
    } finally {
      setPrinLoading(false);
    }
  };

  // Use pnlData (WS) if available, else fall back to REST account
  const displayDeposit = pnlData?.deposit ?? Number(account?.deposit ?? 0);
  const displayPrincipal =
    pnlData?.principal ?? Number(account?.principal ?? 0);
  const displayEquity = pnlData?.realtimeTotalEquity ?? displayDeposit;
  const displayPnlRate = pnlData?.totalPnlRate ?? 0;
  const displayPnlAmt = pnlData?.totalPnlAmount ?? 0;
  const holdings = pnlData?.holdings ?? [];

  if (loading)
    return (
      <div className={styles.page}>
        <div className="spinner" />
      </div>
    );

  return (
    <div className={styles.page}>
      {/* 계좌 요약 카드 */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryTop}>
          <span className={styles.summaryLabel}>총 자산</span>
          <span className={styles.equityVal + " num"}>
            {fmtMoney(displayEquity)}
          </span>
        </div>

        <div className={styles.pnlRow}>
          <span
            className={`${styles.pnlRate} num ${displayPnlRate >= 0 ? "up" : "down"}`}
          >
            {displayPnlRate >= 0 ? "+" : ""}
            {fmtPct(displayPnlRate)}
          </span>
          <span
            className={`${styles.pnlAmt} num ${displayPnlRate >= 0 ? "up" : "down"}`}
          >
            {displayPnlAmt >= 0 ? "+" : ""}
            {fmtMoney(displayPnlAmt)}
          </span>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>예수금</span>
            <span className="num">{fmtMoney(displayDeposit)}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>원금</span>
            <span className="num">{fmtMoney(displayPrincipal)}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>주식 평가</span>
            <span className="num">{fmtMoney(pnlData?.stockValue ?? 0)}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>보유종목</span>
            <span className="num">{holdings.length}개</span>
          </div>
        </div>

        <button
          className={styles.setPrinBtn}
          onClick={() => setSetPrinMode((v) => !v)}
        >
          원금 설정
        </button>

        {setPrinMode && (
          <div className={styles.prinForm}>
            <input
              className={styles.prinInput}
              type="number"
              placeholder="원금 입력 (10원 단위)"
              value={prinInput}
              onChange={(e) => setPrinInput(e.target.value)}
            />
            {prinError && <div className={styles.prinError}>{prinError}</div>}
            <div className={styles.prinBtns}>
              <button
                className={styles.prinCancel}
                onClick={() => {
                  setSetPrinMode(false);
                  setPrinError("");
                }}
              >
                취소
              </button>
              <button
                className={styles.prinConfirm}
                onClick={handleSetPrincipal}
                disabled={prinLoading}
              >
                {prinLoading ? "저장 중..." : "확인"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 최근 체결 */}
      {executions.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>최근 체결</span>
          </div>
          <div className={styles.execList}>
            {executions.slice(0, 5).map((e, i) => (
              <div key={e.orderId ?? i} className={styles.execRow}>
                <span
                  className={`${styles.execSide} ${e.orderSide === "BUY" ? styles.buy : styles.sell}`}
                >
                  {e.orderSide === "BUY" ? "매수" : "매도"}
                </span>
                <span className={styles.execCode}>{e.stockCode}</span>
                <span className="num" style={{ marginLeft: "auto" }}>
                  {Number(e.executedPrice).toLocaleString()}원 ·{" "}
                  {Number(e.executedQuantity).toLocaleString()}주
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 보유 종목 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>보유 종목</span>
          <span className={styles.holdCount}>{holdings.length}</span>
        </div>
        {holdings.length === 0 ? (
          <div className={styles.empty}>보유 중인 종목이 없습니다.</div>
        ) : (
          <div className={styles.holdingGrid}>
            {holdings.map((h) => (
              <HoldingCard key={h.stockCode} holding={h} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
