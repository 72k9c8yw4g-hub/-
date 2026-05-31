import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isConfigured, TEAM } from './supabase.js';
import { genId, isExpiredReject } from './calc.js';

export const DEFAULT_CONFIG = {
  members: ['メンバー1', 'メンバー2', 'メンバー3', 'メンバー4'],
  feeRates: { ヤフオク: 10, 'Yahoo!フリマ': 5 },
  shipping: 210,
  costLimit: 4000,
  alertDays: 14,
};

function loadLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveLocal(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function useStore() {
  const [allItems, setAllItems] = useState(() => loadLocal('fuda_items', []));
  const [config, setConfig] = useState(() => ({ ...DEFAULT_CONFIG, ...loadLocal('fuda_config', {}) }));
  const [myName, setMyName] = useState(() => localStorage.getItem('fuda_myname') || '');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { saveLocal('fuda_items', allItems); }, [allItems]);
  useEffect(() => { saveLocal('fuda_config', config); }, [config]);
  useEffect(() => { if (myName) localStorage.setItem('fuda_myname', myName); }, [myName]);

  useEffect(() => {
    if (!isConfigured || !supabase) return;
    (async () => {
      setSyncing(true);
      const [{ data: itemRows }, { data: cfgRow }] = await Promise.all([
        supabase.from('items').select('*').eq('team', TEAM),
        supabase.from('config').select('*').eq('team', TEAM).maybeSingle(),
      ]);
      if (itemRows) setAllItems(itemRows.map(r => r.data));
      if (cfgRow?.data) setConfig(c => ({ ...DEFAULT_CONFIG, ...c, ...cfgRow.data }));
      setSyncing(false);
    })();

    const ch = supabase.channel(`fuda:${TEAM}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `team=eq.${TEAM}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setAllItems(prev => prev.filter(i => i.id !== payload.old.id));
        } else {
          const incoming = payload.new.data;
          setAllItems(prev => {
            const idx = prev.findIndex(i => i.id === incoming.id);
            if (idx === -1) return [...prev, incoming];
            const copy = [...prev]; copy[idx] = incoming; return copy;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config', filter: `team=eq.${TEAM}` }, (payload) => {
        if (payload.new?.data) setConfig(c => ({ ...DEFAULT_CONFIG, ...c, ...payload.new.data }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const _upsert = useCallback(async (item) => {
    setAllItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx === -1) return [...prev, item];
      const copy = [...prev]; copy[idx] = item; return copy;
    });
    if (isConfigured && supabase) {
      await supabase.from('items').upsert({ id: item.id, team: TEAM, data: item, updated_at: new Date().toISOString() });
    }
  }, []);

  const addItem = useCallback((fields, by) => {
    const now = new Date().toISOString();
    const item = {
      id: genId(),
      name: fields.name,
      platform: fields.platform || 'ヤフオク',
      url: fields.url || '',
      memo: fields.memo || '',
      status: 'pending', // 保留中
      purchasePrice: null,
      salePrice: null,
      priceHistory: [],
      createdBy: by,
      createdAt: now,
      updatedBy: by,
      updatedAt: now,
      rejectedAt: null,
      purchasedAt: null,
      soldAt: null,
      history: [{ by, at: now, action: '登録' }],
    };
    _upsert(item);
    return item;
  }, [_upsert]);

  const updateItem = useCallback((id, changes, by, action = '更新') => {
    setAllItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const now = new Date().toISOString();
      const updated = {
        ...prev[idx],
        ...changes,
        updatedBy: by,
        updatedAt: now,
        history: [...(prev[idx].history || []), { by, at: now, action }],
      };
      const copy = [...prev]; copy[idx] = updated;
      if (isConfigured && supabase) {
        supabase.from('items').upsert({ id: updated.id, team: TEAM, data: updated, updated_at: now });
      }
      return copy;
    });
  }, []);

  const deleteItem = useCallback(async (id) => {
    setAllItems(prev => prev.filter(i => i.id !== id));
    if (isConfigured && supabase) {
      await supabase.from('items').delete().eq('id', id).eq('team', TEAM);
    }
  }, []);

  const saveConfig = useCallback(async (cfg) => {
    setConfig(cfg);
    if (isConfigured && supabase) {
      await supabase.from('config').upsert({ team: TEAM, data: cfg });
    }
  }, []);

  // 有効なアイテム（却下40日経過除く）
  const items = allItems.filter(i => !isExpiredReject(i));

  return { items, allItems, config, myName, setMyName, syncing, addItem, updateItem, deleteItem, saveConfig, isConfigured };
}
