export const PLATFORMS = ['メルカリ', 'Yahoo!フリマ'];

export const DEFAULT_FEE_RATES = { メルカリ: 10, 'Yahoo!フリマ': 5 };

export function calcProfit({ purchasePrice = 0, salePrice = 0, platform = 'メルカリ', shipping = 210, feeRates = {} }) {
  const rate = (feeRates[platform] ?? DEFAULT_FEE_RATES[platform] ?? 10) / 100;
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

export function isExpiredReject(item) {
  if (item.status !== 'rejected') return false;
  return daysAgo(item.rejectedAt) >= 40;
}
