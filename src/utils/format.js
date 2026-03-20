export const fmtPrice = (v) => {
  if (v == null || isNaN(v)) return "-";
  return Number(v).toLocaleString("ko-KR");
};

export const fmtPct = (v) => {
  if (v == null || isNaN(v)) return "-";
  const n = parseFloat(v);
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
};

export const fmtVol = (v) => {
  if (v == null || isNaN(v)) return "-";
  const n = Number(v);
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(1) + "억";
  if (n >= 10_000) return (n / 10_000).toFixed(0) + "만";
  return n.toLocaleString("ko-KR");
};

export const fmtMoney = (v) => {
  if (v == null || isNaN(v)) return "-";
  const n = Number(v);

  return n.toLocaleString("ko-KR") + "원";
};
