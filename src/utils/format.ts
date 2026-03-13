export const fmtPrice = (n: number) => n.toLocaleString("ko-KR");

export const fmtMoney = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString("ko-KR");
};

export const fmtRate = (r: number) => {
  const sign = r > 0 ? "+" : "";
  return `${sign}${r.toFixed(2)}%`;
};

export const fmtChange = (n: number) => {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("ko-KR")}`;
};

export const priceClr = (n: number) =>
  n > 0 ? "clr-rise" : n < 0 ? "clr-fall" : "clr-flat";

export function getStockCode(raw: string | { value: string }): string {
  return typeof raw === "string" ? raw : raw.value;
}
