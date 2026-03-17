import { create } from "zustand";

export const useMarketStore = create((set, get) => ({
  // stockCode -> tick 스냅샷 { price, acmlVol, prdyVrss, prdyVrssSign, prdyCtrt, ... }
  prices: {},
  // 장운영 코드 (종목별)
  mkopCodes: {},
  // PnL 데이터 (Go 서버 PNL_UPDATE 원형 그대로 저장)
  pnlData: null,
  // 최신 체결 이력
  executions: [],

  topChangeRate: [],

  topBuyVolume: [],

  sortedStocks: [],

  setHomeUpdate: ({ topChangeRate, topBuyVolume }) =>
    set({ topChangeRate, topBuyVolume }),

  setSortedStocks: (stocks) => set({ sortedStocks: stocks }),

  // WS PRICE_UPDATE 수신 시 전체 tick 덮어쓰기
  updatePrice: (data) => {
    const {
      stockCode,
      price,
      acmlVol,
      prdyVrss,
      prdyVrssSign,
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
          prdyVrssSign,
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

  // 페이지 진입 시 Redis에서 가져온 초기 가격 seed.
  // 이미 WS로 받은 실시간 데이터가 있으면 덮어쓰지 않는다.
  seedPrice: (stockCode, partialTick) => {
    set((state) => {
      if (state.prices[stockCode]) return state; // 이미 실시간 데이터 있음 → 유지
      return {
        prices: {
          ...state.prices,
          [stockCode]: partialTick,
        },
      };
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

  getPrice: (code) => get().prices[code],

  isMarketOpen: (code) => {
    const mkop = get().mkopCodes[code];
    // "20" = 정규장, 없으면 mock 모드 → 허용
    return !mkop || mkop === "20";
  },
}));
