// 手数料・純利益・ランク計算
export function calcProfit({ purchasePrice = 0, salePrice = 0, platform = 'ヤフオク', shipping = 210, feeRates = {} }) {
  const rate = (feeRates[platform] ?? (platform === 'Yahoo!フリマ' ? 5 : 10)) / 100;
  const fee = Math.round(salePrice * rate);
  const profit = salePrice - purchasePrice - fee - shipping;
  return { fee, profit };
}

export function daysAgo(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// 却下から40日経過したか
export function isExpiredReject(item) {
  if (item.status !== 'rejected') return false;
  return daysAgo(item.rejectedAt) >= 40;
}
