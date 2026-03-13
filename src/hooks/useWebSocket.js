import { useEffect, useRef, useCallback } from "react";
import { useMarketStore } from "../store/marketStore";
import { useAuthStore } from "../store/authStore";
import { STOCKS } from "../constants/stocks";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:4000/ws";
const ALL_CODES = STOCKS.map((s) => s.code);

let wsInstance = null;
let reconnectTimer = null;
let subscribers = 0;
let pingInterval = null;

const listeners = new Set();

function notifyListeners(msg) {
  listeners.forEach((fn) => fn(msg));
}

function connect() {
  if (
    wsInstance &&
    (wsInstance.readyState === WebSocket.CONNECTING ||
      wsInstance.readyState === WebSocket.OPEN)
  ) {
    return;
  }

  wsInstance = new WebSocket(WS_URL);

  wsInstance.onopen = () => {
    console.log("✅ WS Connected to:", WS_URL);
    notifyListeners({ type: "__WS_OPEN__" });
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      if (wsInstance?.readyState === WebSocket.OPEN)
        wsInstance.send(JSON.stringify({ type: "PING" }));
    }, 30000);
  };

  wsInstance.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      notifyListeners(msg);
    } catch (err) {
      console.error("WS Message Parse Error", err);
    }
  };

  wsInstance.onclose = (e) => {
    console.log("⚠️ WS Disconnected", e.reason);
    notifyListeners({ type: "__WS_CLOSE__" });
    clearInterval(pingInterval);
    if (subscribers > 0) {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 3000);
    }
  };

  wsInstance.onerror = (e) => {
    console.error("WS Socket Error");
  };
}

function disconnect() {
  if (!wsInstance) return;
  // 연결 중(0)일 때는 잠시 기다렸다가 닫거나, 단순히 reference 해제
  // 여기서는 강제 종료 시 발생하는 에러를 피하기 위해 OPEN 상태일 때만 close 호출 권장
  if (wsInstance.readyState === WebSocket.OPEN) {
    wsInstance.close();
  } else if (wsInstance.readyState === WebSocket.CONNECTING) {
    // 연결 중일 때는 onopen에서 바로 닫히도록 핸들러를 수정하거나
    // 그냥 두어 자연스럽게 연결되게 한 뒤 다음 unmount 시 처리하게 함
    wsInstance.onopen = () => wsInstance.close();
  }
  wsInstance = null;

  clearTimeout(reconnectTimer);
  clearInterval(pingInterval);
}

export function wsSend(msg) {
  if (wsInstance?.readyState === WebSocket.OPEN) {
    wsInstance.send(JSON.stringify(msg));
  } else {
    console.warn("WS is not open. State:", wsInstance?.readyState);
  }
}

export function useWebSocket(options = {}) {
  const { stocks = ALL_CODES, subscribeAccount = true } = options;

  const { updatePrice, updateMkopCode, setPnlData, addExecution } =
    useMarketStore();
  const { user } = useAuthStore();
  const stocksRef = useRef(stocks);

  useEffect(() => {
    subscribers++;
    if (subscribers === 1) connect();

    const handler = (msg) => {
      switch (msg.type) {
        case "__WS_OPEN__": {
          if (stocksRef.current.length) {
            wsSend({ type: "SUBSCRIBE_PRICE", stocks: stocksRef.current });
          }
          if (subscribeAccount && user?.id) {
            wsSend({ type: "SUBSCRIBE_ACCOUNT", userId: String(user.id) });
          }
          break;
        }
        case "PRICE_UPDATE": {
          updatePrice(msg);
          // 장운영 코드 추출 (NEW_MKOP_CLS_CODE → mkopCode)
          if (msg.mkopCode) {
            updateMkopCode(msg.stockCode, msg.mkopCode);
          }
          break;
        }
        case "PNL_UPDATE": {
          setPnlData(msg);
          break;
        }
        case "EXECUTION": {
          addExecution(msg);
          break;
        }
      }
    };

    listeners.add(handler);

    // Subscribe to stocks
    if (wsInstance?.readyState === WebSocket.OPEN) {
      if (stocks.length) wsSend({ type: "SUBSCRIBE_PRICE", stocks });
      if (subscribeAccount && user?.id)
        wsSend({ type: "SUBSCRIBE_ACCOUNT", userId: String(user.id) });
    }

    return () => {
      listeners.delete(handler);
      subscribers--;
      if (subscribers <= 0) {
        subscribers = 0;
        setTimeout(() => {
          if (subscribers === 0) disconnect();
        }, 100);
      }
    };
  }, [user?.id, subscribeAccount]);

  // Update stocks when they change
  useEffect(() => {
    stocksRef.current = stocks;
    if (stocks.length && wsInstance?.readyState === WebSocket.OPEN) {
      wsSend({ type: "SUBSCRIBE_PRICE", stocks });
    }
  }, [JSON.stringify(stocks)]);

  useEffect(() => {
    if (subscribeAccount && user?.id && wsInstance?.readyState === 1) {
      wsSend({ type: "SUBSCRIBE_ACCOUNT", userId: String(user.id) });
    }
  }, [subscribeAccount, user?.id]);
}
