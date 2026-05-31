import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const TEAM = import.meta.env.VITE_TEAM || 'fuda-team';

// Return null client when not configured — app works in offline/demo mode
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
