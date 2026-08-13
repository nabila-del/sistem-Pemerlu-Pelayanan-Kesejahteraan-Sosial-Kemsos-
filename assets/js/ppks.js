// --- SCRIPT LENGKAP HALAMAN DATA PPKS (ppks.js) ---

let rawPpksData = [];

document.addEventListener('DOMContentLoaded', async function () {
    // 1. Cek Sesi Login Admin
    const sessionData = localStorage.getItem('loggedInUser');
    if (!sessionData) {
        window.location.replace('login.html');
        return;
    }

    try {
        const user = JSON.parse(sessionData);
        const role = (user.role || '').toLowerCase();

        if (role === 'warga') {
            alert('Akses Ditolak! Anda tidak memiliki izin mengakses halaman ini.');
            window.location.replace('form-lapor.html');
            return;
        }

        const nameElem = document.getElementById('userAdminName');
        const roleElem = document.getElementById('userAdminRole');
        if (nameElem) nameElem.textContent = user.nama || user.username || 'Pengguna';
        if (roleElem) roleElem.textContent = user.role || 'Admin';

    } catch (err) {
        localStorage.removeItem('loggedInUser');
        window.location.replace('login.html');
        return;
    }

    initTheme();
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    await fetchPpksData();
});

// --- PENGATURAN TEMA (DARK MODE) ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

    if (shouldBeDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeUI(shouldBeDark);
}

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeUI(isDark);
}

function updateThemeUI(isDark) {
    const label = document.getElementById('themeLabel');
    const icon = document.getElementById('themeIcon');

    if (label) {
        label.textContent = isDark ? 'Mode Gelap' : 'Mode Terang';
    }

    if (icon) {
        icon.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// --- MENGAMBIL DATA PPKS DARI SUPABASE (+ CEK SUMBER DATA: ADMIN / WARGA) ---
async function fetchPpksData() {
    const tableBody = document.getElementById('ppksTableBody');
    const counterEl = document.getElementById('tableCountText');
    const totalStatEl = document.getElementById('totalPpksStat');
    const client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);

    if (!client) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="p-6 text-center text-rose-500 font-semibold dark:text-rose-400">
                        Gagal terhubung ke Supabase. Periksa file supabase.js.
                    </td>
                </tr>`;
        }
        if (counterEl) counterEl.textContent = 'Koneksi gagal';
        if (totalStatEl) totalStatEl.textContent = '0 Data';
        return;
    }

    try {
        const { data, error } = await client
            .from('data_ppks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const { data: wargaList, error: wargaErr } = await client
            .from('users_warga')
            .select('nik');

        if (wargaErr) {
            console.error('Gagal mengambil data users_warga:', wargaErr.message);
        }

        const wargaNikSet = new Set(
            (wargaList || [])
                .map(w => (w.nik || '').toString().trim())
                .filter(Boolean)
        );

        rawPpksData = (data || []).map(item => ({
            ...item,
            sumberData: wargaNikSet.has((item.nik || '').toString().trim()) ? 'warga' : 'admin'
        }));

        if (totalStatEl) {
            totalStatEl.textContent = `${rawPpksData.length} Data`;
        }

        renderPpksTable(rawPpksData);

    } catch (err) {
        console.error('Error Supabase:', err.message);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="p-6 text-center text-rose-500 font-medium dark:text-rose-400">
                        Error: ${err.message}
                    </td>
                </tr>`;
        }
        if (counterEl) counterEl.textContent = 'Gagal memuat data';
        if (totalStatEl) totalStatEl.textContent = '0 Data';
    }
}

