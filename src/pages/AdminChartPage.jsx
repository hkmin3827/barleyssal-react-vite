import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getHourlyTradeVolume, getDailyEfficiency } from "../api/springApi";
import {
  HourlyVolumeChart,
  DailyEfficiencyChart,
} from "../components/stats/AdminCharts";
import AdminLayout from "../components/admin/AdminLayout";
import styles from "./AdminChartPage.module.css";

function parseHourly(raw) {
  try {
    const buckets = raw?.hourlyData;
    if (!Array.isArray(buckets)) return [];
    const map = new Map();
    for (const b of buckets) {
      const hour = (b.hour ?? "").slice(11, 16);
      const prev = map.get(hour) ?? { BUY: 0, SELL: 0 };
      map.set(hour, {
        BUY: prev.BUY + (b.bySide?.BUY ?? 0),
        SELL: prev.SELL + (b.bySide?.SELL ?? 0),
      });
    }
    return Array.from(map.entries()).map(([hour, v]) => ({ hour, ...v }));
  } catch {
    return [];
  }
}

function parseDaily(raw) {
  try {
    const buckets = raw?.dailyEfficiency;
    if (!Array.isArray(buckets)) return [];
    return buckets.map((b) => ({
      date: (b.date ?? "").slice(0, 10),
      executedCount: b.executedOrders ?? 0,
      totalCount: b.totalOrders ?? 0,
      rate: b.executionRate ?? 0,
    }));
  } catch {
    return [];
  }
}

export default function AdminChartPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "ROLE_ADMIN") {
      navigate("/");
      return;
    }
    Promise.all([getHourlyTradeVolume(), getDailyEfficiency()])
      .then(([h, d]) => {
        setHourlyData(parseHourly(h));
        setDailyData(parseDaily(d));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AdminLayout>
      <div className={styles.inner}>
        <div className={styles.pageHeader}>
          <span className={styles.title}>거래 통계</span>
          <span className={styles.badge}>14일</span>
        </div>
        {loading ? (
          <div className="spinner" />
        ) : (
          <div className={styles.box}>
            <div className={styles.section}>
              <div className={styles.titleRow}>
                <div className={styles.sectionTitle}>
                  시간대별 매수·매도 건수
                </div>
                <span className={styles.subLabel}>
                  Elasticsearch 기반 · 최근 14일
                </span>
              </div>
              <HourlyVolumeChart data={hourlyData} />
            </div>
            <div className={styles.section}>
              <div className={styles.titleRow}>
                <div className={styles.sectionTitle}>일별 체결 건수</div>
                <span className={styles.subLabel}>
                  Elasticsearch 기반 · 최근 14일
                </span>
              </div>
              <DailyEfficiencyChart data={dailyData} />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
