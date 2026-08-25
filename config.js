// config.js
// Replace these with your actual Supabase Project URL and Publishable Key.
// You can find these in the Supabase Dashboard -> Settings -> API.
// These are safe to expose in the browser as long as Row Level Security (RLS) is enabled.

const SUPABASE_URL = 'https://touvozdfmzpqaacngipe.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ln501-WhRculigRnlT-cqA_n__bhbm9';

// Initialize the Supabase client using the globally available library
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
