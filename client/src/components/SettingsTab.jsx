import { useState } from 'react';

export default function SettingsTab({ config, myName, onSave, onMyNameChange }) {
  const [form, setForm] = useState({ ...config });
  const [localName, setLocalName] = useState(myName);
  const [saved, setSaved] = useState(false);

  const setMember = (i, v) => {
    const m = [...(form.members || [])];
    m[i] = v;
    setForm(f => ({ ...f, members: m }));
  };

  const handleSave = () => {
    onSave(form);
    onMyNameChange(localName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 fade-in">
      {/* 自分の名前 */}
      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>あなたの名前</div>
        <select
          className="input-field"
          value={localName}
          onChange={e => setLocalName(e.target.value)}
          style={{fontFamily:'var(--font-ja)'}}
        >
          <option value="">未設定</option>
          {(form.members || []).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <p className="text-xs text-slate-400 mt-2" style={{fontFamily:'var(--font-ja)'}}>この端末での入力者・担当表示に使われます</p>
      </div>

      {/* メンバー */}
      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>チームメンバー（4人）</div>
        <div className="flex flex-col gap-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-6 font-mono">{i+1}</span>
              <input
                className="input-field"
                placeholder={`メンバー${i+1}`}
                value={(form.members || [])[i] || ''}
                onChange={e => setMember(i, e.target.value)}
                style={{fontFamily:'var(--font-ja)'}}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 手数料率 */}
      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>手数料率 (%)</div>
        <div className="grid grid-cols-2 gap-3">
          {['ヤフオク', 'Yahoo!フリマ'].map(p => (
            <div key={p}>
              <label className="text-xs text-slate-400 mb-1 block" style={{fontFamily:'var(--font-ja)'}}>{p}</label>
              <input
                className="input-field"
                type="number" min="0" max="100" step="0.1"
                value={(form.feeRates || {})[p] ?? 10}
                onChange={e => setForm(f => ({ ...f, feeRates: { ...f.feeRates, [p]: parseFloat(e.target.value)||0 } }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 送料 */}
      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>送料デフォルト (¥)</div>
        <input
          className="input-field"
          type="number" min="0" inputMode="numeric"
          value={form.shipping ?? 210}
          onChange={e => setForm(f => ({ ...f, shipping: parseFloat(e.target.value)||0 }))}
        />
      </div>

      {/* しきい値 */}
      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>判断ルール（しきい値）</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block" style={{fontFamily:'var(--font-ja)'}}>本命 ≥ ¥</label>
            <input
              className="input-field"
              type="number" min="0" inputMode="numeric"
              value={form.thresholds?.honmei ?? 500}
              onChange={e => setForm(f => ({ ...f, thresholds: { ...f.thresholds, honmei: parseFloat(e.target.value)||0 } }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block" style={{fontFamily:'var(--font-ja)'}}>実験枠 ≥ ¥</label>
            <input
              className="input-field"
              type="number" min="0" inputMode="numeric"
              value={form.thresholds?.jikken ?? 80}
              onChange={e => setForm(f => ({ ...f, thresholds: { ...f.thresholds, jikken: parseFloat(e.target.value)||0 } }))}
            />
          </div>
        </div>
      </div>

      {/* 仕入れ上限 */}
      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>仕入れ上限 (¥)</div>
        <input
          className="input-field"
          type="number" min="0" inputMode="numeric"
          value={form.costLimit ?? 4000}
          onChange={e => setForm(f => ({ ...f, costLimit: parseFloat(e.target.value)||0 }))}
        />
        <p className="text-xs text-slate-400 mt-2" style={{fontFamily:'var(--font-ja)'}}>この金額を超えると「上限オーバー」警告が出ます</p>
      </div>

      <button
        onClick={handleSave}
        className={`btn-primary w-full py-4 rounded-2xl text-base transition-all ${saved ? 'opacity-70' : ''}`}
        style={{fontFamily:'var(--font-ja)'}}
      >
        {saved ? '✓ 保存しました' : '設定を保存（チーム全体に反映）'}
      </button>

      <div className="pb-8" />
    </div>
  );
}
