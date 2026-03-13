export const fmtPrice = (v) => {
  if (v == null || isNaN(v)) return '-';
  return Number(v).toLocaleString('ko-KR');
};

export const fmtPct = (v) => {
  if (v == null || isNaN(v)) return '-';
  const n = parseFloat(v);
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
};

export const fmtVol = (v) => {
  if (v == null || isNaN(v)) return '-';
  const n = Number(v);
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(1) + '억';
  if (n >= 10_000) return (n / 10_000).toFixed(0) + '만';
  return n.toLocaleString('ko-KR');
};

export const fmtMoney = (v) => {
  if (v == null || isNaN(v)) return '-';
  const n = Number(v);
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(1) + '억원';
  if (n >= 10_000) return (n / 10_000).toFixed(0) + '만원';
  return n.toLocaleString('ko-KR') + '원';
};

export const prdySign = (sign) => {
  // 1:상한 2:상승 → up / 3:보합 → flat / 4:하한 5:하락 → down
  if (sign === '1' || sign === '2') return 'up';
  if (sign === '4' || sign === '5') return 'down';
  return 'flat';
};

export const signStr = (sign) => {
  if (sign === '1' || sign === '2') return '▲';
  if (sign === '4' || sign === '5') return '▼';
  return '-';
};
