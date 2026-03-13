import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, signup } from "../api/springApi";
import { useAuthStore } from "../store/authStore";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const storeLogin = useAuthStore((s) => s.login);
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      navigate("/", { replace: true });
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

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === "login" ? styles.activeTab : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            로그인
          </button>
          <button
            className={`${styles.tab} ${mode === "signup" ? styles.activeTab : ""}`}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
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
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
          </button>
        </form>
      </div>
    </div>
  );
}
