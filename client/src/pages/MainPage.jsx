import { useState, useMemo } from 'react';
import { useStore } from '../lib/store.js';
import { calcProfit, daysAgo } from '../lib/calc.js';

const PLATFORMS = ['ヤフオク', 'Yahoo!フリマ'];

const BASE = (() => {
  const { protocol, host, pathname } = window.location;
  return `${protocol}//${host}${pathname.replace(/\/$/, '')}`;
})();

const LINKS = [
  { label: '① メイン（全員）',   url: `${BASE}/` },
  { label: '② 設定（オーナー）', url: `${BASE}/#/admin` },
  { label: '③ 仕入れ係専用',     url: `${BASE}/#/purchasing` },
];

function CopyLinks() {
  const [copied, setCopied] = useState(null);
  const copy = (url, idx) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 1800);
    });
  };
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-2">
      <div className="text-xs font-bold text-slate-400 mb-1" style={{fontFamily:'var(--font-ja)'}}>URLをコピーして共有</div>
      {LINKS.map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-600 flex-1 truncate" style={{fontFamily:'var(--font-ja)'}}>{l.label}</span>
          <button
            onClick={() => copy(l.url, i)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${copied === i ? 'bg-emerald-100 text-emerald-600' : 'btn-ghost'}`}
            style={{fontFamily:'var(--font-ja)'}}
          >{copied === i ? '✓ コピー済み' : 'コピー'}</button>
        </div>
      ))}
    </div>
  );
}

export default function MainPage() {
  const { items, config, myName, syncing, addItem, isConfigured } = useStore();
  const [tab, setTab] = useState('list'); // list | input | analytics
  const [form, setForm] = useState({ name: '', platform: 'ヤフオク', url: '', memo: '' });
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const pending  = items.filter(i => i.status === 'pending');
  const selling  = items.filter(i => i.status === 'selling');
  const sold     = items.filter(i => i.status === 'sold');
  const rejected = items.filter(i => i.status === 'rejected');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addItem(form, myName || '不明');
    setForm({ name: '', platform: 'ヤフオク', url: '', memo: '' });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    setTab('list');
  };

  // 分析データ
  const analytics = useMemo(() => {
    const soldItems = items.filter(i => i.status === 'sold' && i.salePrice && i.purchasePrice);
    const totalPurchase = soldItems.reduce((s, i) => s + (i.purchasePrice || 0), 0);
    const totalSale     = soldItems.reduce((s, i) => s + (i.salePrice || 0), 0);
    const profits = soldItems.map(i => {
      const { profit } = calcProfit({ purchasePrice: i.purchasePrice, salePrice: i.salePrice, platform: i.platform, shipping: i.shipping ?? config.shipping, feeRates: config.feeRates });
      return profit;
    });
    const totalProfit = profits.reduce((s, p) => s + p, 0);
    const wins = profits.filter(p => p > 0).length;
    const losses = profits.filter(p => p <= 0).length;
    return { totalPurchase, totalSale, totalProfit, wins, losses, count: soldItems.length };
  }, [items, config]);

  const alertItems = selling.filter(i => daysAgo(i.purchasedAt) >= (config.alertDays || 14));

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl select-none">🃏</span>
          <span className="text-xl font-bold tracking-tight holo-text" style={{fontFamily:'var(--font-display)'}}>FUDA</span>
          {syncing && <span className="text-xs text-slate-400 animate-pulse ml-1" style={{fontFamily:'var(--font-ja)'}}>同期中…</span>}
          {!isConfigured && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full ml-1" style={{fontFamily:'var(--font-ja)'}}>オフライン</span>}
          {alertItems.length > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold ml-1" style={{fontFamily:'var(--font-ja)'}}>
              ⚠️ {alertItems.length}件
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {myName && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-semibold" style={{fontFamily:'var(--font-ja)'}}>{myName}</span>}
          <a href="#/admin" className="text-xs text-slate-400 underline" style={{fontFamily:'var(--font-ja)'}}>設定</a>
        </div>
      </header>

      {/* Tab bar */}
      <div className="sticky top-[57px] z-20 glass border-b border-white/40 px-4 py-2 flex gap-2">
        {[['list','一覧'],['input','入力'],['analytics','分析']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'tab-active' : 'text-slate-500'}`}
            style={{fontFamily:'var(--font-ja)'}}>{label}</button>
        ))}
      </div>

      <main className="flex-1 px-4 pt-4 pb-10">
        {tab === 'input' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 slide-up">
            <h2 className="text-lg font-bold" style={{fontFamily:'var(--font-ja)'}}>仕入れ候補を追加</h2>

            <div>
              <label className="field-label">商品名</label>
              <input className="input-field" placeholder="例：リザードン VMAX SA" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div>
              <label className="field-label">出品先</label>
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

        {tab === 'list' && (
          <div className="flex flex-col gap-5 fade-in">
            <CopyLinks />
            <Section title="保留中" count={pending.length} color="blue" items={pending} config={config} renderItem={i => <PendingCard key={i.id} item={i} />} />
            <Section title="売り出し中" count={selling.length} color="purple" items={selling} config={config} alert={alertItems.length}
              renderItem={i => <SellingCard key={i.id} item={i} config={config} />} />
            <Section title="売却済み" count={sold.length} color="green" items={sold} config={config}
              renderItem={i => <SoldCard key={i.id} item={i} config={config} />} />
            <Section title="却下" count={rejected.length} color="gray" items={rejected} config={config}
              renderItem={i => <RejectedCard key={i.id} item={i} />} />
          </div>
        )}

        {tab === 'analytics' && (
          <div className="flex flex-col gap-4 fade-in">
            <div className="glass rounded-2xl p-5">
              <div className="text-xs font-semibold text-slate-400 mb-4" style={{fontFamily:'var(--font-ja)'}}>売却済み集計（{analytics.count}件）</div>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="仕入れ合計" value={`¥${analytics.totalPurchase.toLocaleString()}`} color="#64748b" />
                <StatBox label="売上合計" value={`¥${analytics.totalSale.toLocaleString()}`} color="#0ea5e9" />
                <StatBox label="純利益合計" value={`¥${analytics.totalProfit.toLocaleString()}`} color={analytics.totalProfit >= 0 ? '#16a34a' : '#dc2626'} big />
                <StatBox label="勝率" value={analytics.count ? `${Math.round(analytics.wins/analytics.count*100)}%` : '—'} color="#a855f7" big />
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-xs font-semibold text-slate-400 mb-3" style={{fontFamily:'var(--font-ja)'}}>現在の状況</div>
              <div className="flex flex-col gap-2">
                {[
                  { label: '保留中', count: pending.length, color: '#3b82f6' },
                  { label: '売り出し中', count: selling.length, color: '#a855f7' },
                  { label: '売却済み', count: sold.length, color: '#16a34a' },
                  { label: '却下', count: rejected.length, color: '#9ca3af' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20 shrink-0" style={{fontFamily:'var(--font-ja)'}}>{s.label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="h-full rounded-full" style={{width:`${items.length ? s.count/items.length*100 : 0}%`, background:s.color}} />
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
  );
}

function Section({ title, count, color, items, renderItem, alert }) {
  const [open, setOpen] = useState(true);
  const colors = { blue:'bg-blue-50 text-blue-600', purple:'bg-purple-50 text-purple-600', green:'bg-emerald-50 text-emerald-600', gray:'bg-slate-100 text-slate-500' };
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 mb-2 w-full">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[color]}`} style={{fontFamily:'var(--font-ja)'}}>{title} {count}</span>
        {alert > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold" style={{fontFamily:'var(--font-ja)'}}>⚠️ {alert}件遅延</span>}
        <span className="text-slate-300 ml-auto text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2">
          {items.length === 0
            ? <div className="text-xs text-slate-300 px-1" style={{fontFamily:'var(--font-ja)'}}>なし</div>
            : items.map(renderItem)}
        </div>
      )}
    </div>
  );
}

function PendingCard({ item }) {
  return (
    <div className="glass rounded-xl p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{fontFamily:'var(--font-ja)'}}>{item.name}</div>
        <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>
          {item.platform} · {item.createdBy} · {new Date(item.createdAt).toLocaleDateString('ja-JP')}
        </div>
        {item.memo && <div className="text-xs text-slate-400 mt-0.5 truncate" style={{fontFamily:'var(--font-ja)'}}>{item.memo}</div>}
      </div>
      {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-sky-500 shrink-0 underline" style={{fontFamily:'var(--font-ja)'}}>リンク</a>}
      <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full shrink-0" style={{fontFamily:'var(--font-ja)'}}>判断待ち</span>
    </div>
  );
}

function SellingCard({ item, config }) {
  const days = daysAgo(item.purchasedAt);
  const alert = days >= (config.alertDays || 14);
  const { profit } = calcProfit({ purchasePrice: item.purchasePrice, salePrice: item.currentPrice ?? item.purchasePrice, platform: item.platform, shipping: item.shipping ?? config.shipping, feeRates: config.feeRates });
  return (
    <div className={`glass rounded-xl p-3 ${alert ? 'ring-2 ring-red-300' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate" style={{fontFamily:'var(--font-ja)'}}>{item.name}</div>
          <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>
            {item.platform} · 仕入れ ¥{(item.purchasePrice||0).toLocaleString()} · 出品中 {days}日目
          </div>
          {item.currentPrice && item.currentPrice !== item.purchasePrice && (
            <div className="text-xs text-amber-600 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>値下げ中: ¥{item.currentPrice.toLocaleString()}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-sky-500 block underline mb-1" style={{fontFamily:'var(--font-ja)'}}>リンク</a>}
          {alert && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold" style={{fontFamily:'var(--font-ja)'}}>⚠️ 遅延</span>}
        </div>
      </div>
    </div>
  );
}

function SoldCard({ item, config }) {
  const { profit } = calcProfit({ purchasePrice: item.purchasePrice, salePrice: item.salePrice, platform: item.platform, shipping: item.shipping ?? config.shipping, feeRates: config.feeRates });
  return (
    <div className="glass rounded-xl p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{fontFamily:'var(--font-ja)'}}>{item.name}</div>
        <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>
          {item.platform} · 仕入れ ¥{(item.purchasePrice||0).toLocaleString()} → 売値 ¥{(item.salePrice||0).toLocaleString()}
        </div>
      </div>
      <span className={`font-mono font-bold text-base shrink-0 ${profit >= 0 ? 'rank-honmei' : 'rank-over'}`}>
        {profit >= 0 ? '+' : ''}¥{profit.toLocaleString()}
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
        <div className="text-xs text-slate-400 mt-0.5" style={{fontFamily:'var(--font-ja)'}}>却下 {days}日前 · {item.platform}</div>
      </div>
      <span className="text-xs text-slate-400 shrink-0" style={{fontFamily:'var(--font-ja)'}}>{40 - days}日後に消える</span>
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
