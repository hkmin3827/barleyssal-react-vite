import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../api/springApi";
import styles from "./ResetPasswordPage.module.css";

function validatePassword(pw, confirm) {
  if (!pw) return "새 비밀번호를 입력하세요.";
  if (pw.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
  if (pw !== confirm) return "비밀번호가 일치하지 않습니다.";
  return null;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validatePassword(newPw, confirmPw);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, newPw);
      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.status === 400 || err.response?.status === 401) {
        setError(
          "링크가 만료되었거나 유효하지 않습니다. 비밀번호 찾기를 다시 시도해 주세요.",
        );
      } else {
        setError(msg || "비밀번호 재설정에 실패했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.successIcon}>
            <svg
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--green)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className={styles.successTitle}>비밀번호 재설정 완료!</h2>
          <p className={styles.successDesc}>
            새 비밀번호로 변경되었습니다.
            <br />
            지금 바로 로그인하세요.
          </p>
          <button
            className={styles.submit}
            onClick={() => navigate("/login", { replace: true })}
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>
          보리쌀
        </Link>
        <p className={styles.sub}>비밀번호 재설정</p>

        <div className={styles.infoBox}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          새로 사용할 비밀번호를 입력해 주세요. (8자 이상)
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>새 비밀번호</label>
            <div className={styles.inputWrap}>
              <input
                type={showPw ? "text" : "password"}
                value={newPw}
                onChange={(e) => {
                  setNewPw(e.target.value);
                  setError("");
                }}
                placeholder="8자 이상 입력"
                required
                autoFocus
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
              >
                {showPw ? (
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
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
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
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {newPw && (
              <div className={styles.strengthBar}>
                <div
                  className={styles.strengthFill}
                  style={{
                    width:
                      newPw.length >= 12
                        ? "100%"
                        : newPw.length >= 8
                          ? "60%"
                          : "30%",
                    background:
                      newPw.length >= 12
                        ? "var(--green)"
                        : newPw.length >= 8
                          ? "var(--blue)"
                          : "var(--red)",
                  }}
                />
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>비밀번호 확인</label>
            <div className={styles.inputWrap}>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => {
                  setConfirmPw(e.target.value);
                  setError("");
                }}
                placeholder="비밀번호를 다시 입력"
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
              >
                {showConfirm ? (
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
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
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
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPw && (
              <span
                className={`${styles.matchHint} ${newPw === confirmPw ? styles.matchOk : styles.matchNo}`}
              >
                {newPw === confirmPw
                  ? "✓ 비밀번호가 일치합니다"
                  : "✗ 비밀번호가 일치하지 않습니다"}
              </span>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>

          <button
            type="button"
            className={styles.cancelLink}
            onClick={() => navigate("/login")}
          >
            로그인으로 돌아가기
          </button>
        </form>
      </div>
    </div>
  );
}
