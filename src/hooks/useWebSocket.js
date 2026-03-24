import { useEffect, useRef } from "react";
import { useMarketStore } from "../store/marketStore";
import { useAuthStore } from "../store/authStore";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:4000/ws";

let ws = null;
let refCount = 0;
let pingTimer = null;
let reconnectTimer = null;
const listeners = new Set();

function notifyListeners(msg) {
  listeners.forEach((fn) => fn(msg));
}

function wsSend(msg) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function connect() {
  if (
    ws &&
    (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)
  ) {
    return;
  }

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("✅ WS Connected:", WS_URL);
    clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) wsSend({ type: "PING" });
    }, 30000);
    notifyListeners({ type: "__WS_OPEN__" });
  };

  ws.onmessage = (e) => {
    try {
      notifyListeners(JSON.parse(e.data));
    } catch {
      // ignore parse errors
    }
  };

  ws.onclose = () => {
    clearInterval(pingTimer);
    notifyListeners({ type: "__WS_CLOSE__" });
    if (refCount > 0) {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 3000);
    }
  };

  ws.onerror = () => {};
}

function disconnect() {
  clearTimeout(reconnectTimer);
  clearInterval(pingTimer);
  if (!ws) return;
  if (ws.readyState === WebSocket.OPEN) {
    ws.close();
  } else if (ws.readyState === WebSocket.CONNECTING) {
    ws.onopen = () => ws.close();
  }
  ws = null;
}

export { wsSend };

/**
 * @param {string[]} symbols
 * @param {{ subscribeAccount?: boolean }} options
 */
export function useWebSocket(symbols = [], { subscribeAccount = false } = {}) {
  const {
    updatePrice,
    updateMkopCode,
    updateLiveBar,
    setPnlData,
    addExecution,
    addCancelledExecution,
    setHomeUpdate,
  } = useMarketStore();
  const { user } = useAuthStore();

  const symbolsRef = useRef(symbols);
  symbolsRef.current = symbols;

  useEffect(() => {
    refCount++;
    if (refCount === 1) connect();

    const handler = (msg) => {
      switch (msg.type) {
        case "__WS_OPEN__":
          // 재연결 시에도 구독 복원
          if (symbolsRef.current.length > 0) {
            wsSend({ type: "SUBSCRIBE_PRICE", symbols: symbolsRef.current });
          }
          if (user?.id) {
            wsSend({ type: "IDENTIFY_USER", userId: String(user.id) });
          }
          if (subscribeAccount && user?.id) {
            wsSend({ type: "SUBSCRIBE_ACCOUNT", userId: String(user.id) });
          }
          break;

        case "PRICE_UPDATE":
          updatePrice(msg);
          if (msg.mkopCode) updateMkopCode(msg.stockCode, msg.mkopCode);
          if (msg.ohlcv) updateLiveBar(msg.stockCode, msg.ohlcv);
          break;

        case "home_update":
          setHomeUpdate({
            topChangeRate: msg.topChangeRate ?? [],
            topBuyVolume: msg.topBuyVolume ?? [],
          });
          break;

        case "PNL_UPDATE":
          setPnlData(msg);
          break;

        case "EXECUTION":
          addExecution(msg);
          break;

        case "ORDER_CANCELLED":
          addCancelledExecution(msg);
      }
    };

    listeners.add(handler);

    if (ws?.readyState === WebSocket.OPEN) {
      if (symbolsRef.current.length > 0) {
        wsSend({ type: "SUBSCRIBE_PRICE", symbols: symbolsRef.current });
      }
      if (user?.id) {
        wsSend({ type: "IDENTIFY_USER", userId: String(user.id) });
      }
      if (subscribeAccount && user?.id) {
        wsSend({ type: "SUBSCRIBE_ACCOUNT", userId: String(user.id) });
      }
    }

    return () => {
      listeners.delete(handler);
      refCount--;
      if (refCount <= 0) {
        refCount = 0;
        setTimeout(() => {
          if (refCount === 0) disconnect();
        }, 1000);
      }
    };
  }, [user?.id, subscribeAccount]);

  useEffect(() => {
    if (ws?.readyState === WebSocket.OPEN && symbols.length > 0) {
      wsSend({ type: "SUBSCRIBE_PRICE", symbols });
    }

    return () => {};
  }, [JSON.stringify(symbols)]);
}
