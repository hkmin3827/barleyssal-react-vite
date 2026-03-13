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
      <Link to="/" className={styles.logo}>
        보리쌀
      </Link>

      <div className={styles.right}>
        {executions.length > 0 && (
          <span className={styles.execBadge} title="최근 체결">
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
    </header>
  );
}
