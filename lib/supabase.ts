
import { createClient } from '@supabase/supabase-js';

// Provided credentials hardcoded for development persistence
export const DEFAULT_URL = 'https://pmqmifcbtdolydsiwybl.supabase.co';
export const DEFAULT_KEY = 'sb_publishable_hZGrO0a63pq8VeYn4huZ3A_7KxoDXAp';

export const CURRENT_URL = process.env.SUPABASE_URL || localStorage.getItem('SB_URL') || DEFAULT_URL;
export const CURRENT_KEY = process.env.SUPABASE_ANON_KEY || localStorage.getItem('SB_ANON_KEY') || DEFAULT_KEY;

export const supabase = createClient(CURRENT_URL, CURRENT_KEY);

export const SUPABASE_CONFIG_VALID = !!(CURRENT_URL && CURRENT_KEY);

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('SB_URL', url.trim().replace(/\/$/, ""));
  localStorage.setItem('SB_ANON_KEY', key.trim());
  window.location.reload();
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('SB_URL');
  localStorage.removeItem('SB_ANON_KEY');
  window.location.reload();
};
