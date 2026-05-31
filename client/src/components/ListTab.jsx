import { useState, useMemo } from 'react';
import { calcItem } from '../lib/calc.js';
import ItemCard from './ItemCard.jsx';

const STATUS_FILTERS = ['すべて', '買い候補', '保留', '却下'];

export default function ListTab({ items, config, myName, onUpdate, onDelete, onEdit }) {
  const [filter, setFilter] = useState('すべて');
  const [sort, setSort] = useState('profit_desc');

  const filtered = useMemo(() => {
    let arr = items.map(i => ({ ...i, ...calcItem(i, config) }));
    if (filter !== 'すべて') arr = arr.filter(i => i.status === filter);
    if (sort === 'profit_desc') arr.sort((a, b) => b.profit - a.profit);
    if (sort === 'profit_asc')  arr.sort((a, b) => a.profit - b.profit);
    if (sort === 'newest')      arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return arr;
  }, [items, config, filter, sort]);

  return (
    <div className="flex flex-col gap-3">
      {/* Filter + Sort */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1 bg-white/60 rounded-xl p-1 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === s ? 'tab-active' : 'text-slate-500'}`}
              style={{fontFamily:'var(--font-ja)'}}>{s}</button>
          ))}
        </div>
        <select
          className="ml-auto text-xs bg-white/60 border border-white/60 rounded-xl px-3 py-1.5 text-slate-500 font-semibold outline-none"
          value={sort} onChange={e => setSort(e.target.value)}
          style={{fontFamily:'var(--font-ja)'}}
        >
          <option value="profit_desc">利益 高→低</option>
          <option value="profit_asc">利益 低→高</option>
          <option value="newest">新しい順</option>
        </select>
      </div>

      {/* Count */}
      <div className="text-xs text-slate-400 px-1" style={{fontFamily:'var(--font-ja)'}}>{filtered.length}件</div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-slate-400 text-sm" style={{fontFamily:'var(--font-ja)'}}>
          まだ商品がありません。<br />「入力」タブから追加してください。
        </div>
      ) : (
        filtered.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            config={config}
            myName={myName}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))
      )}
      <div className="pb-8" />
    </div>
  );
}
