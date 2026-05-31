import { useState } from 'react';
import { useStore, DEFAULT_CONFIG } from '../lib/store.jsx';

export default function AdminPage() {
  const { config, myName, setMyName, saveConfig, items, deleteItem } = useStore();
  const [form, setForm]     = useState({ ...DEFAULT_CONFIG, ...config });
  const [localName, setLocalName] = useState(myName);
  const [saved, setSaved]   = useState(false);

  const setMember = (i, v) => {
    const m = [...(form.members || [])];
    m[i] = v;
    setForm(f => ({ ...f, members: m }));
  };

  const handleSave = () => {
    saveConfig(form, localName || myName || '不明', '設定を変更');
    setMyName(localName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const rejectedItems = items.filter(i => i.status === 'rejected');
  const configHistory = [...(config.history || [])].reverse().slice(0, 20);

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      <header className="sticky top-0 z-30 glass border-b border-white/40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          <span className="text-xl font-bold tracking-tight holo-text" style={{fontFamily:'var(--font-display)'}}>設定</span>
        </div>
        <a href="#/" className="text-xs text-sky-500 underline" style={{fontFamily:'var(--font-ja)'}}>← メインに戻る</a>
      </header>

      <main className="flex-1 px-4 pt-4 pb-10 flex flex-col gap-4">

        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>自分の名前（この端末）</div>
          <select className="input-field" value={localName} onChange={e => setLocalName(e.target.value)} style={{fontFamily:'var(--font-ja)'}}>
            <option value="">未設定</option>
            {(form.members || []).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>チームメンバー</div>
          <div className="flex flex-col gap-2">
            {[0,1,2,3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-6 font-mono">{i+1}</span>
                <input className="input-field" placeholder={`メンバー${i+1}`}
                  value={(form.members||[])[i]||''} onChange={e => setMember(i, e.target.value)}
                  style={{fontFamily:'var(--font-ja)'}} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>手数料率 (%)</div>
          <div className="grid grid-cols-2 gap-3">
            {['メルカリ', 'Yahoo!フリマ'].map(p => (
              <div key={p}>
                <label className="text-xs text-slate-400 mb-1 block" style={{fontFamily:'var(--font-ja)'}}>{p}</label>
                <input className="input-field" type="number" min="0" max="100" step="0.1"
                  value={(form.feeRates||{})[p]??10}
                  onChange={e => setForm(f => ({ ...f, feeRates: { ...f.feeRates, [p]: parseFloat(e.target.value)||0 } }))} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>初期送料 (¥)</div>
          <input className="input-field" type="number" min="0" inputMode="numeric"
            value={form.shipping??210}
            onChange={e => setForm(f => ({ ...f, shipping: parseFloat(e.target.value)||0 }))} />
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>仕入れ上限 (¥)</div>
          <input className="input-field" type="number" min="0" inputMode="numeric"
            value={form.costLimit??4000}
            onChange={e => setForm(f => ({ ...f, costLimit: parseFloat(e.target.value)||0 }))} />
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>売り出し中アラート（日数）</div>
          <input className="input-field" type="number" min="1" inputMode="numeric"
            value={form.alertDays??14}
            onChange={e => setForm(f => ({ ...f, alertDays: parseInt(e.target.value)||14 }))} />
        </div>

        {/* 却下リスト */}
        {rejectedItems.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>却下リスト（手動削除）</div>
            <div className="flex flex-col gap-2">
              {rejectedItems.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm truncate" style={{fontFamily:'var(--font-ja)'}}>{item.name}</span>
                  <button onClick={() => { if(confirm('削除しますか？')) deleteItem(item.id); }}
                    className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg shrink-0"
                    style={{fontFamily:'var(--font-ja)'}}>削除</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleSave}
          className={`btn-primary w-full py-4 rounded-2xl text-base transition-all ${saved ? 'opacity-70' : ''}`}
          style={{fontFamily:'var(--font-ja)'}}>
          {saved ? '✓ 保存しました' : '設定を保存（全員に反映）'}
        </button>

        {/* 設定変更履歴 */}
        {configHistory.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <div className="text-sm font-bold text-slate-600 mb-3" style={{fontFamily:'var(--font-ja)'}}>設定変更の履歴</div>
            <div className="flex flex-col gap-2">
              {configHistory.map((h, i) => (
                <div key={i} className="flex gap-3 text-xs text-slate-500">
                  <span className="font-mono text-slate-300 shrink-0">{new Date(h.at).toLocaleDateString('ja-JP')}</span>
                  <span style={{fontFamily:'var(--font-ja)'}}>{h.by} — {h.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pb-8" />
      </main>
    </div>
  );
}
