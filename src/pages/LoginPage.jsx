import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, signup, forgotPassword } from "../api/springApi";
import { useAuthStore } from "../store/authStore";
import styles from "./LoginPage.module.css";

function ForgotPasswordPanel({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "이메일 전송에 실패했습니다. 가입된 이메일인지 확인하세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.forgotWrap}>
        <div className={styles.sentIcon}>
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--blue)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h3 className={styles.sentTitle}>이메일을 확인하세요</h3>
        <p className={styles.sentDesc}>
          <strong>{email}</strong>로 비밀번호 재설정 링크를 발송했습니다.
          <br />
          링크는 <strong>10분</strong> 후 만료됩니다.
        </p>
        <button className={styles.backBtn} onClick={onBack}>
          로그인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className={styles.forgotWrap}>
      <button className={styles.backLink} onClick={onBack}>
        ← 로그인으로
      </button>
      <h3 className={styles.forgotTitle}>비밀번호 찾기</h3>
      <p className={styles.forgotDesc}>
        가입 시 사용한 이메일을 입력하면 재설정 링크를 보내드립니다.
      </p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            autoFocus
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? "전송 중..." : "재설정 링크 받기"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const storeLogin = useAuthStore((s) => s.login);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const changeTab = (next) => {
    setMode(next);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let user;
      if (mode === "login") {
        user = await login(email, pw);
      } else {
        if (!name.trim()) {
          setError("이름을 입력하세요.");
          setLoading(false);
          return;
        }
        user = await signup(email, pw, name, phoneNum);
      }
      storeLogin(user);
      if (user?.role === "ROLE_ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (mode === "login"
            ? "로그인 실패. 이메일·비밀번호를 확인하세요."
            : "회원가입 실패. 잠시 후 다시 시도하세요."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>
          보리쌀
        </Link>
        <p className={styles.sub}>주식 모의투자 플랫폼</p>

        {mode === "forgot" ? (
          <ForgotPasswordPanel onBack={() => changeTab("login")} />
        ) : (
          <>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${mode === "login" ? styles.activeTab : ""}`}
                onClick={() => changeTab("login")}
              >
                로그인
              </button>
              <button
                className={`${styles.tab} ${mode === "signup" ? styles.activeTab : ""}`}
                onClick={() => changeTab("signup")}
              >
                회원가입
              </button>
            </div>

            <form onSubmit={submit} className={styles.form}>
              {mode === "signup" && (
                <div className={styles.field}>
                  <label>이름</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    required
                  />
                </div>
              )}
              <div className={styles.field}>
                <label>이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div className={styles.field}>
                <label>비밀번호</label>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {mode === "signup" && (
                <p className={styles.pwMsg}>
                  * 영문, 숫자, 특수문자(~, !, @, #, $, %, ^, &, * 중 하나
                  이상)를 모두 포함하며 8자 이상
                </p>
              )}
              {mode === "signup" && (
                <div className={styles.field}>
                  <label>전화번호</label>
                  <input
                    type="text"
                    value={phoneNum}
                    onChange={(e) => setPhoneNum(e.target.value)}
                    placeholder="010-xxxx-xxxx"
                    required
                  />
                </div>
              )}
              {error && <div className={styles.error}>{error}</div>}
              <button
                type="submit"
                className={styles.submit}
                disabled={loading}
              >
                {loading
                  ? "처리 중..."
                  : mode === "login"
                    ? "로그인"
                    : "회원가입"}
              </button>

              {/* 비밀번호 찾기 링크 (로그인 탭에서만 표시) */}
              {mode === "login" && (
                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={() => changeTab("forgot")}
                >
                  비밀번호를 잊으셨나요?
                </button>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
