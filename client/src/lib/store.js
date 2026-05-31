import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isConfigured, TEAM } from './supabase.js';
import { genId } from './calc.js';

const DEFAULT_CONFIG = {
  members: ['メンバー1', 'メンバー2', 'メンバー3', 'メンバー4'],
  feeRates: { ヤフオク: 10, 'Yahoo!フリマ': 5 },
  shipping: 210,
  thresholds: { honmei: 500, jikken: 80 },
  costLimit: 4000,
};

function loadLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveLocal(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function useStore() {
  const [items, setItems] = useState(() => loadLocal('fuda_items', []));
  const [config, setConfig] = useState(() => loadLocal('fuda_config', DEFAULT_CONFIG));
  const [myName, setMyName] = useState(() => localStorage.getItem('fuda_myname') || '');
  const [syncing, setSyncing] = useState(false);
  const channelRef = useRef(null);

  // Persist locally
  useEffect(() => { saveLocal('fuda_items', items); }, [items]);
  useEffect(() => { saveLocal('fuda_config', config); }, [config]);
  useEffect(() => { if (myName) localStorage.setItem('fuda_myname', myName); }, [myName]);

  // Supabase sync
  useEffect(() => {
    if (!isConfigured || !supabase) return;

    // Initial fetch
    (async () => {
      setSyncing(true);
      const [{ data: itemRows }, { data: cfgRow }] = await Promise.all([
        supabase.from('items').select('*').eq('team', TEAM),
        supabase.from('config').select('*').eq('team', TEAM).maybeSingle(),
      ]);
      if (itemRows) setItems(itemRows.map(r => r.data));
      if (cfgRow?.data) setConfig({ ...DEFAULT_CONFIG, ...cfgRow.data });
      setSyncing(false);
    })();

    // Realtime
    const ch = supabase
      .channel(`fuda:${TEAM}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `team=eq.${TEAM}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(i => i.id !== payload.old.id));
        } else {
          const incoming = payload.new.data;
          setItems(prev => {
            const idx = prev.findIndex(i => i.id === incoming.id);
            if (idx === -1) return [...prev, incoming];
            const copy = [...prev];
            copy[idx] = incoming;
            return copy;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config', filter: `team=eq.${TEAM}` }, (payload) => {
        if (payload.new?.data) setConfig(c => ({ ...DEFAULT_CONFIG, ...c, ...payload.new.data }));
      })
      .subscribe();

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, []);

  const upsertItem = useCallback(async (item) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx === -1) return [...prev, item];
      const copy = [...prev]; copy[idx] = item; return copy;
    });
    if (isConfigured && supabase) {
      await supabase.from('items').upsert({ id: item.id, team: TEAM, data: item, updated_at: new Date().toISOString() });
    }
  }, []);

  const deleteItem = useCallback(async (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
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

  const addItem = useCallback((fields) => {
    const now = new Date().toISOString();
    const item = {
      id: genId(),
      ...fields,
      status: fields.status || '保留',
      outcome: '未確定',
      createdBy: fields.createdBy,
      createdAt: now,
      updatedBy: fields.createdBy,
      updatedAt: now,
      history: [{ by: fields.createdBy, at: now, action: '作成' }],
    };
    upsertItem(item);
    return item;
  }, [upsertItem]);

  const updateItem = useCallback((id, changes, by) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const now = new Date().toISOString();
      const updated = {
        ...prev[idx],
        ...changes,
        updatedBy: by,
        updatedAt: now,
        history: [...(prev[idx].history || []), { by, at: now, action: changes._action || '更新' }],
      };
      delete updated._action;
      const copy = [...prev]; copy[idx] = updated;
      if (isConfigured && supabase) {
        supabase.from('items').upsert({ id: updated.id, team: TEAM, data: updated, updated_at: now });
      }
      return copy;
    });
  }, []);

  return { items, config, myName, setMyName, syncing, addItem, updateItem, deleteItem, saveConfig, isConfigured };
}
