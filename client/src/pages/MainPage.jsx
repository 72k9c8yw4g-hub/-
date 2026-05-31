import { useState, useMemo } from 'react';
import { useStore } from '../lib/store.jsx';
import { calcProfit, daysAgo, PLATFORMS } from '../lib/calc.js';

export default function MainPage() {
  const { items, config, myName, syncing, addItem, isConfigured } = useStore();
  const [tab, setTab]     = useState('input');
  const [form, setForm]   = useState({ name: '', platform: 'メルカリ', url: '', memo: '' });
  const [submitted, setSubmitted] = useState(false);
  const [modal, setModal] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const pending  = items.filter(i => i.status === 'pending');
  const selling  = items.filter(i => i.status === 'selling');
  const sold     = items.filter(i => i.status === 'sold');
  const rejected = items.filter(i => i.status === 'rejected');
  const alertItems = selling.filter(i => daysAgo(i.purchasedAt) >= (config.alertDays || 14));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addItem(form, myName || '不明');
    setForm({ name: '', platform: 'メルカリ', url: '', memo: '' });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    setTab('pending');
  };

  // 分析
  const analytics = useMemo(() => {
    const soldItems = items.filter(i => i.status === 'sold' && i.salePrice && i.purchasePrice);
    const total = soldItems.reduce((acc, i) => {
      const { profit } = calcProfit({ purchasePrice: i.purchasePrice, salePrice: i.salePrice, platform: i.sellPlatform || i.platform, shipping: config.shipping, feeRates: config.feeRates });
      acc.purchase += i.purchasePrice || 0;
      acc.sale     += i.salePrice || 0;
      acc.profit   += profit;
      acc.wins     += profit > 0 ? 1 : 0;
      return acc;
    }, { purchase: 0, sale: 0, profit: 0, wins: 0 });

    // 出品先別
    const byPlatform = {};
    PLATFORMS.forEach(p => { byPlatform[p] = { count: 0, profit: 0 }; });
    soldItems.forEach(i => {
      const p = i.sellPlatform || i.platform || 'メルカリ';
      const { profit } = calcProfit({ purchasePrice: i.purchasePrice, salePrice: i.salePrice, platform: p, shipping: config.shipping, feeRates: config.feeRates });
      if (!byPlatform[p]) byPlatform[p] = { count: 0, profit: 0 };
      byPlatform[p].count  += 1;
      byPlatform[p].profit += profit;
    });

    return { ...total, count: soldItems.length, byPlatform };
  }, [items, config]);

  return (
    <>
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl select-none">🃏</span>
          <span className="text-xl font-bold tracking-tight holo-text" style={{fontFamily:'var(--font-display)'}}>FUDA</span>
          {syncing && <span className="text-xs text-slate-400 animate-pulse ml-1" style={{fontFamily:'var(--font-ja)'}}>同期中…</span>}
          {!isConfigured && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full ml-1" style={{fontFamily:'var(--font-ja)'}}>オフライン</span>}
          {alertItems.length > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold ml-1" style={{fontFamily:'var(--font-ja)'}}>⚠️ {alertItems.length}件</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {myName && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-semibold" style={{fontFamily:'var(--font-ja)'}}>{myName}</span>}
          <a href="./manual.html" target="_blank" rel="noreferrer" className="text-xs text-slate-400 underline" style={{fontFamily:'var(--font-ja)'}}>使い方</a>
          <a href="#/admin" className="text-xs text-slate-400 underline" style={{fontFamily:'var(--font-ja)'}}>設定</a>
        </div>
      </header>

      {/* Tab bar */}
      <div className="sticky top-[57px] z-20 glass border-b border-white/40 px-2 py-2 flex gap-1 overflow-x-auto">
        {[
          ['input',   '入力',    null],
          ['pending', '保留中',  pending.length],
          ['selling', '売り出し', selling.length],
          ['sold',    '売却済み', sold.length],
          ['rejected','却下',    rejected.length],
          ['analytics','分析',   null],
        ].map(([id, label, count]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${tab === id ? 'tab-active' : 'text-slate-500'}`}
            style={{fontFamily:'var(--font-ja)'}}>
            {label}
            {count !== null && count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === id ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>{count}</span>
            )}
            {id === 'selling' && alertItems.length > 0 && <span className="text-[10px] text-red-500 font-bold">⚠️</span>}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 pt-4 pb-10">

        {/* ── 入力タブ ── */}
        {tab === 'input' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 slide-up">
            <h2 className="text-lg font-bold" style={{fontFamily:'var(--font-ja)'}}>仕入れ候補を追加</h2>
            <div>
              <label className="field-label">商品名</label>
              <input className="input-field" placeholder="例：リザードン VMAX SA" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">出品予定先</label>
              <div className="flex gap-2">
                {PLATFORMS.map(p => (
                  <button key={p} type="button" onClick={() => set('platform', p)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.platform === p ? 'tab-active' : 'btn-ghost'}`}
                    style={{fontFamily:'var(--font-ja)'}}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">商品ページのURL（任意）</label>
              <input className="input-field" type="url" placeholder="https://..." value={form.url} onChange={e => set('url', e.target.value)} />
            </div>
            <div>
              <label className="field-label">メモ（任意）</label>
              <textarea className="input-field resize-none" rows={2} placeholder="気になる点など" value={form.memo} onChange={e => set('memo', e.target.value)} style={{fontFamily:'var(--font-ja)'}} />
            </div>
            <button type="submit" className="btn-primary w-full py-4 rounded-2xl text-base" style={{fontFamily:'var(--font-ja)'}}>
              {submitted ? '✓ 追加しました' : '仕入れ候補として追加'}
            </button>
          </form>
        )}

        {/* ── 保留中タブ ── */}
        {tab === 'pending' && (
          <ItemList items={pending} empty="保留中の商品はありません"
            renderCard={i => (
              <button key={i.id} onClick={() => setModal(i)}
                className="glass rounded-xl px-4 py-3 flex items-center gap-3 text-left w-full active:scale-[0.98] transition-transform">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{fontFamily:'var(--font-ja)'}}>{i.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>{i.platform} · {i.createdBy} · {new Date(i.createdAt).toLocaleDateString('ja-JP')}</div>
                </div>
                <span className="text-slate-300 text-xs shrink-0">›</span>
              </button>
            )} />
        )}

        {/* ── 売り出し中タブ ── */}
        {tab === 'selling' && (
          <ItemList items={selling} empty="売り出し中の商品はありません"
            renderCard={i => {
              const days = daysAgo(i.purchasedAt);
              const alert = days >= (config.alertDays || 14);
              const { profit: proj } = calcProfit({ purchasePrice: i.purchasePrice||0, salePrice: i.currentPrice||i.purchasePrice||0, platform: i.sellPlatform||i.platform, shipping: config.shipping, feeRates: config.feeRates });
              return (
                <button key={i.id} onClick={() => setModal(i)}
                  className={`glass rounded-xl px-4 py-3 flex items-center gap-3 text-left w-full active:scale-[0.98] transition-transform ${alert ? 'ring-2 ring-red-200' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{fontFamily:'var(--font-ja)'}}>{i.name}</div>
                    <div className={`text-xs mt-0.5 ${alert ? 'text-red-500 font-semibold' : 'text-slate-400'}`} style={{fontFamily:'var(--font-ja)'}}>
                      {i.sellPlatform||i.platform} · 仕入れ¥{(i.purchasePrice||0).toLocaleString()} · {days}日目{alert ? ' ⚠️' : ''}
                    </div>
                  </div>
                  <span className={`font-mono text-sm font-bold shrink-0 ${proj >= 0 ? 'rank-honmei' : 'rank-over'}`}>{proj >= 0 ? '+' : ''}¥{proj.toLocaleString()}</span>
                </button>
              );
            }} />
        )}

        {/* ── 売却済みタブ ── */}
        {tab === 'sold' && (
          <ItemList items={sold} empty="売却済みの商品はありません"
            renderCard={i => {
              const { profit } = calcProfit({ purchasePrice: i.purchasePrice||0, salePrice: i.salePrice||0, platform: i.sellPlatform||i.platform, shipping: config.shipping, feeRates: config.feeRates });
              return (
                <button key={i.id} onClick={() => setModal(i)}
                  className="glass rounded-xl px-4 py-3 flex items-center gap-3 text-left w-full active:scale-[0.98] transition-transform">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{fontFamily:'var(--font-ja)'}}>{i.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>
                      {i.sellPlatform||i.platform} · {i.soldAt ? new Date(i.soldAt).toLocaleDateString('ja-JP') : ''}
                    </div>
                  </div>
                  <span className={`font-mono text-sm font-bold shrink-0 ${profit >= 0 ? 'rank-honmei' : 'rank-over'}`}>{profit >= 0 ? '+' : ''}¥{profit.toLocaleString()}</span>
                </button>
              );
            }} />
        )}

        {/* ── 却下タブ ── */}
        {tab === 'rejected' && (
          <ItemList items={rejected} empty="却下された商品はありません"
            renderCard={i => (
              <button key={i.id} onClick={() => setModal(i)}
                className="glass rounded-xl px-4 py-3 flex items-center gap-3 text-left w-full active:scale-[0.98] transition-transform opacity-60">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{fontFamily:'var(--font-ja)'}}>{i.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>却下 {daysAgo(i.rejectedAt)}日前 · {40 - daysAgo(i.rejectedAt)}日後に消える</div>
                </div>
                <span className="text-slate-300 text-xs shrink-0">›</span>
              </button>
            )} />
        )}

        {/* ── 分析タブ ── */}
        {tab === 'analytics' && (
          <div className="flex flex-col gap-4 fade-in">
            {/* 合計 */}
            <div className="glass rounded-2xl p-5">
              <div className="text-xs font-semibold text-slate-400 mb-4" style={{fontFamily:'var(--font-ja)'}}>売却済み集計（{analytics.count}件）</div>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="仕入れ合計"  value={`¥${analytics.purchase.toLocaleString()}`} color="#64748b" />
                <StatBox label="売上合計"     value={`¥${analytics.sale.toLocaleString()}`}     color="#0ea5e9" />
                <StatBox label="純利益合計"   value={`¥${analytics.profit.toLocaleString()}`}   color={analytics.profit >= 0 ? '#16a34a' : '#dc2626'} big />
                <StatBox label="勝率"         value={analytics.count ? `${Math.round(analytics.wins/analytics.count*100)}%` : '—'} color="#a855f7" big />
              </div>
            </div>

            {/* 出品先別 */}
            <div className="glass rounded-2xl p-5">
              <div className="text-xs font-semibold text-slate-400 mb-4" style={{fontFamily:'var(--font-ja)'}}>出品先別の実績</div>
              <div className="flex flex-col gap-4">
                {PLATFORMS.map(p => {
                  const d = analytics.byPlatform[p] || { count: 0, profit: 0 };
                  const maxProfit = Math.max(...PLATFORMS.map(pp => Math.abs((analytics.byPlatform[pp]||{}).profit||0)), 1);
                  const pct = Math.abs(d.profit) / maxProfit * 100;
                  return (
                    <div key={p}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-600" style={{fontFamily:'var(--font-ja)'}}>{p}</span>
                        <span className="text-xs text-slate-400" style={{fontFamily:'var(--font-ja)'}}>{d.count}件</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width:`${pct}%`, background: d.profit >= 0 ? 'linear-gradient(90deg,#0ea5e9,#a855f7)' : '#dc2626' }} />
                        </div>
                        <span className={`font-mono text-sm font-bold w-24 text-right ${d.profit >= 0 ? 'rank-honmei' : 'rank-over'}`}>
                          {d.profit >= 0 ? '+' : ''}¥{d.profit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 現況 */}
            <div className="glass rounded-2xl p-5">
              <div className="text-xs font-semibold text-slate-400 mb-3" style={{fontFamily:'var(--font-ja)'}}>現在の状況</div>
              <div className="flex flex-col gap-2">
                {[
                  { label:'保留中', count:pending.length, color:'#3b82f6' },
                  { label:'売り出し中', count:selling.length, color:'#a855f7' },
                  { label:'売却済み', count:sold.length, color:'#16a34a' },
                  { label:'却下', count:rejected.length, color:'#9ca3af' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20 shrink-0" style={{fontFamily:'var(--font-ja)'}}>{s.label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width:`${items.length ? s.count/items.length*100 : 0}%`, background:s.color }} />
                    </div>
                    <span className="font-mono text-sm font-bold w-6 text-right" style={{color:s.color}}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
    {/* 詳細モーダル — Fragment直下に置いてfixed位置を確実に */}
    {modal && (
      <ItemModal item={modal} config={config} onClose={() => setModal(null)} />
    )}
    </>
  );
}

// ── ItemList ──────────────────────────────────────────────────
function ItemList({ items, empty, renderCard }) {
  return (
    <div className="flex flex-col gap-2 fade-in">
      {items.length === 0
        ? <div className="glass rounded-2xl p-8 text-center text-slate-400 text-sm" style={{fontFamily:'var(--font-ja)'}}>{empty}</div>
        : items.map(i => renderCard(i))
      }
    </div>
  );
}

// ── Item Detail Modal ─────────────────────────────────────────
function ItemModal({ item, config, onClose }) {
  const { profit } = item.salePrice
    ? calcProfit({ purchasePrice: item.purchasePrice, salePrice: item.salePrice, platform: item.sellPlatform||item.platform, shipping: config.shipping, feeRates: config.feeRates })
    : { profit: null };

  const statusLabels = { pending:'保留中', selling:'売り出し中', sold:'売却済み', rejected:'却下' };
  const statusColors = { pending:'bg-blue-50 text-blue-600', selling:'bg-purple-50 text-purple-600', sold:'bg-emerald-50 text-emerald-600', rejected:'bg-slate-100 text-slate-500' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative glass rounded-t-3xl max-h-[85dvh] overflow-y-auto px-5 pt-5 pb-10 flex flex-col gap-4 slide-up"
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-1" />

        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold leading-tight" style={{fontFamily:'var(--font-ja)'}}>{item.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[item.status]}`} style={{fontFamily:'var(--font-ja)'}}>{statusLabels[item.status]}</span>
              <span className="text-xs text-slate-400" style={{fontFamily:'var(--font-ja)'}}>{item.sellPlatform || item.platform}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none shrink-0">×</button>
        </div>

        {/* 金額 */}
        <div className="glass rounded-xl p-4 grid grid-cols-2 gap-3">
          {item.purchasePrice && (
            <div>
              <div className="text-xs text-slate-400" style={{fontFamily:'var(--font-ja)'}}>仕入れ値</div>
              <div className="font-mono font-bold text-lg">¥{item.purchasePrice.toLocaleString()}</div>
            </div>
          )}
          {item.currentPrice && (
            <div>
              <div className="text-xs text-slate-400" style={{fontFamily:'var(--font-ja)'}}>出品中の値段</div>
              <div className="font-mono font-bold text-lg">¥{item.currentPrice.toLocaleString()}</div>
            </div>
          )}
          {item.salePrice && (
            <div>
              <div className="text-xs text-slate-400" style={{fontFamily:'var(--font-ja)'}}>売値</div>
              <div className="font-mono font-bold text-lg">¥{item.salePrice.toLocaleString()}</div>
            </div>
          )}
          {profit !== null && (
            <div>
              <div className="text-xs text-slate-400" style={{fontFamily:'var(--font-ja)'}}>純利益</div>
              <div className={`font-mono font-bold text-xl ${profit >= 0 ? 'rank-honmei' : 'rank-over'}`}>
                {profit >= 0 ? '+' : ''}¥{profit.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* メモ */}
        {item.memo && (
          <div className="text-sm bg-slate-50 rounded-xl px-4 py-3 text-slate-600" style={{fontFamily:'var(--font-ja)'}}>
            <span className="text-xs font-semibold text-slate-400">メモ: </span>{item.memo}
          </div>
        )}

        {/* URL */}
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer"
            className="text-sm text-sky-500 underline px-1" style={{fontFamily:'var(--font-ja)'}}>商品ページを開く →</a>
        )}

        {/* 値下げ履歴 */}
        {(item.priceHistory?.length ?? 0) > 1 && (
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2" style={{fontFamily:'var(--font-ja)'}}>値下げ履歴</div>
            <div className="flex flex-col gap-1">
              {item.priceHistory.map((h, i) => (
                <div key={i} className="flex gap-3 text-xs text-slate-500">
                  <span className="font-mono text-slate-300 shrink-0">{new Date(h.at).toLocaleDateString('ja-JP')}</span>
                  <span style={{fontFamily:'var(--font-ja)'}}>¥{h.price.toLocaleString()} {h.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 変更履歴 */}
        {item.history?.length > 0 && (
          <details>
            <summary className="text-xs font-semibold text-slate-400 cursor-pointer" style={{fontFamily:'var(--font-ja)'}}>変更履歴 ({item.history.length})</summary>
            <div className="mt-2 flex flex-col gap-1 max-h-40 overflow-y-auto">
              {[...item.history].reverse().map((h, i) => (
                <div key={i} className="flex gap-2 text-xs text-slate-400">
                  <span className="font-mono text-slate-300 shrink-0">{new Date(h.at).toLocaleDateString('ja-JP')}</span>
                  <span style={{fontFamily:'var(--font-ja)'}}>{h.by} — {h.action}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* 登録者・日時 */}
        <div className="text-xs text-slate-300 border-t border-slate-100 pt-3" style={{fontFamily:'var(--font-ja)'}}>
          登録: {item.createdBy} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ja-JP') : ''}
        </div>

      </div>
    </div>
  );
}

function StatBox({ label, value, color, big }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className={`font-mono font-bold ${big ? 'text-2xl' : 'text-xl'}`} style={{color}}>{value}</div>
      <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>{label}</div>
    </div>
  );
}
