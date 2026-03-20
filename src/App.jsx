import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import TopBar from "./components/layout/TopBar";
import BottomNav from "./components/layout/BottomNav";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import StocksPage from "./pages/StocksPage";
import WatchlistPage from "./pages/WatchlistPage";
import AccountPage from "./pages/AccountPage";
import TradeHistoryPage from "./pages/TradeHistoryPage";
import StockDetailPage from "./pages/StockDetailPage";
import AdminUserPage from "./pages/AdminUserPage";
import AdminChartPage from "./pages/AdminChartPage";
import RankingPage from "./pages/RankingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Toast from "./components/toast/toast";

function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoggedIn, user } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== "ROLE_ADMIN")
    return <Navigate to="/" replace />;
  return children;
}

function DefaultLayout({ children }) {
  return (
    <>
      <TopBar />
      {children}
      <BottomNav />
    </>
  );
}

export default function App() {
  const storeLogout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const handler = () => storeLogout();
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [storeLogout]);

  return (
    <>
      <Toast />
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminUserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/chart"
            element={
              <ProtectedRoute adminOnly>
                <AdminChartPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/*"
            element={
              <DefaultLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />
                  <Route path="/stocks" element={<StocksPage />} />
                  <Route path="/ranking" element={<RankingPage />} />
                  <Route path="/stock/:code" element={<StockDetailPage />} />
                  <Route
                    path="/trades"
                    element={
                      <ProtectedRoute>
                        <TradeHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/watchlist"
                    element={
                      <ProtectedRoute>
                        <WatchlistPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute>
                        <AccountPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </DefaultLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}
