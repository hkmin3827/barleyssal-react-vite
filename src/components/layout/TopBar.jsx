import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { logout } from "../../api/springApi";
import { useMarketStore } from "../../store/marketStore";
import styles from "./TopBar.module.css";

export default function TopBar() {
  const { isLoggedIn, user, logout: storeLogout } = useAuthStore();
  const executions = useMarketStore((s) => s.executions);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    storeLogout();
    navigate("/login");
  };

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <polyline
                points="22 7 13.5 15.5 8.5 10.5 2 17"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="16 7 22 7 22 13"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className={styles.logoText}>보리쌀 모의투자</span>
        </Link>

        {/* 데스크탑 네비 */}
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
