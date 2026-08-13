let rawLaporanData = [];

// --- INISIALISASI UTAMA ---
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

    // 2. Inisialisasi Tema & Icon Lucide
    initTheme();
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 3. Ambil Data Supabase
    await fetchLaporanData();
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

// --- MENGAMBIL DATA DARI SUPABASE ---
async function fetchLaporanData() {
    const tableBody = document.getElementById('laporanTableBody');
    const counterEl = document.getElementById('tableCountText');
    const client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);

    if (!client) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-6 text-center text-rose-500 font-semibold dark:text-rose-400">
                        Gagal terhubung ke Supabase. Periksa file supabase.js.
                    </td>
                </tr>`;
        }
        if (counterEl) counterEl.textContent = 'Koneksi gagal';
        return;
    }

    try {
        const { data, error } = await client
            .from('data_ppks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        rawLaporanData = data || [];

        updateLaporanStats(rawLaporanData);
        renderLaporanTable(rawLaporanData);

    } catch (err) {
        console.error('Error Supabase:', err.message);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-6 text-center text-rose-500 font-medium dark:text-rose-400">
                        Error: ${err.message}
                    </td>
                </tr>`;
        }
        if (counterEl) counterEl.textContent = 'Gagal memuat data';
    }
}

// --- UPDATE STATISTIK ATAS ---
function updateLaporanStats(dataList) {
    const totalRecordStat = document.getElementById('totalRecordStat');
    const lastUpdateStat = document.getElementById('lastUpdateStat');

    if (totalRecordStat) {
        totalRecordStat.textContent = `${dataList.length} Data`;
    }

    if (lastUpdateStat && dataList.length > 0) {
        const latestDate = new Date(dataList[0].created_at || Date.now());
        lastUpdateStat.textContent = latestDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } else if (lastUpdateStat) {
        lastUpdateStat.textContent = '-';
    }
}

// --- RENDER TABEL & STATUS DINAMIS ---
function renderLaporanTable(dataList) {
    const tableBody = document.getElementById('laporanTableBody');
    const counterEl = document.getElementById('tableCountText');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (counterEl) {
        counterEl.textContent = `Menampilkan ${dataList.length} dari ${rawLaporanData.length} data`;
    }

    if (!dataList || dataList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="p-6 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada data yang sesuai dengan filter.
                </td>
            </tr>`;
        return;
    }

    dataList.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-150";

        let formattedDate = '-';
        if (item.created_at) {
            const dateObj = new Date(item.created_at);
            formattedDate = dateObj.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }

        let statusBadge = '';
        const statusVal = (item.status || '').toLowerCase().trim();

        if (statusVal === 'pending') {
            statusBadge = `
                <span class="px-2.5 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800">
                    Pending
                </span>`;
        } else if (statusVal === 'proses' || statusVal === 'dalam proses') {
            statusBadge = `
                <span class="px-2.5 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
                    Proses
                </span>`;
        } else {
            statusBadge = `
                <span class="px-2.5 py-1 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">
                    Terverifikasi
                </span>`;
        }

        row.innerHTML = `
            <td class="p-3.5 pl-6 font-medium text-slate-800 dark:text-slate-200">${index + 1}</td>
            <td class="p-3.5">
                <p class="font-semibold text-slate-800 dark:text-slate-100">${item.nama || '-'}</p>
                <p class="text-xs text-slate-400 dark:text-slate-500 font-mono">${item.nik || '-'}</p>
            </td>
            <td class="p-3.5">
                <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    ${item.jenis_ppks || '-'}
                </span>
            </td>
            <td class="p-3.5 text-slate-600 dark:text-slate-300">${item.alamat || '-'}</td>
            <td class="p-3.5 text-slate-600 dark:text-slate-300">${formattedDate}</td>
            <td class="p-3.5 pr-6 text-center">
                ${statusBadge}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- FILTER DATA ---
function applyReportFilter(event) {
    if (event) event.preventDefault();

    const jenisSelect = document.getElementById('filterJenisSelect') ? document.getElementById('filterJenisSelect').value : '';
    const startDate = document.getElementById('startDateInput') ? document.getElementById('startDateInput').value : '';
    const endDate = document.getElementById('endDateInput') ? document.getElementById('endDateInput').value : '';

    let filtered = [...rawLaporanData];

    if (jenisSelect) {
        filtered = filtered.filter(item => item.jenis_ppks === jenisSelect);
    }

    if (startDate) {
        filtered = filtered.filter(item => {
            if (!item.created_at) return false;
            const itemDate = new Date(item.created_at).setHours(0, 0, 0, 0);
            const filterStart = new Date(startDate).setHours(0, 0, 0, 0);
            return itemDate >= filterStart;
        });
    }

    if (endDate) {
        filtered = filtered.filter(item => {
            if (!item.created_at) return false;
            const itemDate = new Date(item.created_at).setHours(0, 0, 0, 0);
            const filterEnd = new Date(endDate).setHours(23, 59, 59, 999);
            return itemDate <= filterEnd;
        });
    }

    renderLaporanTable(filtered);
}

// --- EXPORT KE EXCEL ---
function exportToExcel() {
    if (!rawLaporanData || rawLaporanData.length === 0) {
        alert('Tidak ada data untuk diexport!');
        return;
    }

    let csvContent = "\uFEFF";
    csvContent += "No,NIK,Nama Lengkap,Jenis PPKS,Alamat,Tanggal Pendataan,Status\n";

    rawLaporanData.forEach((item, index) => {
        const date = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-';
        
        const safeNik = (item.nik || '').replace(/"/g, '""');
        const safeNama = (item.nama || '').replace(/"/g, '""');
        const safeJenis = (item.jenis_ppks || '').replace(/"/g, '""');
        const safeAlamat = (item.alamat || '').replace(/"/g, '""');
        const safeStatus = (item.status || 'Pending').replace(/"/g, '""');

        const row = [
            index + 1,
            `"${safeNik}"`,
            `"${safeNama}"`,
            `"${safeJenis}"`,
            `"${safeAlamat}"`,
            `"${date}"`,
            `"${safeStatus}"`
        ].join(",");
        csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_PPKS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- CETAK DOKUMEN ---
function printReport() {
    const wasDark = document.documentElement.classList.contains('dark');
    if (wasDark) {
        document.documentElement.classList.remove('dark');
    }

    window.print();

    if (wasDark) {
        document.documentElement.classList.add('dark');
    }
}

// --- LOGOUT ---
function handleLogout() {
    localStorage.removeItem('loggedInUser');
    window.location.replace('login.html');
}