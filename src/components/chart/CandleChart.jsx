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
      grid: {
        vertLines: { color: "#1a1d27" },
        horzLines: { color: "#1a1d27" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "#22263a",
        scaleMargins: { top: 0.1, bottom: 0.3 },
      },
      timeScale: {
        borderColor: "#22263a",
        timeVisible: mode === "intraday",
        secondsVisible: false,
      },
    });

    // Candle series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#ff3d5a",
      downColor: "#3d8bff",
      borderUpColor: "#ff3d5a",
      borderDownColor: "#3d8bff",
      wickUpColor: "#ff3d5a",
      wickDownColor: "#3d8bff",
    });

    // Volume series
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

    // Resize observer
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

  // Init chart
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

  // Update data
  useEffect(() => {
    if (!candleRef.current || !volRef.current || !data.length) return;

    const candles = [];
    const vols = [];

    for (const bar of data) {
      let time;
      if (mode === "intraday") {
        // timestamp is Unix ms → convert to Unix seconds (LWC v5 uses seconds)
        time = bar.timestamp
          ? Math.floor(bar.timestamp / 1000)
          : parseIntraTime(bar.t);
      } else {
        // date = 'YYYYMMDD' → 'YYYY-MM-DD'
        const d = bar.date || bar.t || "";
        time = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
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
    candleRef.current.setData(candles);
    volRef.current.setData(vols);
    chartRef.current?.timeScale().fitContent();
  }, [data, mode]);

  return <div ref={containerRef} className={styles.chart} style={{ height }} />;
}

/** 'YYYYMMDDHHmm' → Unix seconds (KST) */
function parseIntraTime(t) {
  if (!t || t.length < 12) return null;
  const d = new Date(
    `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}T${t.slice(8, 10)}:${t.slice(10, 12)}:00+09:00`,
  );
  return Math.floor(d.getTime() / 1000);
}
