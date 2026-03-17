import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import styles from "./CandleChart.module.css";

/**
 * @param {{
 *   data: Array<{t?:string, date?:string, o:number, h:number, l:number, c:number, v:number, timestamp?:number}>,
 *   mode: 'intraday'|'period',
 *   height?: number
 * }} props
 */
export default function CandleChart({
  data = [],
  mode = "intraday",
  height = 340,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const volRef = useRef(null);

  const buildSeries = useCallback(() => {
    if (!containerRef.current) return;
    // destroy previous
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#7a8099",
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "#22263a",
        scaleMargins: { top: 0.1, bottom: 0.3 },
      },
      timeScale: {
        barSpacing: 12,
        rightOffset: 5,
        borderColor: "#22263a",
        timeVisible: mode === "intraday",
        secondsVisible: false,
        fixLeftEdge: true,
        // fixRightEdge: true,
      },
      localization: {
        // timeFormatter: (tick) => {
        //   // tick은 Unix 타임스탬프(초)입니다.
        //   // new Date(ms) 객체는 생성 시점의 브라우저 로컬 타임존을 따릅니다.
        // return new Date(tick * 1000).toLocaleString();
        // },
        timeFormatter: (businessDayOrTimestamp) => {
          if (!businessDayOrTimestamp) return "";
          // intraday 모드일 때는 숫자(timestamp)가 들어옴
          if (typeof businessDayOrTimestamp === "number") {
            const date = new Date(businessDayOrTimestamp * 1000);
            // KST(+9) 오프셋을 이미 적용한 timestamp이므로, getUTC 메서드를 사용해 문자열을 만듭니다.
            const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
            const dd = String(date.getUTCDate()).padStart(2, "0");
            const hh = String(date.getUTCHours()).padStart(2, "0");
            const min = String(date.getUTCMinutes()).padStart(2, "0");
            return `${mm}/${dd} ${hh}:${min}`;
          }
          // period(일봉) 모드일 때는 문자열('YYYY-MM-DD')이 들어옴
          return String(businessDayOrTimestamp);
        },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#ff3d5a",
      downColor: "#3d8bff",
      borderUpColor: "#ff3d5a",
      borderDownColor: "#3d8bff",
      wickUpColor: "#ff3d5a",
      wickDownColor: "#3d8bff",
    });

    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volRef.current = volSeries;

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    });
    ro.observe(containerRef.current);
    chart._roCleanup = () => ro.disconnect();
  }, [height, mode]);

  useEffect(() => {
    buildSeries();
    return () => {
      if (chartRef.current) {
        chartRef.current._roCleanup?.();
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [buildSeries]);

  useEffect(() => {
    if (!candleRef.current || !volRef.current || !data.length) return;

    const candles = [];
    const vols = [];

    const tzOffsetSec = new Date().getTimezoneOffset() * 60;

    for (const bar of data) {
      let time;
      if (mode === "intraday") {
        let utcTime;
        if (bar.timestamp) {
          utcTime = Math.floor(bar.timestamp / 1000);
        } else {
          utcTime = parseIntraTime(bar.t);
        }
        if (!utcTime) continue;

        time = utcTime - tzOffsetSec;
      } else {
        // [수정 포인트] 일봉(period) 모드 날짜 파싱
        const d = bar.date || bar.t || "";

        if (d.includes("-")) {
          // 1. 이미 'YYYY-MM-DD' 형식인 경우 (수정된 Go 서버 데이터)
          time = d;
        } else if (d.length >= 8) {
          // 2. 'YYYYMMDD' 형식인 경우 (기존 노드 서버 또는 API 원본)
          time = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
        } else {
          continue; // 날짜 형식이 잘못된 데이터는 스킵
        }
      }
      if (!time) continue;

      const o = Number(bar.o ?? bar.open ?? 0);
      const h = Number(bar.h ?? bar.high ?? 0);
      const l = Number(bar.l ?? bar.low ?? 0);
      const c = Number(bar.c ?? bar.close ?? 0);
      const v = Number(bar.v ?? bar.volume ?? 0);

      candles.push({ time, open: o, high: h, low: l, close: c });
      vols.push({
        time,
        value: v,
        color: c >= o ? "rgba(255,61,90,0.35)" : "rgba(61,139,255,0.35)",
      });
    }

    if (!candles.length) return;

    candles.sort((a, b) => {
      const t1 =
        typeof a.time === "string" ? new Date(a.time).getTime() : a.time;
      const t2 =
        typeof b.time === "string" ? new Date(b.time).getTime() : b.time;
      return t1 - t2;
    });
    vols.sort((a, b) => {
      const t1 =
        typeof a.time === "string" ? new Date(a.time).getTime() : a.time;
      const t2 =
        typeof b.time === "string" ? new Date(b.time).getTime() : b.time;
      return t1 - t2;
    });

    const uniqueCandles = Array.from(
      new Map(candles.map((item) => [item.time, item])).values(),
    );
    const uniqueVols = Array.from(
      new Map(vols.map((item) => [item.time, item])).values(),
    );

    candleRef.current.setData(uniqueCandles);
    volRef.current.setData(uniqueVols);

    const timeScale = chartRef.current.timeScale();
    const VISIBLE_CANDLES = 30;
    if (uniqueCandles.length > VISIBLE_CANDLES) {
      timeScale.setVisibleLogicalRange({
        from: uniqueCandles.length - VISIBLE_CANDLES,
        to: uniqueCandles.length - 1,
      });
    } else {
      timeScale.fitContent();
    }
  }, [data, mode]);

  return <div ref={containerRef} className={styles.chart} style={{ height }} />;
}

/** 'YYYYMMDDHHmm' → Unix seconds (KST) */
function parseIntraTime(t) {
  if (!t || t.length < 12) return null;
  // 서버에서 받은 시간(t)이 UTC 기준이므로, 'Z'를 붙여 파싱합니다.
  const d = new Date(
    `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}T${t.slice(8, 10)}:${t.slice(10, 12)}:00Z`,
  );
  return Math.floor(d.getTime() / 1000);
}
