// --- KONFIGURASI SUPABASE GLOBAL ---
const SUPABASE_URL = 'https://txzrpbfoavfuivziapyl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YBg8Bci64W6-vadAIfhM7g_RPy4YBxO';

// Inisialisasi Supabase Client & Simpan ke Window/Global
if (typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error('Supabase SDK belum dimuat di HTML!');
}