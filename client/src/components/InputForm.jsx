import { useState, useEffect, useRef } from 'react';
import { calcItem, RANK_LABEL } from '../lib/calc.js';

const PLATFORMS = ['ヤフオク', 'Yahoo!フリマ'];
const STATUSES  = ['買い候補', '保留', '却下'];

export default function InputForm({ config, myName, members, onSubmit, onCancel, initial }) {
  const [form, setForm] = useState({
    name: '',
    cost: '',
    expectedPrice: '',
    platform: 'ヤフオク',
    shipping: config.shipping ?? 210,
    status: '保留',
    reason: '',
    assignee: myName || '',
    ...initial,
  });
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const parsed = {
    ...form,
    cost: parseFloat(form.cost) || 0,
    expectedPrice: parseFloat(form.expectedPrice) || 0,
    shipping: parseFloat(form.shipping) || 0,
  };
  const { fee, profit, rank } = calcItem(parsed, config);
  const rankInfo = RANK_LABEL[rank];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...parsed });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 slide-up">
      {/* 商品名 */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1" style={{fontFamily:'var(--font-ja)'}}>商品名</label>
        <input
          ref={nameRef}
          className="input-field"
          placeholder="例：リザードン VMAX SA"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
        />
      </div>

      {/* 仕入れ価格 / 想定売値 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1" style={{fontFamily:'var(--font-ja)'}}>仕入れ価格 (¥)</label>
          <input
            className="input-field"
            type="number" min="0" inputMode="numeric"
            placeholder="1000"
            value={form.cost}
            onChange={e => set('cost', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1" style={{fontFamily:'var(--font-ja)'}}>想定売値 (¥)</label>
          <input
            className="input-field"
            type="number" min="0" inputMode="numeric"
            placeholder="2000"
            value={form.expectedPrice}
            onChange={e => set('expectedPrice', e.target.value)}
          />
        </div>
      </div>

      {/* 出品先 */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1" style={{fontFamily:'var(--font-ja)'}}>出品先</label>
        <div className="flex gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p} type="button"
              onClick={() => set('platform', p)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.platform === p ? 'tab-active' : 'btn-ghost'}`}
              style={{fontFamily:'var(--font-ja)'}}
            >{p}</button>
          ))}
        </div>
      </div>

      {/* 送料 */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1" style={{fontFamily:'var(--font-ja)'}}>送料 (¥)</label>
        <input
          className="input-field"
          type="number" min="0" inputMode="numeric"
          value={form.shipping}
          onChange={e => set('shipping', e.target.value)}
        />
      </div>

      {/* リアルタイム計算結果 */}
      <div className={`glass rounded-xl p-4 ${rankInfo.color.replace('rank-', 'rank-bg-')}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold opacity-70" style={{fontFamily:'var(--font-ja)'}}>自動計算</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rankInfo.color.replace('rank-', 'rank-bg-')}`} style={{fontFamily:'var(--font-ja)'}}>
            {rankInfo.badge}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs opacity-60 mb-0.5" style={{fontFamily:'var(--font-ja)'}}>手数料</div>
            <div className="font-mono text-sm font-bold">¥{fee.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs opacity-60 mb-0.5" style={{fontFamily:'var(--font-ja)'}}>純利益</div>
            <div key={profit} className={`font-mono text-lg font-bold profit-anim ${rankInfo.color}`}>
              ¥{profit.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-60 mb-0.5" style={{fontFamily:'var(--font-ja)'}}>手数料率</div>
            <div className="font-mono text-sm font-bold">{config.feeRates?.[form.platform] ?? 10}%</div>
          </div>
        </div>
      </div>

      {/* 判断 */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1" style={{fontFamily:'var(--font-ja)'}}>判断</label>
        <div className="flex gap-2">
          {STATUSES.map(s => (
            <button
              key={s} type="button"
              onClick={() => set('status', s)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.status === s ? 'tab-active' : 'btn-ghost'}`}
              style={{fontFamily:'var(--font-ja)'}}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* 担当 */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1" style={{fontFamily:'var(--font-ja)'}}>担当</label>
        <select
          className="input-field"
          value={form.assignee}
          onChange={e => set('assignee', e.target.value)}
          style={{fontFamily:'var(--font-ja)'}}
        >
          <option value="">未定</option>
          {(members || []).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* メモ */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1" style={{fontFamily:'var(--font-ja)'}}>メモ（任意）</label>
        <textarea
          className="input-field resize-none"
          rows={2}
          placeholder="理由・気になる点など"
          value={form.reason}
          onChange={e => set('reason', e.target.value)}
          style={{fontFamily:'var(--font-ja)'}}
        />
      </div>

      {/* ボタン */}
      <div className="flex gap-3 pb-2">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="btn-ghost flex-1 py-3 rounded-xl text-sm"
            style={{fontFamily:'var(--font-ja)'}}>キャンセル</button>
        )}
        <button type="submit"
          className="btn-primary flex-1 py-3 rounded-xl text-sm"
          style={{fontFamily:'var(--font-ja)'}}>
          {initial ? '更新する' : '保存する'}
        </button>
      </div>
    </form>
  );
}
