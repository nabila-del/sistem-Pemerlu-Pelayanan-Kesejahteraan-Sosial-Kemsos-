let rawLaporanData = [];

document.addEventListener('DOMContentLoaded', async function () {
    await fetchLaporanData();
});

// 1. Mengambil data dari Supabase
async function fetchLaporanData() {
    const tableBody = document.getElementById('laporanTableBody');
    const client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);

    if (!client) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-6 text-center text-rose-500 font-semibold">
                        Gagal terhubung ke Supabase. Periksa file supabase.js.
                    </td>
                </tr>`;
        }
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
                    <td colspan="6" class="p-6 text-center text-rose-500 font-medium">
                        Error: ${err.message}
                    </td>
                </tr>`;
        }
    }
}

// 2. Update Statistik Atas
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

// 3. Render Tabel
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
                <td colspan="6" class="p-6 text-center text-slate-400">
                    Tidak ada data yang sesuai dengan filter.
                </td>
            </tr>`;
        return;
    }

    dataList.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50 transition-colors duration-150";

        let formattedDate = '-';
        if (item.created_at) {
            const dateObj = new Date(item.created_at);
            formattedDate = dateObj.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }

        row.innerHTML = `
            <td class="p-3.5 pl-6 font-medium text-slate-800">${index + 1}</td>
            <td class="p-3.5">
                <p class="font-semibold text-slate-800">${item.nama || '-'}</p>
                <p class="text-xs text-slate-400 font-mono">${item.nik || '-'}</p>
            </td>
            <td class="p-3.5">
                <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300">
                    ${item.jenis_ppks || '-'}
                </span>
            </td>
            <td class="p-3.5">${item.alamat || '-'}</td>
            <td class="p-3.5">${formattedDate}</td>
            <td class="p-3.5 pr-6 text-center">
                <span class="px-2.5 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">
                    Terverifikasi
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 4. Logika Filter
function applyReportFilter(event) {
    if (event) event.preventDefault();

    const jenisSelect = document.getElementById('filterJenisSelect').value;
    const startDate = document.getElementById('startDateInput').value;
    const endDate = document.getElementById('endDateInput').value;

    let filtered = [...rawLaporanData];

    if (jenisSelect) {
        filtered = filtered.filter(item => item.jenis_ppks === jenisSelect);
    }

    if (startDate) {
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.created_at).setHours(0, 0, 0, 0);
            const filterStart = new Date(startDate).setHours(0, 0, 0, 0);
            return itemDate >= filterStart;
        });
    }

    if (endDate) {
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.created_at).setHours(0, 0, 0, 0);
            const filterEnd = new Date(endDate).setHours(23, 59, 59, 999);
            return itemDate <= filterEnd;
        });
    }

    renderLaporanTable(filtered);
}

// 5. Export Excel
function exportToExcel() {
    if (!rawLaporanData || rawLaporanData.length === 0) {
        alert('Tidak ada data untuk diexport!');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,NIK,Nama Lengkap,Jenis PPKS,Alamat,Tanggal Pendataan\n";

    rawLaporanData.forEach((item, index) => {
        const date = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-';
        const row = [
            index + 1,
            `"${item.nik || ''}"`,
            `"${item.nama || ''}"`,
            `"${item.jenis_ppks || ''}"`,
            `"${item.alamat || ''}"`,
            `"${date}"`
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_PPKS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 6. Cetak PDF
function printReport() {
    window.print();
}