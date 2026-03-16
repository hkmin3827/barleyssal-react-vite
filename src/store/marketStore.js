import { create } from "zustand";

export const useMarketStore = create((set, get) => ({
  // stockCode -> { price, acmlVol, prdyVrss, prdyVrssSign, prdyCtrt, lastMkopCode, ts }
  prices: {},
  // 마지막으로 받은 장운영 코드 (종목별)
  mkopCodes: {},
  // PnL 데이터 (userId별)
  pnlData: null,
  // 최신 체결 이력
  executions: [],

  ranking: [],
  setRanking: (data) => set({ ranking: data }),

  updatePrice: (data) => {
    const {
      stockCode,
      price,
      acmlVol,
      prdyVrss,
      prdyVrssSign,
      prdyCtrt,
      // 선택적 KIS 필드
      askp1,
      bidp1,
      wghnAvrgStckPrc,
      stckOprc,
      stckHgpr,
      stckLwpr,
      cntgVol,
      acmlTrPbmn,
      cttr,
      selnCntgCsnu,
      shnuCntgCsnu,
      ccldDvsn,
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
          wghnAvrgStckPrc,
          stckOprc,
          stckHgpr,
          stckLwpr,
          cntgVol,
          acmlTrPbmn,
          cttr,
          selnCntgCsnu,
          shnuCntgCsnu,
          ccldDvsn,
          mkopCode,
          ts: data.ts,
        },
      },
    }));
    // 장운영 코드도 함께 업데이트
    if (mkopCode) {
      set((state) => ({
        mkopCodes: { ...state.mkopCodes, [stockCode]: mkopCode },
      }));
    }
  },

  updateMkopCode: (stockCode, code) => {
    set((state) => ({
      mkopCodes: { ...state.mkopCodes, [stockCode]: code },
    }));
  },

  setPnlData: (data) => set({ pnlData: data }),

  addExecution: (exec) =>
    set((state) => ({
      executions: [exec, ...state.executions].slice(0, 20),
    })),

  getPrice: (code) => get().prices[code],
  isMarketOpen: (code) => {
    const code_ = get().mkopCodes[code];
    // NEW_MKOP_CLS_CODE "20" = 장중(정규)
    // 없으면(mock mode) 허용
    return !code_ || code_ === "20";
  },
}));
