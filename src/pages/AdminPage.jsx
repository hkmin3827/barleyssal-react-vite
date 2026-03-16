import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getHourlyTradeVolume, getDailyEfficiency } from "../api/springApi";
import {
  HourlyVolumeChart,
  DailyEfficiencyChart,
} from "../components/stats/AdminCharts";
import styles from "./AdminPage.module.css";

function parseHourly(raw) {
  try {
    const agg = raw?.hourlyData;
    if (!agg) return [];
    const hourly = agg?.hourly_trades?.buckets ?? agg?.buckets ?? [];
    return hourly.map((b) => {
      const hour = (b.key_as_string ?? b.key ?? "").slice(11, 16);
      const sides = b.by_side?.buckets ?? [];
      return {
        hour,
        BUY: sides.find((s) => s.key === "BUY")?.doc_count ?? 0,
        SELL: sides.find((s) => s.key === "SELL")?.doc_count ?? 0,
      };
    });
  } catch {
    return [];
  }
}

function parseDaily(raw) {
  try {
    const agg = raw?.dailyEfficiency;
    if (!agg) return [];
    const daily = agg?.daily_stats?.buckets ?? agg?.buckets ?? [];
    return daily.map((b) => ({
      date: (b.key_as_string ?? b.key ?? "").slice(0, 10),
      count: b.executed_count?.doc_count ?? b.doc_count ?? 0,
    }));
  } catch {
    return [];
  }
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "ADMIN") {
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
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <button className={styles.back} onClick={() => navigate(-1)}>
            ← 뒤로
          </button>
          <span className={styles.title}>관리자 통계</span>
          <span className={styles.badge}>14일</span>
        </div>
        {loading ? (
          <div className="spinner" />
        ) : (
          <div className={styles.grid}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>시간대별 매수·매도 건수</div>
              <HourlyVolumeChart data={hourlyData} />
            </div>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>일별 체결 건수</div>
              <DailyEfficiencyChart data={dailyData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
