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
import AdminPage from "./pages/AdminPage";
import RankingPage from "./pages/RankingPage";

function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoggedIn, user } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const storeLogout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const handler = () => storeLogout();
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [storeLogout]);

  return (
    <BrowserRouter>
      <TopBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/stocks" element={<StocksPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
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
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
