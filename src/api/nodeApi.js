import axios from "axios";

const node = axios.create({
  baseURL: import.meta.env.VITE_NODE_URL || "http://localhost:4000",
  timeout: 30000,
});

/* ── Market ──────────────────────────────────────────────────────── */
export const getPrice = (stockCode) =>
  node.get(`/api/market/price/${stockCode}`).then((r) => r.data);

export const getBatchPrices = (symbols) =>
  node.post("/api/market/prices/batch", { symbols }).then((r) => r.data);

export const searchStocks = (q, limit = 20) =>
  node.get("/api/market/search", { params: { q, limit } }).then((r) => r.data);

export const getAccountPnl = (userId) =>
  node.get(`/api/market/account/pnl/${userId}`).then((r) => r.data);

/* ── Chart ───────────────────────────────────────────────────────── */
/**
 * 분봉 차트 데이터
 * @param {string} stockCode
 * @param {'1m'|'5m'|'10m'|'30m'} timeframe
 * @param {number} limit
 */
export const getIntradayChart = (stockCode, timeframe = "1m", limit = 200) =>
  node
    .get(`/api/chart/intraday/${stockCode}`, { params: { timeframe, limit } })
    .then((r) => r.data);

/**
 * 기간 차트 데이터 (일/주/월/년)
 * @param {string} stockCode
 * @param {'D'|'W'|'M'|'Y'} period
 */
export const getPeriodChart = (stockCode, period = "D") =>
  node
    .get(`/api/chart/period/${stockCode}`, { params: { period } })
    .then((r) => r.data);
