import { createClient } from '@supabase/supabase-js';

// Placeholders keep `next build` working before env vars are set.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(url, key);

export const RESTAURANT = process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'QR Dine Restaurant';
export const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || '';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
];

export const tr = (obj, lang) => (obj && (obj[lang] || obj.en)) || '';
export const rupee = (n) => 'Rs. ' + Number(n || 0).toFixed(0);
