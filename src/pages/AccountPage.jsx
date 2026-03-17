import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useMarketStore } from "../store/marketStore";
import { useWebSocket } from "../hooks/useWebSocket";
import { setPrincipal } from "../api/springApi";
import { getStockName } from "../constants/stocks";
import { fmtMoney, fmtPct } from "../utils/format";
import styles from "./AccountPage.module.css";

// Go 서버 PNL_UPDATE 필드
// pnlData = {
//   type, userId,
//   deposit,             // 예수금
//   principal,           // 원금
//   stockValue,          // 보유 주식 평가금액 합계
//   realtimeTotalEquity, // deposit + stockValue
//   totalPnlAmount,      // 주식 평가손익 합계 (원금 차이 아님)
//   totalPnlRate,        // 전체 수익률 % (원금 기준)
//   holdings: [{
//     stockCode, totalQuantity, avgPrice,
//     currentPrice, holdValue, pnlAmount, pnlRate
//   }],
//   ts
// }

export default function AccountPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();

  // Go WS PNL_UPDATE 수신 → marketStore에 저장
  const pnlData = useMarketStore((s) => s.pnlData);

  // 원금 설정 (Spring API 유지)
  const [setPrinMode, setSetPrinMode] = useState(false);
  const [prinInput, setPrinInput] = useState("");
  const [prinLoading, setPrinLoading] = useState(false);
  const [prinError, setPrinError] = useState("");

  // WS 계좌 구독 — SUBSCRIBE_ACCOUNT 전송 → Go가 PNL_UPDATE 즉시 푸시
  useWebSocket([], { subscribeAccount: true });

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  const handleSetPrincipal = useCallback(async () => {
    const val = Number(prinInput);
    if (!val || val <= 0 || val % 10 !== 0) {
      setPrinError("10원 단위의 양수 원금을 입력하세요.");
      return;
    }
    setPrinLoading(true);
    setPrinError("");
    try {
      await setPrincipal(val);
      setSetPrinMode(false);
      setPrinInput("");
      // Spring 업데이트 후 Redis sync → 다음 PNL_UPDATE에 반영됨
    } catch (e) {
      setPrinError(e.response?.data?.message || "설정 실패");
    } finally {
      setPrinLoading(false);
    }
  }, [prinInput]);

  // ── pnlData 대기 중 스피너 ───────────────────────────────────────────
  if (!pnlData) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>내 자산</h1>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: 60,
            }}
          >
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  // ── 표시 값 (Go PNL_UPDATE 그대로 사용) ────────────────────────────
  const {
    deposit,
    principal,
    stockValue,
    realtimeTotalEquity, // deposit + stockValue
    totalPnlAmount, // 주식 평가손익 합계
    totalPnlRate,
    holdings = [],
  } = pnlData;

  // 자산 분포: 총 자산(realtimeTotalEquity) 기준으로 각 비중 계산
  const distribution = [
    ...holdings
      .filter((h) => h.holdValue > 0)
      .map((h) => ({
        name: getStockName(h.stockCode),
        value: h.holdValue,
      })),
    { name: "예수금", value: deposit },
  ]
    .filter((d) => d.value > 0)
    .map((d) => ({
      ...d,
      pct:
        realtimeTotalEquity > 0
          ? ((d.value / realtimeTotalEquity) * 100).toFixed(1)
          : "0",
    }));

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>내 자산</h1>
        </div>

        {/* 상단 자산 카드 그리드 */}
        <div className={styles.summaryGrid}>
          {/* 총 자산 */}
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
            <div className={styles.totalValue}>
              {fmtMoney(realtimeTotalEquity)}
            </div>
            <div className={styles.totalSub}>
              평가금액 {fmtMoney(stockValue)}
            </div>
          </div>

          {/* 투자금액 (원금) */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardLabel}>투자금액</div>
            <div className={styles.infoCardValue}>{fmtMoney(principal)}</div>
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

          {/* 총 손익 — 주식 평가손익 합계 (원금-예수금 차이 아님) */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardLabel}>총 손익</div>
            <div
              className={styles.infoCardValue}
              style={{
                color: totalPnlAmount >= 0 ? "var(--red)" : "var(--blue)",
              }}
            >
              {totalPnlAmount >= 0 ? "+" : ""}
              {fmtMoney(totalPnlAmount)}
            </div>
            <div
              className={styles.infoCardSub}
              style={{
                color: totalPnlRate >= 0 ? "var(--red)" : "var(--blue)",
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
                {totalPnlRate >= 0 ? (
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
              {fmtPct(totalPnlRate)}
            </div>
          </div>

          {/* 예수금 */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardLabel}>예수금</div>
            <div className={styles.infoCardValue}>{fmtMoney(deposit)}</div>
            <div className={styles.infoCardSub}>
              {realtimeTotalEquity > 0
                ? ((deposit / realtimeTotalEquity) * 100).toFixed(1)
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
                  <div className={styles.distAmt}>{fmtMoney(d.value)}</div>
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
                      {getStockName(h.stockCode)}
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
                    <span>{(h.totalQuantity ?? 0).toLocaleString()}주</span>
                  </div>
                  <div className={styles.holdingDetail}>
                    <span>평균 단가</span>
                    <span>{fmtMoney(h.avgPrice ?? 0)}</span>
                  </div>
                  <div className={styles.holdingDetail}>
                    <span>평가 금액</span>
                    <span>{fmtMoney(h.holdValue ?? 0)}</span>
                  </div>
                  <div className={styles.holdingDetail}>
                    <span>평가 손익</span>
                    <span
                      style={{
                        color:
                          (h.pnlAmount ?? 0) >= 0
                            ? "var(--red)"
                            : "var(--blue)",
                        fontWeight: 600,
                      }}
                    >
                      {(h.pnlAmount ?? 0) >= 0 ? "+" : ""}
                      {fmtMoney(h.pnlAmount ?? 0)}
                      {h.pnlRate != null && (
                        <span style={{ marginLeft: 4, fontSize: 12 }}>
                          ({h.pnlRate >= 0 ? "+" : ""}
                          {h.pnlRate.toFixed(2)}%)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
