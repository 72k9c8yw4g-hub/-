// 手数料・純利益・ランク計算
export function calcItem(item, config) {
  const { feeRates = { ヤフオク: 10, 'Yahoo!フリマ': 5 }, shipping = 210, thresholds = { honmei: 500, jikken: 80 }, costLimit = 4000 } = config || {};

  const feeRate = (feeRates[item.platform] ?? 10) / 100;
  const fee = Math.round((item.expectedPrice || 0) * feeRate);
  const profit = (item.expectedPrice || 0) - (item.cost || 0) - fee - (item.shipping ?? shipping);

  let rank;
  if ((item.cost || 0) > costLimit) {
    rank = 'over';
  } else if (profit >= thresholds.honmei) {
    rank = 'honmei';
  } else if (profit >= thresholds.jikken) {
    rank = 'jikken';
  } else {
    rank = 'taishougai';
  }

  return { fee, profit, rank };
}

export const RANK_LABEL = {
  over:       { label: '上限オーバー',     color: 'rank-over',       badge: '⚠️ 却下推奨' },
  honmei:     { label: '本命',             color: 'rank-honmei',     badge: '★ 本命' },
  jikken:     { label: '実験枠',           color: 'rank-jikken',     badge: '◎ 実験枠' },
  taishougai: { label: '対象外',           color: 'rank-taishougai', badge: '— 対象外' },
};

export const STATUS_COLORS = {
  '買い候補': 'status-buy',
  '保留':     'status-hold',
  '却下':     'status-reject',
};

export function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
