// Inisialisasi saat dokumen selesai dimuat
document.addEventListener('DOMContentLoaded', function() {
    if (window.lucide) {
        lucide.createIcons();
    }
    loadJenisPPKS();
});

/**
 * Otomatis mengisi kode jenis berdasarkan pilihan dropdown Nama Jenis PPKS
 */
function autoFillKode() {
    const select = document.getElementById('namaJenisInput');
    const kodeInput = document.getElementById('kodeJenisInput');
    
    if (!select || !kodeInput) return;

    const selectedOption = select.options[select.selectedIndex];
    const kodeData = selectedOption ? selectedOption.getAttribute('data-kode') : null;

    // Jika opsi memiliki attribute data-kode, gunakan kode tersebut.
    // Jika tidak ada, gunakan nomor index pilihan (fallback).
    if (kodeData) {
        kodeInput.value = kodeData;
    } else if (select.selectedIndex > 0) {
        const kodeNumber = String(select.selectedIndex).padStart(2, '0');
        kodeInput.value = `PPKS-${kodeNumber}`;
    } else {
        kodeInput.value = '';
    }
}

/**
 * Mengambil dan menampilkan daftar Jenis PPKS dari Supabase
 */
async function loadJenisPPKS() {
    const tableBody = document.getElementById('jenisTableBody');
    if (!tableBody) return;

    const client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);

    if (!client) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-6 text-rose-500 font-semibold">
                    Koneksi Supabase tidak ditemukan. Periksa konfigurasi supabase.js.
                </td>
            </tr>`;
        return;
    }

    try {
        const { data, error } = await client
            .from('jenis_ppks')
            .select('*')
            .order('kode_jenis', { ascending: true });

        if (error) throw error;

        tableBody.innerHTML = '';

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-6 text-slate-400 dark:text-slate-400">
                        Belum ada data jenis PPKS. Klik tombol "Tambah Jenis" untuk menambahkan.
                    </td>
                </tr>`;
            return;
        }

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = "border-b border-slate-100 dark:border-slate-700/60 hover:bg-emerald-50/40 dark:hover:bg-slate-700/40 transition-colors";
            
            row.innerHTML = `
                <td class="py-3.5 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">${index + 1}</td>
                <td class="py-3.5 px-4 text-sm font-mono text-emerald-600 dark:text-emerald-400 font-bold">${item.kode_jenis || '-'}</td>
                <td class="py-3.5 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100">${item.nama_jenis || '-'}</td>
                <td class="py-3.5 px-4 text-sm text-slate-600 dark:text-slate-300">${item.keterangan || '-'}</td>
            `;
            tableBody.appendChild(row);
        });

        // Re-initialize Lucide Icons jika ada ikon baru
        if (window.lucide) {
            lucide.createIcons();
        }

    } catch (err) {
        console.error('Gagal memuat jenis PPKS:', err.message);
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-6 text-rose-500 font-medium">
                    Gagal memuat data: ${err.message}
                </td>
            </tr>`;
    }
}

/**
 * Memproses penambahan data Jenis PPKS baru ke Supabase
 */
async function handleAddJenisPPKS(event) {
    event.preventDefault();

    const client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (!client) {
        alert('Koneksi Supabase tidak ditemukan!');
        return;
    }

    const kode_jenis = document.getElementById('kodeJenisInput').value.trim();
    const nama_jenis = document.getElementById('namaJenisInput').value.trim();
    const keterangan = document.getElementById('keteranganInput').value.trim();

    if (!kode_jenis || !nama_jenis) {
        alert('Silakan pilih Jenis PPKS terlebih dahulu!');
        return;
    }

    try {
        const { data, error } = await client
            .from('jenis_ppks')
            .insert([{ 
                kode_jenis, 
                nama_jenis, 
                keterangan: keterangan || null 
            }]);

        if (error) throw error;

        alert('Berhasil menambahkan Jenis PPKS baru!');
        closeModal();
        await loadJenisPPKS();

    } catch (err) {
        console.error('Error saat menyimpan:', err.message);
        alert('Gagal menambah data: ' + err.message);
    }
}

/**
 * Membuka Modal Tambah Jenis PPKS
 */
function openModal() {
    const modal = document.getElementById('jenisModal');
    if (modal) modal.classList.remove('hidden');
}

/**
 * Menutup Modal dan mereset form
 */
function closeModal() {
    const modal = document.getElementById('jenisModal');
    if (modal) {
        modal.classList.add('hidden');
        const form = document.getElementById('formJenisPPKS');
        if (form) form.reset();
    }
}