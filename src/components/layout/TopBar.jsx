import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { logout as apiLogout } from "../../api/springApi";
import { useMarketStore } from "../../store/marketStore";
import styles from "./TopBar.module.css";
import logo from "../../assets/barleyssal_logo.svg";

export default function TopBar() {
  const { isLoggedIn, user, logout } = useAuthStore();
  const executions = useMarketStore((s) => s.executions);
  const cancelledExecutions = useMarketStore((s) => s.cancelledExecutions);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiLogout();
      logout();
    } catch {}
    navigate("/login");
  };

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <img src={logo} alt="보리쌀 로고" className={styles.logoImg} />
          </div>
          <span className={styles.logoText}>보리쌀 모의투자</span>
        </Link>

        <nav className={styles.desktopNav}>
          <Link to="/" className={styles.navLink}>
            홈
          </Link>
          <Link to="/stocks" className={styles.navLink}>
            종목
          </Link>
          <Link to="/ranking" className={styles.navLink}>
            랭킹
          </Link>
          <Link to="/account" className={styles.navLink}>
            자산
          </Link>
        </nav>

        <div className={styles.right}>
          {executions.length > 0 && (
            <span className={styles.execBadge}>
              ⚡ {executions[0]?.orderSide === "BUY" ? "매수" : "매도"} 체결
            </span>
          )}
          {cancelledExecutions.length > 0 && (
            <span className={styles.execBadge}>
              ⚡ {cancelledExecutions[0]?.orderSide === "BUY" ? "매수" : "매도"}
              취소됨
            </span>
          )}
          {isLoggedIn ? (
            <>
              <span className={styles.userName}>{user?.userName}</span>
              {user?.role === "ADMIN" && (
                <Link to="/admin" className={styles.adminLink}>
                  관리자
                </Link>
              )}
              <button onClick={handleLogout} className={styles.logoutBtn}>
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className={styles.loginBtn}>
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
