import { useMemo } from 'react';
import { calcItem } from '../lib/calc.js';

export default function AnalyticsTab({ items, config }) {
  const stats = useMemo(() => {
    const results = items.map(i => ({ ...i, ...calcItem(i, config) }));

    const high   = results.filter(i => i.profit >= 500).length;
    const mid    = results.filter(i => i.profit >= 80 && i.profit < 500).length;
    const low    = results.filter(i => i.profit < 80).length;
    const over   = results.filter(i => i.rank === 'over').length;

    const decided = results.filter(i => i.outcome === '成功' || i.outcome === '失敗');
    const success = decided.filter(i => i.outcome === '成功').length;
    const successRate = decided.length ? Math.round(success / decided.length * 100) : null;

    const byStatus = {
      '買い候補': results.filter(i => i.status === '買い候補').length,
      '保留':     results.filter(i => i.status === '保留').length,
      '却下':     results.filter(i => i.status === '却下').length,
    };

    const totalProfit = results.filter(i => i.status === '買い候補').reduce((s, i) => s + i.profit, 0);

    return { high, mid, low, over, successRate, success, decided: decided.length, byStatus, totalProfit, total: results.length };
  }, [items, config]);

  return (
    <div className="flex flex-col gap-4 fade-in">
      {/* 成功率 */}
      <div className="glass rounded-2xl p-5">
        <div className="text-xs font-semibold text-slate-400 mb-3" style={{fontFamily:'var(--font-ja)'}}>買い候補の成功率</div>
        {stats.successRate !== null ? (
          <div className="flex items-end gap-3">
            <span className="font-mono text-4xl font-bold holo-text">{stats.successRate}%</span>
            <span className="text-sm text-slate-400 mb-1" style={{fontFamily:'var(--font-ja)'}}>{stats.success} / {stats.decided} 件</span>
          </div>
        ) : (
          <div className="text-slate-400 text-sm" style={{fontFamily:'var(--font-ja)'}}>まだ結果データがありません</div>
        )}
      </div>

      {/* 利益分布 */}
      <div className="glass rounded-2xl p-5">
        <div className="text-xs font-semibold text-slate-400 mb-3" style={{fontFamily:'var(--font-ja)'}}>利益分布（全{stats.total}件）</div>
        <div className="flex flex-col gap-3">
          <Bar label="高 ≥ ¥500" count={stats.high} total={stats.total} color="#16a34a" />
          <Bar label="中 ¥80–499" count={stats.mid} total={stats.total} color="#ca8a04" />
          <Bar label="低 < ¥80" count={stats.low} total={stats.total} color="#9ca3af" />
          {stats.over > 0 && <Bar label="上限オーバー" count={stats.over} total={stats.total} color="#dc2626" />}
        </div>
      </div>

      {/* ステータス別 */}
      <div className="glass rounded-2xl p-5">
        <div className="text-xs font-semibold text-slate-400 mb-3" style={{fontFamily:'var(--font-ja)'}}>ステータス別</div>
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="買い候補" value={stats.byStatus['買い候補']} color="#1d4ed8" bg="#dbeafe" />
          <StatBox label="保留" value={stats.byStatus['保留']} color="#92400e" bg="#fef3c7" />
          <StatBox label="却下" value={stats.byStatus['却下']} color="#6b7280" bg="#f3f4f6" />
        </div>
      </div>

      {/* 買い候補合計利益 */}
      <div className="glass rounded-2xl p-5">
        <div className="text-xs font-semibold text-slate-400 mb-2" style={{fontFamily:'var(--font-ja)'}}>買い候補 合計利益（見込み）</div>
        <span className={`font-mono text-3xl font-bold ${stats.totalProfit >= 0 ? 'rank-honmei' : 'rank-over'}`}>
          ¥{stats.totalProfit.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function Bar({ label, count, total, color }) {
  const pct = total ? Math.round(count / total * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-slate-500 w-20 shrink-0" style={{fontFamily:'var(--font-ja)'}}>{label}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`, background:color}} />
      </div>
      <div className="font-mono text-sm font-bold w-8 text-right" style={{color}}>{count}</div>
    </div>
  );
}

function StatBox({ label, value, color, bg }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{background:bg}}>
      <div className="font-mono text-2xl font-bold" style={{color}}>{value}</div>
      <div className="text-xs mt-0.5" style={{color, fontFamily:'var(--font-ja)', opacity:0.8}}>{label}</div>
    </div>
  );
}
