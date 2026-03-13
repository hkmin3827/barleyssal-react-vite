import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getHourlyTradeVolume, getDailyEfficiency } from "../api/springApi";
import {
  HourlyVolumeChart,
  DailyEfficiencyChart,
} from "../components/stats/AdminCharts";
import styles from "./AdminPage.module.css";

/** Elasticsearch aggregation → chart-ready array */
function parseHourly(rawData) {
  try {
    // ES aggregation raw data — try to extract hourly buckets
    // rawData.hourlyData may be aggregations object
    const agg = rawData?.hourlyData;
    if (!agg) return [];
    // Iterate simple aggregation buckets if already serialised
    const hourly = agg?.hourly_trades?.buckets ?? agg?.buckets ?? [];
    return hourly.map((b) => {
      const hour = (b.key_as_string ?? b.key ?? "").slice(11, 16); // HH:mm
      const sides = b.by_side?.buckets ?? [];
      const buy = sides.find((s) => s.key === "BUY")?.doc_count ?? 0;
      const sell = sides.find((s) => s.key === "SELL")?.doc_count ?? 0;
      return { hour, BUY: buy, SELL: sell };
    });
  } catch {
    return [];
  }
}

function parseDaily(rawData) {
  try {
    const agg = rawData?.dailyEfficiency;
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
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          ←
        </button>
        <span className={styles.title}>관리자 통계</span>
        <span className={styles.badge}>14일</span>
      </div>

      {loading ? (
        <div className="spinner" style={{ marginTop: 60 }} />
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>
                시간대별 매수·매도 건수
              </span>
            </div>
            <div className={styles.card}>
              <HourlyVolumeChart data={hourlyData} />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>일별 체결 건수</span>
            </div>
            <div className={styles.card}>
              <DailyEfficiencyChart data={dailyData} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
