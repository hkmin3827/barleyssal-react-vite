import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { logout as apiLogout } from "../../api/springApi";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const storeLogout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
    } finally {
      storeLogout();
      navigate("/login", { replace: true });
    }
  };

  const isUsers =
    location.pathname === "/admin" || location.pathname === "/admin/";
  const isChart = location.pathname.startsWith("/admin/chart");

  return (
    <div className={styles.root}>
      {/* 상단 바 */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* 로고 */}
          <div className={styles.logo}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            보리쌀 관리자
          </div>

          <nav className={styles.tabs}>
            <button
              className={`${styles.tab} ${isUsers ? styles.active : ""}`}
              onClick={() => navigate("/admin")}
            >
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              유저관리
            </button>
            <button
              className={`${styles.tab} ${isChart ? styles.active : ""}`}
              onClick={() => navigate("/admin/chart")}
            >
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
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              차트
            </button>
          </nav>

          <button className={styles.logoutBtn} onClick={handleLogout}>
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            로그아웃
          </button>
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
