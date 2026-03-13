import axios from "axios";

const spring = axios.create({
  baseURL: import.meta.env.VITE_SPRING_URL || "http://localhost:8080",
  withCredentials: true,
  timeout: 10000,
});

// 401 → 세션 만료 처리
spring.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // 세션 만료: auth store 초기화는 각 컴포넌트에서 처리
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(err);
  },
);

/* ── Auth ─────────────────────────────────────────────────────────── */
export const login = (email, password) =>
  spring.post("/api/v1/auth/login", { email, password }).then((r) => r.data);

export const signup = (email, password, userName, phoneNumber) =>
  spring
    .post("/api/v1/auth/signup", { email, password, userName, phoneNumber })
    .then((r) => r.data);

export const logout = () =>
  spring.post("/api/v1/auth/logout").then((r) => r.data);

/* ── Account ──────────────────────────────────────────────────────── */
export const getMyAccount = () =>
  spring.get("/api/v1/accounts/me").then((r) => r.data);

export const setPrincipal = (principal) =>
  spring
    .put("/api/v1/accounts/set-principal", { principal })
    .then((r) => r.data);

export const getMyHoldings = () =>
  spring.get("/api/v1/accounts/me/holdings").then((r) => r.data);

/* ── Orders ───────────────────────────────────────────────────────── */
export const placeOrder = (
  stockCode,
  orderSide,
  orderType,
  quantity,
  limitPrice,
) =>
  spring
    .post("/api/v1/orders", {
      stockCode,
      orderSide, // 'BUY' | 'SELL'
      orderType, // 'MARKET' | 'LIMIT'
      quantity,
      limitPrice: limitPrice ?? null,
    })
    .then((r) => r.data);

export const getMyOrders = () =>
  spring.get("/api/v1/orders").then((r) => r.data);

export const cancelOrder = (orderId) =>
  spring.post(`/api/v1/orders/${orderId}/cancel`).then((r) => r.data);

/* ── Stats ────────────────────────────────────────────────────────── */
export const getTopProfitableTrades = () =>
  spring.get("/api/v1/stats/top-profitable").then((r) => r.data);

export const getPopularStocks = () =>
  spring.get("/api/v1/stats/popular-stocks").then((r) => r.data);

export const getHourlyTradeVolume = () =>
  spring.get("/api/v1/stats/admin/hourly-trade-volume").then((r) => r.data);

export const getDailyEfficiency = () =>
  spring.get("/api/v1/stats/daily-efficiency").then((r) => r.data);
