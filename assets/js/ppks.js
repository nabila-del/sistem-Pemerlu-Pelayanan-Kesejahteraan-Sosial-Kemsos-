// Variable Global
let allPpksData = [];
let sedangProses = false;
let editId = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Icon Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Proteksi & Penyesuaian UI Berdasarkan Role
    setupRoleUI();

    // 3. Load Data PPKS dari Supabase
    loadDataPPKS();
});

// --- FUNGSI CEK ROLE & SESUAIKAN UI ---
function getUserRole() {
    try {
        const sessionData = localStorage.getItem('loggedInUser');
        if (!sessionData) return '';
        const user = JSON.parse(sessionData);
        return (user.role || '').toLowerCase();
    } catch (e) {
        return '';
    }
}

function setupRoleUI() {
    const role = getUserRole();
    
    // Jika Kadis / Pimpinan, sembunyikan tombol Tambah Data di halaman
    if (role === 'kadis' || role === 'pimpinan') {
        const btnTambah = document.getElementById('btnTambahData');
        if (btnTambah) btnTambah.style.display = 'none';

        const colAksiHeader = document.querySelector('.col-aksi');
        if (colAksiHeader) colAksiHeader.style.display = 'none';
    }
}

// --- A. FUNGSI BUKA & TUTUP MODAL ---
window.openModal = function() {
    // Kadis tidak diperbolehkan membuka modal
    const role = getUserRole();
    if (role === 'kadis' || role === 'pimpinan') return;

    editId = null;
    const form = document.getElementById('ppksForm');
    if (form) form.reset();

    const title = document.getElementById('modalTitle');
    if (title) title.textContent = 'Tambah Data PPKS';

    toggleModal(true);
};

window.closeModal = function() {
    toggleModal(false);
};

function toggleModal(show) {
    const modal = document.getElementById('modalForm');
    if (!modal) return;

    if (show) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    } else {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');

            editId = null;
            const form = document.getElementById('ppksForm');
            if (form) form.reset();
            
            const title = document.getElementById('modalTitle');
            if (title) title.textContent = 'Tambah Data PPKS';
        }, 300);
    }
}

// --- B. FUNGSI SIMPAN & EDIT DATA (saveData) ---
window.saveData = async function(event) {
    if (event) event.preventDefault();

    // Blokir jika pengguna adalah Kadis
    const role = getUserRole();
    if (role === 'kadis' || role === 'pimpinan') {
        alert('Akses ditolak! Kepala Dinas hanya dapat melihat data.');
        return;
    }

    if (sedangProses) return;

    const inputNik = document.getElementById('inputNik');
    const inputNama = document.getElementById('inputNama');
    const inputJenis = document.getElementById('inputJenis');
    const inputWilayah = document.getElementById('inputWilayah');
    const btnSubmit = event?.target ? event.target.querySelector('button[type="submit"]') : null;

    const nik = inputNik ? inputNik.value.trim() : '';
    const nama = inputNama ? inputNama.value.trim() : '';
    const jenis_ppks = inputJenis ? inputJenis.value : '';
    const alamat = inputWilayah ? inputWilayah.value.trim() : '';

    if (!nik || !nama || !jenis_ppks || !alamat) {
        alert('Harap isi semua kolom form!');
        return;
    }

    try {
        sedangProses = true;
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerText = 'Menyimpan...';
            btnSubmit.classList.add('opacity-50', 'pointer-events-none');
        }

        if (editId) {
            // UPDATE DATA
            const { error } = await supabaseClient
                .from('data_ppks')
                .update({ nik, nama, jenis_ppks, alamat })
                .eq('id', editId);

            if (error) throw error;
        } else {
            // TAMBAH DATA BARU
            const { error } = await supabaseClient
                .from('data_ppks')
                .insert([{ nik, nama, jenis_ppks, alamat }]);

            if (error) throw error;
        }

        toggleModal(false);
        await loadDataPPKS();

    } catch (err) {
        alert('Gagal menyimpan data: ' + err.message);
    } finally {
        sedangProses = false;
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Simpan Data';
            btnSubmit.classList.remove('opacity-50', 'pointer-events-none');
        }
    }
};

