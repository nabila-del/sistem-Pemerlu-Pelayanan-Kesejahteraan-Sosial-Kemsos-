// --- 1. INISIALISASI UTAMA & LUCIDE ICONS ---
document.addEventListener('DOMContentLoaded', () => {
    // Render icon Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Otomatis load opsi Jenis PPKS jika ada elemen dropdown di halaman
    if (document.getElementById('jenisPpksSelect')) {
        loadJenisOptions();
    }
});

// --- 2. FUNGSI UTILITAS GLOBAL ---
function confirmDelete(message = 'Apakah Anda yakin ingin menghapus data ini?') {
    return confirm(message);
}

// --- 3. MEMUAT OPTION JENIS PPKS DARI SUPABASE ---
async function loadJenisOptions() {
    const selectElement = document.getElementById('jenisPpksSelect');
    if (!selectElement) return;

    try {
        const { data, error } = await supabaseClient
            .from('jenis_ppks')
            .select('kode_jenis, nama_jenis')
            .order('kode_jenis', { ascending: true });

        if (error) throw error;

        // Reset & set default option
        selectElement.innerHTML = '<option value="">-- Pilih Jenis PPKS --</option>';

        if (data && data.length > 0) {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.nama_jenis;
                option.textContent = `[${item.kode_jenis}] ${item.nama_jenis}`;
                selectElement.appendChild(option);
            });
        } else {
            selectElement.innerHTML = '<option value="">Belum ada master jenis PPKS</option>';
        }
    } catch (err) {
        console.error('Gagal memuat opsi Jenis PPKS:', err.message);
    }
}