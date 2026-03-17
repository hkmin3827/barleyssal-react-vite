import axios from "axios";

const golang = axios.create({
  baseURL: import.meta.env.VITE_GOLANG_URL,
  timeout: 30000,
});

export const searchStocks = (q, limit = 20) =>
  golang
    .get("/api/market/search", { params: { q, limit } })
    .then((r) => r.data);

export const getAccountPnl = (userId) =>
  golang.get(`/api/market/account/pnl/${userId}`).then((r) => r.data);

export const getSortedStocks = (sort) =>
  golang.get("/api/stocks", { params: { sort } }).then((r) => r.data);

export const getStockInfo = (stockCode) =>
  golang.get(`/api/stocks/info/${stockCode}`).then((r) => r.data);

/**
 * @param {string} stockCode
 * @param {'1m'|'5m'|'10m'|'30m'} timeframe
 * @param {number} limit
 */
export const getIntradayChart = (stockCode, timeframe = "1m", limit = 200) =>
  golang
    .get(`/api/chart/intraday/${stockCode}`, { params: { timeframe, limit } })
    .then((r) => r.data);

/**
 * @param {string} stockCode
 * @param {'D'|'W'|'M'|'Y'} period
 */
export const getPeriodChart = (stockCode, period = "D") =>
  golang
    .get(`/api/chart/period/${stockCode}`, { params: { period } })
    .then((r) => r.data);
