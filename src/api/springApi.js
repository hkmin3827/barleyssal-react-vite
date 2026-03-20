import axios from "axios";
import { useToastStore } from "../store/toastStore";

const spring = axios.create({
  baseURL: import.meta.env.VITE_SPRING_URL || "http://localhost:8080",
  withCredentials: true,
  timeout: 10000,
});

export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
};

let isLoggingOut = false;

let csrfInitPromise = null;

function ensureCsrfToken() {
  if (getCookie("XSRF-TOKEN")) return Promise.resolve();
  if (!csrfInitPromise) {
    csrfInitPromise = spring.get("/api/v1/auth/csrf").finally(() => {
      csrfInitPromise = null;
    });
  }
  return csrfInitPromise;
}

export const initCsrfToken = () => ensureCsrfToken();

spring.interceptors.request.use(
  async (config) => {
    const isMutating = ["post", "put", "patch", "delete"].includes(
      config.method,
    );

    const isAuthPath =
      config.url.includes("/api/v1/auth/signup") ||
      config.url.includes("/api/v1/auth/login") ||
      config.url.includes("/api/v1/auth/password/forget") ||
      config.url.includes("/api/v1/password/reset");

    if (isMutating && !isAuthPath) {
      await ensureCsrfToken();
      const csrfToken = getCookie("XSRF-TOKEN");
      if (csrfToken) {
        config.headers["X-XSRF-TOKEN"] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    console.error("❌ Axios Request Error:", error);
    return Promise.reject(error);
  },
);
spring.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status;
    const data = err.response?.data;

    const { addToast } = useToastStore.getState();

    if (status === 401) {
      if (!isLoggingOut) {
        isLoggingOut = true;
        window.dispatchEvent(new Event("auth:expired"));
        logout().finally(() => {
          isLoggingOut = false;
        });
      }
      return Promise.reject(err);
    }

    const serverMessage = data?.message || "요청 처리 중 오류가 발생했습니다.";

    if (status === 429) {
      addToast(
        serverMessage || "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
        "warn",
      );
      return Promise.reject(err);
    }

    if (status >= 500) {
      addToast(
        serverMessage || "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        "error",
      );
      return Promise.reject(err);
    }

    if (status >= 400 && status < 500) {
      addToast(
        serverMessage ||
          "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        "error",
      );
    }
    return Promise.reject(err);
  },
);

export const login = (email, password) =>
  spring.post("/api/v1/auth/login", { email, password }).then((r) => r.data);

export const signup = (email, password, userName, phoneNumber) =>
  spring
    .post("/api/v1/auth/signup", { email, password, userName, phoneNumber })
    .then((r) => r.data);

export const logout = () =>
  spring.post("/api/v1/auth/logout").then((r) => r.data);

export const forgotPassword = (email) =>
  spring.post("/api/v1/auth/password/forgot", { email }).then((r) => r.data);

export const resetPassword = (resetToken, newPassword) =>
  spring
    .post("/api/v1/auth/password/reset", { resetToken, newPassword })
    .then((r) => r.data);

// ---------------------------------------------------------------

export const getMyAccount = () =>
  spring.get("/api/v1/accounts/me").then((r) => r.data);

export const setPrincipal = (principal) =>
  spring
    .put("/api/v1/accounts/set-principal", { principal })
    .then((r) => r.data);

export const getMyHoldings = () =>
  spring.get("/api/v1/accounts/me/holdings").then((r) => r.data);

// ---------------------------------------------------------------

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
      orderSide,
      orderType,
      quantity,
      limitPrice: limitPrice ?? null,
    })
    .then((r) => r.data);

export const getMyOrders = () =>
  spring.get("/api/v1/orders").then((r) => r.data);

export const cancelOrder = (orderId) =>
  spring.post(`/api/v1/orders/${orderId}/cancel`).then((r) => r.data);

// ---------------------------------------------------------------

export const getWatchlist = () =>
  spring.get("/api/v1/watchlist").then((r) => r.data);

export const addToWatchlist = (stockCode, stockName) =>
  spring
    .post(`/api/v1/watchlist/${stockCode}`, { stockName })
    .then((r) => r.data);

export const removeFromWatchlist = (stockCode) =>
  spring.delete(`/api/v1/watchlist/${stockCode}`).then((r) => r.data);

export const toggleWatchlist = (stockCode, stockName) =>
  spring
    .post(`/api/v1/watchlist/${stockCode}/toggle`, { stockName })
    .then((r) => r.data);

// ---------------------------------------------------------------

export const getTopProfitableTrades = () =>
  spring.get("/api/v1/stats/top-profitable").then((r) => r.data);

export const getPopularStocks = () =>
  spring.get("/api/v1/stats/popular-stocks").then((r) => r.data);

export const getHourlyTradeVolume = () =>
  spring.get("/api/v1/stats/admin/hourly-trade-volume").then((r) => r.data);

export const getDailyEfficiency = () =>
  spring.get("/api/v1/stats/daily-efficiency").then((r) => r.data);

// ---------------------------------------------------------------

export const getAdminUsers = (active, page = 0, size = 10) =>
  spring
    .get("/api/v1/admin/users", { params: { active, page, size } })
    .then((r) => r.data);

export const getAdminUserDetail = (userId) =>
  spring.get(`/api/v1/admin/users/${userId}`).then((r) => r.data);

export const activateAdminUser = (userId) =>
  spring.patch(`/api/v1/admin/users/${userId}/activate`).then((r) => r.data);

export const deactivateAdminUser = (userId) =>
  spring.patch(`/api/v1/admin/users/${userId}/deactivate`).then((r) => r.data);