// --- RENDER TABEL PPKS (+ KOLOM SUMBER DATA) ---
function renderPpksTable(dataList) {
    const tableBody = document.getElementById('ppksTableBody');
    const counterEl = document.getElementById('tableCountText');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (counterEl) {
        counterEl.textContent = `Menampilkan ${dataList.length} dari ${rawPpksData.length} data`;
    }

    if (!dataList || dataList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="p-6 text-center text-slate-400 dark:text-slate-500">
                    Belum ada data PPKS yang terdaftar di database.
                </td>
            </tr>`;
        return;
    }

    dataList.forEach((item) => {
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-150";

        let statusBadge = '';
        let actionButtons = '';
        const statusVal = (item.status || 'pending').toLowerCase().trim();

        const sumberBadge = item.sumberData === 'warga'
            ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                    <i data-lucide="megaphone" class="w-3 h-3 mr-1"></i> Lapor Warga
               </span>`
            : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                    <i data-lucide="shield" class="w-3 h-3 mr-1"></i> Input Admin
               </span>`;

        if (statusVal === 'disetujui' || statusVal === 'acc' || statusVal === 'selesai') {
            statusBadge = `
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    Disetujui
                </span>`;

            actionButtons = `
                <div class="flex items-center justify-center gap-1.5">
                    <span class="text-xs text-slate-400 dark:text-slate-500 italic font-medium px-2 py-1">Selesai</span>
                    <button onclick="deletePpks('${item.id}')" class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/15 transition-colors cursor-pointer ml-1" title="Hapus Data">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>`;

        }
        else if (statusVal === 'proses') {
            statusBadge = `
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    Proses
                </span>`;

            actionButtons = `
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="updateStatus('${item.id}', 'Disetujui')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-sm transition-all cursor-pointer flex items-center gap-1.5" title="Setujui / ACC">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i> ACC
                    </button>
                    <button onclick="deletePpks('${item.id}')" class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/15 transition-colors cursor-pointer ml-1" title="Hapus Data">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>`;

        }
        else {
            statusBadge = `
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Pending
                </span>`;

            actionButtons = `
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="updateStatus('${item.id}', 'Proses')" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-md shadow-sm transition-all cursor-pointer flex items-center gap-1" title="Ubah ke Proses">
                        <i data-lucide="clock" class="w-3.5 h-3.5"></i> Proses
                    </button>
                    <button onclick="updateStatus('${item.id}', 'Disetujui')" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-sm transition-all cursor-pointer flex items-center gap-1" title="Setujui / ACC">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i> ACC
                    </button>
                    <button onclick="deletePpks('${item.id}')" class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/15 transition-colors cursor-pointer ml-1" title="Hapus Data">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>`;
        }

        row.innerHTML = `
            <td class="p-3.5 pl-6 font-mono text-xs text-slate-800 dark:text-slate-200">${item.nik || '-'}</td>
            <td class="p-3.5 font-semibold text-slate-800 dark:text-slate-100">${item.nama || '-'}</td>
            <td class="p-3.5">
                <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    ${item.jenis_ppks || '-'}
                </span>
            </td>
            <td class="p-3.5 text-slate-600 dark:text-slate-300">${item.alamat || '-'}</td>
            <td class="p-3.5 text-center">${sumberBadge}</td>
            <td class="p-3.5 text-center">${statusBadge}</td>
            <td class="p-3.5 pr-6 text-center">${actionButtons}</td>
        `;
        tableBody.appendChild(row);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- UPDATE STATUS KE SUPABASE ---
async function updateStatus(id, newStatus) {
    const client = window.supabaseClient;
    try {
        const targetId = isNaN(id) ? id : Number(id);
        const { error } = await client
            .from('data_ppks')
            .update({ status: newStatus })
            .eq('id', targetId);

        if (error) throw error;

        await fetchPpksData();
    } catch (err) {
        alert('Gagal memperbarui status: ' + err.message);
    }
}

// --- PENCARIAN / FILTER TABEL PPKS ---
function filterPpksTable() {
    const keyword = document.getElementById('searchPpksInput').value.toLowerCase();

    const filtered = rawPpksData.filter(item => {
        const nik = (item.nik || '').toLowerCase();
        const nama = (item.nama || '').toLowerCase();
        const jenis = (item.jenis_ppks || '').toLowerCase();
        const alamat = (item.alamat || '').toLowerCase();
        const status = (item.status || 'pending').toLowerCase();
        const sumber = item.sumberData === 'warga' ? 'lapor warga' : 'input admin';

        return nik.includes(keyword) || nama.includes(keyword) || jenis.includes(keyword) || alamat.includes(keyword) || status.includes(keyword) || sumber.includes(keyword);
    });

    renderPpksTable(filtered);
}

// --- HAPUS DATA PPKS (+ IKUT HAPUS AKUN WARGA JIKA DATA BERASAL DARI LAPORAN WARGA) ---
async function deletePpks(id) {
    const client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (!client) {
        alert('Koneksi Supabase belum siap.');
        return;
    }

    const targetId = isNaN(id) ? id : Number(id);
    const itemToDelete = rawPpksData.find(d => String(d.id) === String(id));
    const isWargaSource = itemToDelete?.sumberData === 'warga';

    const confirmMsg = isWargaSource
        ? 'Data ini berasal dari LAPORAN WARGA.\n\nMenghapusnya juga akan menghapus akun warga terkait di sistem. Lanjutkan?'
        : 'Data ini diinput LANGSUNG OLEH ADMIN (tidak ada akun warga terkait).\n\nHapus data ini secara permanen?';

    if (!confirm(confirmMsg)) return;

    try {
        const { error: deleteDataErr } = await client
            .from('data_ppks')
            .delete()
            .eq('id', targetId);

        if (deleteDataErr) throw deleteDataErr;

        let info = '';
        if (isWargaSource && itemToDelete?.nik) {
            const { error: deleteUserErr, count } = await client
                .from('users_warga')
                .delete({ count: 'exact' })
                .eq('nik', itemToDelete.nik);

            if (deleteUserErr) {
                console.error('Gagal menghapus users_warga:', deleteUserErr.message);
                info = '\n\n⚠️ Peringatan: akun warga terkait GAGAL dihapus otomatis. Silakan cek manual di Supabase.';
            } else if (count && count > 0) {
                info = '\n\nAkun warga pelapor juga sudah ikut dihapus.';
            }
        }

        alert('Data PPKS berhasil dihapus dari web dan database Supabase!' + info);
        await fetchPpksData();
    } catch (err) {
        alert('Gagal menghapus data dari Supabase: ' + err.message);
    }
}

// --- LOGOUT ---
function handleLogout() {
    localStorage.removeItem('loggedInUser');
    window.location.replace('login.html');
}