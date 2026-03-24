import { create } from "zustand";

export const useMarketStore = create((set, get) => ({
  prices: {}, // stockInfo 스냅샷

  liveBars: {},

  mkopCodes: {},
  pnlData: null,
  executions: [],

  cancelledExecutions: [],

  topChangeRate: [],

  topBuyVolume: [],

  sortedStocks: [],

  setHomeUpdate: ({ topChangeRate, topBuyVolume }) =>
    set({ topChangeRate, topBuyVolume }),

  setSortedStocks: (stocks) => set({ sortedStocks: stocks }),

  updatePrice: (data) => {
    const {
      stockCode,
      price,
      acmlVol,
      prdyVrss,
      prdyCtrt,
      askp1,
      bidp1,
      stckOprc,
      stckHgpr,
      stckLwpr,
      cntgVol,
      acmlTrPbmn,
      cttr,
      selnCntgCsnu,
      shnuCntgCsnu,
      mkopCode,
    } = data;

    set((state) => ({
      prices: {
        ...state.prices,
        [stockCode]: {
          price,
          acmlVol,
          prdyVrss,
          prdyCtrt,
          askp1,
          bidp1,
          stckOprc,
          stckHgpr,
          stckLwpr,
          cntgVol,
          acmlTrPbmn,
          cttr,
          selnCntgCsnu,
          shnuCntgCsnu,
          mkopCode,
          ts: data.ts,
        },
      },
    }));

    if (mkopCode) {
      set((state) => ({
        mkopCodes: { ...state.mkopCodes, [stockCode]: mkopCode },
      }));
    }
  },

  updateLiveBar: (stockCode, ohlcv) => {
    if (!stockCode || !ohlcv) return;
    set((state) => ({
      liveBars: { ...state.liveBars, [stockCode]: ohlcv },
    }));
  },

  seedPrice: (stockCode, partialTick) => {
    set((state) => {
      const next = { ...state };
      if (!state.prices[stockCode]) {
        next.prices = { ...state.prices, [stockCode]: partialTick };
      }
      if (partialTick.mKopCode && !state.mkopCodes[stockCode]) {
        next.mkopCodes = {
          ...state.mkopCodes,
          [stockCode]: partialTick.mKopCode,
        };
      }
      return next;
    });
  },

  updateMkopCode: (stockCode, code) =>
    set((state) => ({
      mkopCodes: { ...state.mkopCodes, [stockCode]: code },
    })),

  setPnlData: (data) => set({ pnlData: data }),

  addExecution: (exec) =>
    set((state) => ({
      executions: [exec, ...state.executions].slice(0, 20),
    })),

  addCancelledExecution: (exec) =>
    set((state) => ({
      cancelledExecutions: [exec, ...state.cancelledExecutions].slice(0, 20),
    })),

  getPrice: (code) => get().prices[code],

  isMarketOpen: (code) => {
    const mkop = get().mkopCodes[code];
    return !mkop || mkop[0] === "2";
  },
  clearUserData: () =>
    set({
      pnlData: null,
      executions: [],
      cancelledExecutions: [],
    }),
}));
