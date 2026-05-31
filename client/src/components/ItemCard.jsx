import { useState } from 'react';
import { calcItem, RANK_LABEL, STATUS_COLORS } from '../lib/calc.js';

const STATUSES  = ['買い候補', '保留', '却下'];
const OUTCOMES  = ['未確定', '成功', '失敗'];

export default function ItemCard({ item, config, myName, onUpdate, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const { fee, profit, rank } = calcItem(item, config);
  const rankInfo = RANK_LABEL[rank];
  const statusColor = STATUS_COLORS[item.status] || 'status-hold';

  const handleStatus = (s) => {
    onUpdate(item.id, { status: s, _action: `判断→${s}` }, myName);
  };
  const handleOutcome = (o) => {
    onUpdate(item.id, { outcome: o, _action: `結果→${o}` }, myName);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden slide-up">
      {/* ── Main row ── */}
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-base leading-tight block truncate" style={{fontFamily:'var(--font-ja)'}}>{item.name}</span>
            <span className="text-xs text-slate-400 mt-0.5 block" style={{fontFamily:'var(--font-ja)'}}>
              {item.platform} · 仕入¥{(item.cost||0).toLocaleString()} · 売¥{(item.expectedPrice||0).toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span key={profit} className={`font-mono font-bold text-lg profit-anim ${rankInfo.color}`}>
              ¥{profit.toLocaleString()}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rankInfo.color.replace('rank-', 'rank-bg-')}`} style={{fontFamily:'var(--font-ja)'}}>
              {rankInfo.badge}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`} style={{fontFamily:'var(--font-ja)'}}>{item.status}</span>
          {item.assignee && <span className="text-xs text-slate-400" style={{fontFamily:'var(--font-ja)'}}>担当: {item.assignee}</span>}
          {item.outcome !== '未確定' && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.outcome === '成功' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`} style={{fontFamily:'var(--font-ja)'}}>{item.outcome}</span>
          )}
          <span className="text-xs text-slate-300 ml-auto">
            {item.createdBy && <span style={{fontFamily:'var(--font-ja)'}}>{item.createdBy}</span>}
            {' · '}
            {item.createdAt ? new Date(item.createdAt).toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) : ''}
          </span>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 flex flex-col gap-3 fade-in">
          {/* 手数料内訳 */}
          <div className="text-xs text-slate-500 grid grid-cols-3 gap-2 text-center" style={{fontFamily:'var(--font-ja)'}}>
            <div><div className="opacity-60">手数料</div><div className="font-mono font-bold text-slate-700">¥{fee.toLocaleString()}</div></div>
            <div><div className="opacity-60">送料</div><div className="font-mono font-bold text-slate-700">¥{(item.shipping ?? config.shipping ?? 210).toLocaleString()}</div></div>
            <div><div className="opacity-60">利益率</div><div className="font-mono font-bold text-slate-700">{item.expectedPrice ? Math.round(profit/item.expectedPrice*100) : 0}%</div></div>
          </div>

          {/* 判断変更 */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1" style={{fontFamily:'var(--font-ja)'}}>判断を変更</div>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button key={s} onClick={() => handleStatus(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${item.status === s ? 'tab-active' : 'btn-ghost'}`}
                  style={{fontFamily:'var(--font-ja)'}}>{s}</button>
              ))}
            </div>
          </div>

          {/* 結果入力 */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1" style={{fontFamily:'var(--font-ja)'}}>結果</div>
            <div className="flex gap-2">
              {OUTCOMES.map(o => (
                <button key={o} onClick={() => handleOutcome(o)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${item.outcome === o ? 'tab-active' : 'btn-ghost'}`}
                  style={{fontFamily:'var(--font-ja)'}}>{o}</button>
              ))}
            </div>
          </div>

          {/* メモ */}
          {item.reason && (
            <div className="text-xs bg-slate-50 rounded-lg px-3 py-2 text-slate-600" style={{fontFamily:'var(--font-ja)'}}>
              <span className="font-semibold text-slate-400">メモ: </span>{item.reason}
            </div>
          )}

          {/* 変更履歴 */}
          {item.history?.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-slate-400 font-semibold" style={{fontFamily:'var(--font-ja)'}}>変更履歴 ({item.history.length})</summary>
              <div className="mt-2 flex flex-col gap-1 max-h-32 overflow-y-auto">
                {[...item.history].reverse().map((h, i) => (
                  <div key={i} className="flex gap-2 text-slate-500">
                    <span className="font-mono text-slate-300 shrink-0">{new Date(h.at).toLocaleString('ja-JP', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                    <span style={{fontFamily:'var(--font-ja)'}}>{h.by} — {h.action}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* 編集・削除 */}
          <div className="flex gap-2 pt-1">
            <button onClick={() => onEdit(item)}
              className="btn-ghost flex-1 py-2 rounded-xl text-xs"
              style={{fontFamily:'var(--font-ja)'}}>編集</button>
            <button onClick={() => { if(confirm('削除しますか？')) onDelete(item.id); }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-500 border border-red-100 transition-colors hover:bg-red-100"
              style={{fontFamily:'var(--font-ja)'}}>削除</button>
          </div>
        </div>
      )}
    </div>
  );
}
