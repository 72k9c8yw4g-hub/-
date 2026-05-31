import { useState } from 'react';
import { useStore } from './lib/store.js';
import { isConfigured } from './lib/supabase.js';
import InputForm from './components/InputForm.jsx';
import ListTab from './components/ListTab.jsx';
import AnalyticsTab from './components/AnalyticsTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';

const TABS = [
  { id: 'input',     label: '入力', icon: '＋' },
  { id: 'list',      label: '一覧', icon: '≡' },
  { id: 'analytics', label: '分析', icon: '◎' },
  { id: 'settings',  label: '設定', icon: '⚙' },
];

export default function App() {
  const { items, config, myName, setMyName, syncing, addItem, updateItem, deleteItem, saveConfig } = useStore();
  const [tab, setTab] = useState('input');
  const [editingItem, setEditingItem] = useState(null);

  const handleSubmit = (fields) => {
    if (editingItem) {
      updateItem(editingItem.id, { ...fields, _action: '編集' }, myName || '不明');
      setEditingItem(null);
    } else {
      addItem({ ...fields, createdBy: myName || '不明', shipping: fields.shipping ?? config.shipping });
    }
    setTab('list');
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setTab('input');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl select-none">🃏</span>
          <span className="text-xl font-bold tracking-tight holo-text" style={{fontFamily:'var(--font-display)'}}>FUDA</span>
          {syncing && <span className="text-xs text-slate-400 animate-pulse ml-1" style={{fontFamily:'var(--font-ja)'}}>同期中…</span>}
          {!isConfigured && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full ml-1" style={{fontFamily:'var(--font-ja)'}}>オフライン</span>}
        </div>
        {myName ? (
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-semibold" style={{fontFamily:'var(--font-ja)'}}>{myName}</span>
        ) : (
          <button onClick={() => setTab('settings')}
            className="text-xs bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-semibold border border-amber-100"
            style={{fontFamily:'var(--font-ja)'}}>名前を設定</button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-4 pb-24">
        {tab === 'input' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold" style={{fontFamily:'var(--font-ja)'}}>
                {editingItem ? '商品を編集' : '商品を入力'}
              </h2>
              {editingItem && (
                <button onClick={handleCancelEdit}
                  className="text-xs text-slate-400 underline ml-auto"
                  style={{fontFamily:'var(--font-ja)'}}>キャンセル</button>
              )}
            </div>
            <InputForm
              config={config}
              myName={myName}
              members={config.members}
              onSubmit={handleSubmit}
              onCancel={editingItem ? handleCancelEdit : null}
              initial={editingItem || undefined}
              key={editingItem?.id || 'new'}
            />
          </div>
        )}
        {tab === 'list' && (
          <ListTab
            items={items}
            config={config}
            myName={myName}
            onUpdate={updateItem}
            onDelete={deleteItem}
            onEdit={handleEdit}
          />
        )}
        {tab === 'analytics' && <AnalyticsTab items={items} config={config} />}
        {tab === 'settings' && (
          <SettingsTab
            config={config}
            myName={myName}
            onSave={saveConfig}
            onMyNameChange={setMyName}
          />
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg glass border-t border-white/40 z-30 px-2 pb-safe">
        <div className="flex">
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => { setTab(t.id); if (t.id !== 'input') setEditingItem(null); }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 rounded-lg transition-all ${tab === t.id ? 'tab-active' : 'text-slate-400'}`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="text-[10px] font-semibold" style={{fontFamily:'var(--font-ja)'}}>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