// --- C. FUNGSI AMBIL DATA DARI SUPABASE ---
async function loadDataPPKS() {
    const tableBody = document.getElementById('tableBody');
    const totalPPKS = document.getElementById('totalPPKS');

    try {
        const { data, error } = await supabaseClient
            .from('data_ppks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allPpksData = data || [];

        if (totalPPKS) {
            totalPPKS.textContent = `${allPpksData.length} Data`;
        }

        renderTable(allPpksData);

    } catch (err) {
        console.error('Gagal memuat data PPKS:', err.message);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-6 text-rose-500 font-medium">Gagal memuat data: ${err.message}</td>
                </tr>`;
        }
    }
}

// --- D. FUNGSI RENDER TABEL ---
function renderTable(dataList) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    const role = getUserRole();
    const isKadis = (role === 'kadis' || role === 'pimpinan');

    if (!dataList || dataList.length === 0) {
        const colSpan = isKadis ? 4 : 5;
        tableBody.innerHTML = `
            <tr>
                <td colspan="${colSpan}" class="text-center py-8 text-slate-400">Belum ada data PPKS terdaftar.</td>
            </tr>`;
        return;
    }

    dataList.forEach((item) => {
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50 smooth-transition animate-row";

        // Jika Kadis, sembunyikan sel/kolom aksi
        const aksiTd = isKadis ? '' : `
            <td class="p-4 text-center">
                <div class="flex items-center justify-center gap-2 relative z-10">
                    <button type="button" onclick="editPPKS('${item.id}')" class="cursor-pointer text-teal-600 hover:text-teal-800 p-2 rounded-lg hover:bg-teal-100 active:scale-90 smooth-transition" title="Edit Data">
                        <i data-lucide="pencil" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                    <button type="button" onclick="deletePPKS('${item.id}')" class="cursor-pointer text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-100 active:scale-90 smooth-transition" title="Hapus Data">
                        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </td>
        `;

        row.innerHTML = `
            <td class="p-4 font-mono font-medium text-slate-700">${item.nik || '-'}</td>
            <td class="p-4 font-medium text-slate-800">${item.nama || '-'}</td>
            <td class="p-4 font-semibold text-teal-600">${item.jenis_ppks || '-'}</td>
            <td class="p-4 text-slate-600">${item.alamat || '-'}</td>
            ${aksiTd}
        `;
        tableBody.appendChild(row);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- E. FUNGSI EDIT DATA ---
window.editPPKS = function(id) {
    const role = getUserRole();
    if (role === 'kadis' || role === 'pimpinan') {
        alert('Akses ditolak! Kadis/Pimpinan tidak memiliki izin mengedit data.');
        return;
    }

    const item = allPpksData.find(d => String(d.id) === String(id));
    if (!item) return;

    editId = item.id;

    if (document.getElementById('inputNik')) document.getElementById('inputNik').value = item.nik || '';
    if (document.getElementById('inputNama')) document.getElementById('inputNama').value = item.nama || '';
    if (document.getElementById('inputJenis')) document.getElementById('inputJenis').value = item.jenis_ppks || '';
    if (document.getElementById('inputWilayah')) document.getElementById('inputWilayah').value = item.alamat || '';

    if (document.getElementById('modalTitle')) document.getElementById('modalTitle').textContent = 'Edit Data PPKS';

    toggleModal(true);
};

// --- F. FUNGSI HAPUS DATA ---
window.deletePPKS = async function(id) {
    const role = getUserRole();
    if (role === 'kadis' || role === 'pimpinan') {
        alert('Akses ditolak! Kadis/Pimpinan tidak memiliki izin menghapus data.');
        return;
    }

    if (!confirm('Apakah Anda yakin ingin menghapus data PPKS ini?')) return;

    try {
        const { error } = await supabaseClient
            .from('data_ppks')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await loadDataPPKS();
    } catch (err) {
        alert('Gagal menghapus data: ' + err.message);
    }
};

// --- G. FUNGSI PENCARIAN (SEARCH) ---
window.filterData = function() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    const filtered = allPpksData.filter(item => {
        const nik = (item.nik || '').toLowerCase();
        const nama = (item.nama || '').toLowerCase();
        const jenis = (item.jenis_ppks || '').toLowerCase();
        const alamat = (item.alamat || '').toLowerCase();

        return nik.includes(searchInput) || 
               nama.includes(searchInput) || 
               jenis.includes(searchInput) || 
               alamat.includes(searchInput);
    });

    renderTable(filtered);
};