import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useMarketStore } from "../store/marketStore";
import { getMyAccount, setPrincipal } from "../api/springApi";
import { fmtMoney, fmtPct } from "../utils/format";
import styles from "./AccountPage.module.css";

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const pnlData = useMarketStore((s) => s.pnlData);

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

  const displayDeposit = pnlData?.deposit ?? Number(account?.deposit ?? 0);
  const displayPrincipal =
    pnlData?.principal ?? Number(account?.principal ?? 0);
  const displayEquity = pnlData?.realtimeTotalEquity ?? displayDeposit;
  const displayPnlRate = pnlData?.totalPnlRate ?? 0;
  const displayPnlAmt = pnlData?.totalPnlAmount ?? 0;
  const holdings = pnlData?.holdings ?? [];

  // 자산 분포 계산
  const totalHoldingVal = holdings.reduce(
    (s, h) => s + (h.evaluatedAmount ?? 0),
    0,
  );
  const distribution = [
    ...holdings.map((h) => ({
      name: h.stockName ?? h.stockCode,
      value: h.evaluatedAmount ?? 0,
      pct:
        displayEquity > 0
          ? ((h.evaluatedAmount / displayEquity) * 100).toFixed(1)
          : "0",
    })),
    {
      name: "현금",
      value: displayDeposit,
      pct:
        displayEquity > 0
          ? ((displayDeposit / displayEquity) * 100).toFixed(1)
          : "0",
    },
  ].filter((d) => d.value > 0);

  if (loading)
    return (
      <div className={styles.page}>
        <div className="spinner" />
      </div>
    );

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>내 자산</h1>

        {/* 상단 자산 카드 그리드 */}
        <div className={styles.summaryGrid}>
          {/* 총 자산 - 파란 카드 */}
          <div className={styles.totalCard}>
            <div className={styles.totalLabel}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              총 자산
            </div>
            <div className={styles.totalValue}>{fmtMoney(displayEquity)}원</div>
            <div className={styles.totalSub}>
              평가금액 {fmtMoney(totalHoldingVal)}원
            </div>
          </div>

          {/* 투자금액 */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardLabel}>투자금액</div>
            <div className={styles.infoCardValue}>
              {fmtMoney(displayPrincipal)}원
            </div>
            <div className={styles.infoCardSub}>원금</div>
            {!setPrinMode ? (
              <button
                className={styles.setPrinBtn}
                onClick={() => setSetPrinMode(true)}
              >
                원금 설정
              </button>
            ) : (
              <div className={styles.setPrinWrap}>
                <input
                  className={styles.setPrinInput}
                  type="number"
                  value={prinInput}
                  onChange={(e) => setPrinInput(e.target.value)}
                  placeholder="원금 입력"
                />
                {prinError && (
                  <div className={styles.setPrinError}>{prinError}</div>
                )}
                <div className={styles.setPrinBtns}>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => {
                      setSetPrinMode(false);
                      setPrinError("");
                    }}
                  >
                    취소
                  </button>
                  <button
                    className={styles.confirmBtn}
                    onClick={handleSetPrincipal}
                    disabled={prinLoading}
                  >
                    {prinLoading ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 총 손익 */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardLabel}>총 손익</div>
            <div
              className={styles.infoCardValue}
              style={{
                color: displayPnlAmt >= 0 ? "var(--red)" : "var(--blue)",
              }}
            >
              {displayPnlAmt >= 0 ? "+" : ""}
              {fmtMoney(displayPnlAmt)}원
            </div>
            <div
              className={styles.infoCardSub}
              style={{
                color: displayPnlRate >= 0 ? "var(--red)" : "var(--blue)",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {displayPnlRate >= 0 ? (
                  <>
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </>
                ) : (
                  <>
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                    <polyline points="17 18 23 18 23 12" />
                  </>
                )}
              </svg>
              {fmtPct(displayPnlRate)}
            </div>
          </div>

          {/* 보유 현금 */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardLabel}>보유 현금</div>
            <div className={styles.infoCardValue}>
              {fmtMoney(displayDeposit)}원
            </div>
            <div className={styles.infoCardSub}>
              {displayEquity > 0
                ? ((displayDeposit / displayEquity) * 100).toFixed(1)
                : "0"}
              %
            </div>
          </div>
        </div>

        {/* 자산 분포 */}
        {distribution.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              자산 분포
            </div>
            <div className={styles.distGrid}>
              {distribution.map((d) => (
                <div key={d.name} className={styles.distItem}>
                  <div className={styles.distName}>{d.name}</div>
                  <div className={styles.distPct}>{d.pct}%</div>
                  <div className={styles.distAmt}>{fmtMoney(d.value)}원</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 보유 종목 */}
        <div className={styles.sectionTitle}>보유 종목</div>
        {holdings.length === 0 ? (
          <div className={styles.empty}>보유 종목이 없습니다.</div>
        ) : (
          <div className={styles.holdingGrid}>
            {holdings.map((h) => (
              <div
                key={h.stockCode}
                className={styles.holdingCard}
                onClick={() => navigate(`/stock/${h.stockCode}`)}
              >
                <div className={styles.holdingTop}>
                  <div>
                    <div className={styles.holdingName}>
                      {h.stockName ?? h.stockCode}
                    </div>
                    <div className={styles.holdingCode}>{h.stockCode}</div>
                  </div>
                  <div className={styles.holdingRight}>
                    <div className={styles.holdingPrice}>
                      {(h.currentPrice ?? h.avgPrice ?? 0).toLocaleString()}원
                    </div>
                    {h.pnlRate != null && (
                      <div
                        className={`${styles.holdingRate} ${h.pnlRate >= 0 ? "up" : "down"}`}
                      >
                        {h.pnlRate >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(h.pnlRate).toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.holdingDetails}>
                  <div className={styles.holdingDetail}>
                    <span>보유 수량</span>
                    <span>{(h.quantity ?? 0).toLocaleString()}주</span>
                  </div>
                  <div className={styles.holdingDetail}>
                    <span>평균 단가</span>
                    <span>{fmtMoney(h.avgPrice ?? 0)}원</span>
                  </div>
                  <div className={styles.holdingDetail}>
                    <span>평가 금액</span>
                    <span>{fmtMoney(h.evaluatedAmount ?? 0)}원</span>
                  </div>
                  {h.pnlAmount != null && (
                    <div className={styles.holdingDetail}>
                      <span>평가 손익</span>
                      <span
                        style={{
                          color:
                            h.pnlAmount >= 0 ? "var(--red)" : "var(--blue)",
                          fontWeight: 600,
                        }}
                      >
                        {h.pnlAmount >= 0 ? "+" : ""}
                        {fmtMoney(h.pnlAmount)}원
                        {h.pnlRate != null && (
                          <span style={{ marginLeft: 4, fontSize: 12 }}>
                            ({h.pnlRate >= 0 ? "+" : ""}
                            {h.pnlRate.toFixed(2)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
