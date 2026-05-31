import { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { calcProfit, daysAgo, PLATFORMS } from '../lib/calc.js';

export default function PurchasingPage() {
  const { items, config, myName, syncing, updateItem } = useStore();
  const [tab, setTab] = useState('todo');

  const todo     = items.filter(i => i.status === 'pending');
  const selling  = items.filter(i => i.status === 'selling');
  const sold     = items.filter(i => i.status === 'sold');
  const rejected = items.filter(i => i.status === 'rejected');
  const alertCount = selling.filter(i => daysAgo(i.purchasedAt) >= (config.alertDays || 14)).length;

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      <header className="sticky top-0 z-30 glass border-b border-white/40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <span className="text-xl font-bold tracking-tight holo-text" style={{fontFamily:'var(--font-display)'}}>仕入れ</span>
          {syncing && <span className="text-xs text-slate-400 animate-pulse ml-1" style={{fontFamily:'var(--font-ja)'}}>同期中…</span>}
        </div>
        {myName && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-semibold" style={{fontFamily:'var(--font-ja)'}}>{myName}</span>}
      </header>

      <div className="sticky top-[57px] z-20 glass border-b border-white/40 px-2 py-2 flex gap-1 overflow-x-auto">
        {[
          ['todo','やること',todo.length],
          ['selling','売り出し中',selling.length],
          ['sold','売却済み',sold.length],
          ['rejected','却下',rejected.length],
        ].map(([id, label, count]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${tab === id ? 'tab-active' : 'text-slate-500'}`}
            style={{fontFamily:'var(--font-ja)'}}>
            {label}
            {count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === id ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>{count}</span>}
            {id === 'selling' && alertCount > 0 && <span className="text-[10px] text-red-500 font-bold ml-0.5">⚠️</span>}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 pt-4 pb-10">
        {tab === 'todo'     && <ItemList items={todo}     Empty="やることはありません" Card={(item) => <TodoCard key={item.id} item={item} config={config} myName={myName} onUpdate={updateItem} />} />}
        {tab === 'selling'  && <ItemList items={selling}  Empty="売り出し中の商品はありません" Card={(item) => <SellingCard key={item.id} item={item} config={config} myName={myName} onUpdate={updateItem} />} />}
        {tab === 'sold'     && <ItemList items={sold}     Empty="売却済みの商品はありません" Card={(item) => <SoldCard key={item.id} item={item} config={config} />} />}
        {tab === 'rejected' && <ItemList items={rejected} Empty="却下された商品はありません" Card={(item) => <RejectedCard key={item.id} item={item} />} />}
      </main>
    </div>
  );
}

function ItemList({ items, Empty, Card }) {
  return (
    <div className="flex flex-col gap-3 fade-in">
      {items.length === 0
        ? <div className="glass rounded-2xl p-8 text-center text-slate-400 text-sm" style={{fontFamily:'var(--font-ja)'}}>{Empty}</div>
        : items.map(item => Card(item))
      }
    </div>
  );
}

// ── やることカード ─────────────────────────────────────────
function TodoCard({ item, config, myName, onUpdate }) {
  const [showBuy, setShowBuy]   = useState(false);
  const [price, setPrice]       = useState('');
  const [sellPlatform, setSellPlatform] = useState(item.platform || 'メルカリ');
  const by = myName || '仕入れ係';

  const handleBuy = () => {
    const p = parseFloat(price);
    if (!p || p <= 0) return;
    const over = p > (config.costLimit || 4000);
    if (over && !confirm(`仕入れ上限（¥${(config.costLimit||4000).toLocaleString()}）を超えています。それでも購入しますか？`)) return;
    onUpdate(item.id, {
      status: 'selling',
      purchasePrice: p,
      currentPrice: p,
      sellPlatform,
      purchasedAt: new Date().toISOString(),
      priceHistory: [{ price: p, at: new Date().toISOString(), note: '仕入れ値' }],
    }, by, '購入決定');
    setShowBuy(false); setPrice('');
  };

  const handleReject = () => {
    onUpdate(item.id, { status: 'rejected', rejectedAt: new Date().toISOString() }, by, '非購入');
  };

  const priceNum  = parseFloat(price) || 0;
  const overLimit = priceNum > (config.costLimit || 4000) && priceNum > 0;

  return (
    <div className="glass rounded-2xl overflow-hidden slide-up">
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base truncate" style={{fontFamily:'var(--font-ja)'}}>{item.name}</div>
            <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>
              {item.platform} · {item.createdBy} · {new Date(item.createdAt).toLocaleDateString('ja-JP')}
            </div>
            {item.memo && <div className="text-xs text-slate-500 mt-1 bg-slate-50 rounded px-2 py-1" style={{fontFamily:'var(--font-ja)'}}>{item.memo}</div>}
          </div>
          {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-sky-500 underline shrink-0" style={{fontFamily:'var(--font-ja)'}}>リンク</a>}
        </div>

        {!showBuy ? (
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowBuy(true)} className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-primary" style={{fontFamily:'var(--font-ja)'}}>購入する</button>
            <button onClick={handleReject} className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-ghost text-slate-500" style={{fontFamily:'var(--font-ja)'}}>非購入</button>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {/* 出品先選択 */}
            <div>
              <label className="field-label">出品先</label>
              <div className="flex gap-2">
                {PLATFORMS.map(p => (
                  <button key={p} type="button" onClick={() => setSellPlatform(p)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${sellPlatform === p ? 'tab-active' : 'btn-ghost'}`}
                    style={{fontFamily:'var(--font-ja)'}}>{p}</button>
                ))}
              </div>
            </div>
            {/* 仕入れ値 */}
            <div>
              <label className="field-label">仕入れ値 (¥)</label>
              <input className={`input-field ${overLimit ? 'border-red-400' : ''}`}
                type="number" min="0" inputMode="numeric" placeholder="1000" autoFocus
                value={price} onChange={e => setPrice(e.target.value)} />
              {overLimit && <p className="text-xs text-red-500 mt-1" style={{fontFamily:'var(--font-ja)'}}>⚠️ 上限（¥{(config.costLimit||4000).toLocaleString()}）超えています</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={handleBuy} disabled={!price || parseFloat(price) <= 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-primary disabled:opacity-40" style={{fontFamily:'var(--font-ja)'}}>確定</button>
              <button onClick={() => { setShowBuy(false); setPrice(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-ghost" style={{fontFamily:'var(--font-ja)'}}>キャンセル</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 売り出し中カード ────────────────────────────────────────
function SellingCard({ item, config, myName, onUpdate }) {
  const [showSell, setShowSell]         = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [salePrice, setSalePrice]       = useState('');
  const [newPrice, setNewPrice]         = useState('');
  const by   = myName || '仕入れ係';
  const days = daysAgo(item.purchasedAt);
  const alert = days >= (config.alertDays || 14);

  const { profit: projProfit } = calcProfit({
    purchasePrice: item.purchasePrice || 0,
    salePrice: item.currentPrice || item.purchasePrice || 0,
    platform: item.sellPlatform || item.platform,
    shipping: config.shipping,
    feeRates: config.feeRates,
  });

  const handleSold = () => {
    const p = parseFloat(salePrice);
    if (!p || p <= 0) return;
    const { profit } = calcProfit({ purchasePrice: item.purchasePrice, salePrice: p, platform: item.sellPlatform||item.platform, shipping: config.shipping, feeRates: config.feeRates });
    onUpdate(item.id, { status: 'sold', salePrice: p, soldAt: new Date().toISOString() }, by,
      `売却 ¥${p.toLocaleString()}（純利益${profit >= 0 ? '+' : ''}¥${profit.toLocaleString()}）`);
    setShowSell(false); setSalePrice('');
  };

  const handleMarkdown = () => {
    const p = parseFloat(newPrice);
    if (!p || p <= 0) return;
    const history = [...(item.priceHistory || []), { price: p, at: new Date().toISOString(), note: '値下げ' }];
    onUpdate(item.id, { currentPrice: p, priceHistory: history }, by,
      `値下げ ¥${(item.currentPrice||0).toLocaleString()}→¥${p.toLocaleString()}`);
    setShowMarkdown(false); setNewPrice('');
  };

  return (
    <div className={`glass rounded-2xl overflow-hidden ${alert ? 'ring-2 ring-red-300' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base truncate" style={{fontFamily:'var(--font-ja)'}}>{item.name}</div>
            <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>
              {item.sellPlatform||item.platform} · 仕入れ¥{(item.purchasePrice||0).toLocaleString()} · {days}日目
            </div>
            {item.currentPrice && item.currentPrice !== item.purchasePrice && (
              <div className="text-xs text-amber-600 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>
                現在¥{item.currentPrice.toLocaleString()} ({(item.priceHistory?.length||1)-1}回値下げ)
              </div>
            )}
          </div>
          <div className="text-right shrink-0 flex flex-col items-end gap-1">
            {alert && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold" style={{fontFamily:'var(--font-ja)'}}>⚠️ 遅延</span>}
            <span className={`font-mono text-sm font-bold ${projProfit >= 0 ? 'rank-honmei' : 'rank-over'}`}>
              {projProfit >= 0 ? '+' : ''}¥{projProfit.toLocaleString()}
            </span>
          </div>
        </div>

        {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-sky-500 underline" style={{fontFamily:'var(--font-ja)'}}>商品ページ</a>}

        {(item.priceHistory?.length ?? 0) > 1 && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-slate-400 font-semibold" style={{fontFamily:'var(--font-ja)'}}>値下げ履歴</summary>
            <div className="mt-1 flex flex-col gap-1 pl-2">
              {item.priceHistory.map((h, i) => (
                <div key={i} className="text-slate-400" style={{fontFamily:'var(--font-ja)'}}>
                  {new Date(h.at).toLocaleDateString('ja-JP')} ¥{h.price.toLocaleString()} {h.note}
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="flex gap-2 mt-3">
          <button onClick={() => { setShowSell(s => !s); setShowMarkdown(false); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-primary" style={{fontFamily:'var(--font-ja)'}}>売れた！</button>
          <button onClick={() => { setShowMarkdown(s => !s); setShowSell(false); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-ghost" style={{fontFamily:'var(--font-ja)'}}>値下げ</button>
        </div>

        {showSell && (
          <div className="mt-3 flex flex-col gap-2 fade-in">
            <div>
              <label className="field-label">売れた金額 (¥)</label>
              <input className="input-field" type="number" min="0" inputMode="numeric" placeholder="2000" autoFocus
                value={salePrice} onChange={e => setSalePrice(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSold} disabled={!salePrice||parseFloat(salePrice)<=0}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-primary disabled:opacity-40" style={{fontFamily:'var(--font-ja)'}}>確定</button>
              <button onClick={() => { setShowSell(false); setSalePrice(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-ghost" style={{fontFamily:'var(--font-ja)'}}>キャンセル</button>
            </div>
          </div>
        )}

        {showMarkdown && (
          <div className="mt-3 flex flex-col gap-2 fade-in">
            <div>
              <label className="field-label">新しい値段 (¥)</label>
              <input className="input-field" type="number" min="0" inputMode="numeric" autoFocus
                value={newPrice} onChange={e => setNewPrice(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleMarkdown} disabled={!newPrice||parseFloat(newPrice)<=0}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-primary disabled:opacity-40" style={{fontFamily:'var(--font-ja)'}}>値下げ確定</button>
              <button onClick={() => { setShowMarkdown(false); setNewPrice(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-ghost" style={{fontFamily:'var(--font-ja)'}}>キャンセル</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SoldCard({ item, config }) {
  const { profit } = calcProfit({ purchasePrice: item.purchasePrice||0, salePrice: item.salePrice||0, platform: item.sellPlatform||item.platform, shipping: config.shipping, feeRates: config.feeRates });
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{fontFamily:'var(--font-ja)'}}>{item.name}</div>
        <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>
          {item.sellPlatform||item.platform} · 仕入れ¥{(item.purchasePrice||0).toLocaleString()} → ¥{(item.salePrice||0).toLocaleString()}
        </div>
        <div className="text-xs text-slate-300" style={{fontFamily:'var(--font-ja)'}}>
          {item.soldAt ? new Date(item.soldAt).toLocaleDateString('ja-JP') : ''}
        </div>
      </div>
      <span className={`font-mono font-bold text-lg shrink-0 ${profit>=0?'rank-honmei':'rank-over'}`}>
        {profit>=0?'+':''}¥{profit.toLocaleString()}
      </span>
    </div>
  );
}

function RejectedCard({ item }) {
  const days = daysAgo(item.rejectedAt);
  return (
    <div className="glass rounded-xl p-3 flex items-center gap-3 opacity-60">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{fontFamily:'var(--font-ja)'}}>{item.name}</div>
        <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>{item.platform} · 却下 {days}日前</div>
      </div>
      <span className="text-xs text-slate-400 shrink-0" style={{fontFamily:'var(--font-ja)'}}>{40-days}日後に消える</span>
    </div>
  );
}
