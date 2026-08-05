document.addEventListener('DOMContentLoaded', function() {
    if (window.lucide) {
        lucide.createIcons();
    }
    loadJenisPPKS();
});

// --- FUNGSI ISI KODE BERDASARKAN URUTAN OPSI DROPDOWN ---
function autoFillKode() {
    const select = document.getElementById('namaJenisInput');
    const kodeInput = document.getElementById('kodeJenisInput');
    
    if (!select || !kodeInput) return;

    // Ambil indeks opsi yang dipilih user
    const selectedIndex = select.selectedIndex;

    if (selectedIndex > 0) {
        // Otomatis buat kode sesuai urutan opsi (contoh: Opsi 4 -> PPKS-04)
        const kodeNumber = String(selectedIndex).padStart(2, '0');
        kodeInput.value = `PPKS-${kodeNumber}`;
    } else {
        kodeInput.value = '';
    }
}

// --- MEMUAT DATA JENIS PPKS DARI SUPABASE ---
async function loadJenisPPKS() {
    try {
        const { data, error } = await supabaseClient
            .from('jenis_ppks')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const tableBody = document.getElementById('jenisTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-6 text-slate-400">Belum ada data jenis PPKS. Klik tombol "Tambah Jenis" untuk menambahkan.</td>
                </tr>`;
            return;
        }

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = "border-b border-slate-100 hover:bg-slate-50/50 transition-colors";
            row.innerHTML = `
                <td class="py-3.5 px-4 text-sm font-semibold text-slate-700">${index + 1}</td>
                <td class="py-3.5 px-4 text-sm font-mono text-teal-600 font-bold">${item.kode_jenis || '-'}</td>
                <td class="py-3.5 px-4 text-sm font-medium text-slate-800">${item.nama_jenis || '-'}</td>
                <td class="py-3.5 px-4 text-sm text-slate-500">${item.keterangan || '-'}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error('Gagal memuat jenis PPKS:', err.message);
    }
}

// --- MENAMBAHKAN DATA BARU KE SUPABASE ---
async function handleAddJenisPPKS(event) {
    event.preventDefault();

    const kode_jenis = document.getElementById('kodeJenisInput').value.trim();
    const nama_jenis = document.getElementById('namaJenisInput').value.trim();
    const keterangan = document.getElementById('keteranganInput').value.trim();

    if (!kode_jenis || !nama_jenis) {
        alert('Silakan pilih Jenis PPKS terlebih dahulu!');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('jenis_ppks')
            .insert([{ kode_jenis, nama_jenis, keterangan }]);

        if (error) throw error;

        // Reset form & tutup modal
        document.getElementById('formJenisPPKS').reset();
        closeModal();

        // Refresh data tabel
        loadJenisPPKS();

    } catch (err) {
        alert('Gagal menambah data: ' + err.message);
    }
}

// --- HANDLER MODAL ---
function openModal() {
    const modal = document.getElementById('jenisModal');
    if (modal) modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('jenisModal');
    if (modal) {
        modal.classList.add('hidden');
        const form = document.getElementById('formJenisPPKS');
        if (form) form.reset();
    }
}