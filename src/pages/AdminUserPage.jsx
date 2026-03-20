import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  getAdminUsers,
  activateAdminUser,
  deactivateAdminUser,
} from "../api/springApi";
import AdminLayout from "../components/admin/AdminLayout";
import styles from "./AdminUserPage.module.css";

const PAGE_SIZE = 10;

export default function AdminUserPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState(true);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // userId

  useEffect(() => {
    if (user?.role !== "ROLE_ADMIN") {
      navigate("/");
    }
  }, [user]);

  const fetchUsers = useCallback(async (active, pageNum) => {
    setLoading(true);
    try {
      const res = await getAdminUsers(active, pageNum, PAGE_SIZE);
      setUsers(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
      setTotalElements(res.totalElements ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(activeTab, page);
  }, [activeTab, page, fetchUsers]);

  const handleTabChange = (val) => {
    setActiveTab(val);
    setPage(0);
  };

  const handleToggle = async (u) => {
    setActionLoading(u.id);
    try {
      if (u.active) {
        await deactivateAdminUser(u.id);
      } else {
        await activateAdminUser(u.id);
      }
      await fetchUsers(activeTab, page);
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <AdminLayout>
      <div className={styles.inner}>
        <div className={styles.pageHeader}>
          <span className={styles.title}>사용자 관리</span>
          <span className={styles.count}>
            {activeTab ? "활성 : 총 " : "비활성 : 총 "}
            {totalElements.toLocaleString()}명
          </span>
        </div>

        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${activeTab ? styles.filterActive : ""}`}
            onClick={() => handleTabChange(true)}
          >
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            활성 사용자
          </button>
          <button
            className={`${styles.filterTab} ${!activeTab ? styles.filterActive : ""}`}
            onClick={() => handleTabChange(false)}
          >
            <span className={`${styles.dot} ${styles.dotGray}`} />
            비활성 사용자
          </button>
        </div>

        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.loadingArea}>
              <div className="spinner" />
            </div>
          ) : users.length === 0 ? (
            <div className={styles.empty}>
              {activeTab
                ? "활성 사용자가 없습니다."
                : "비활성 사용자가 없습니다."}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>상태</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className={styles.idCell}>#{u.id}</td>
                    <td className={styles.nameCell}>{u.userName}</td>
                    <td className={styles.emailCell}>{u.email}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${u.active ? styles.badgeActive : styles.badgeInactive}`}
                      >
                        {u.active ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`${styles.actionBtn} ${u.active ? styles.deactivateBtn : styles.activateBtn}`}
                        onClick={() => handleToggle(u)}
                        disabled={actionLoading === u.id}
                      >
                        {actionLoading === u.id
                          ? "처리 중..."
                          : u.active
                            ? "비활성화"
                            : "활성화"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ‹
            </button>
            {pages.map((p) => (
              <button
                key={p}
                className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
                onClick={() => setPage(p)}
              >
                {p + 1}
              </button>
            ))}
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
