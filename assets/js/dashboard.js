document.addEventListener('DOMContentLoaded', function() {
    // 1. Render Ikon Lucide
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // 2. Load Data Supabase ke Dashboard
    loadDashboardData();
});

let myChart = null;

// --- LOGIKA SUPABASE & DASHBOARD ---
async function loadDashboardData() {
    try {
        // Cek koneksi Supabase
        const client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
        
        if (!client) {
            console.error('Koneksi Supabase belum siap!');
            return;
        }

        // 1. Ambil Data dari Supabase (diurutkan dari yang terbaru)
        const { data, error } = await client
            .from('data_ppks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const safeData = data || [];

        // 2. Update Total Data Terdaftar
        const dashTotal = document.getElementById('dashTotalPPKS');
        if (dashTotal) {
            dashTotal.innerText = `${safeData.length} Data`;
        }

        // 3. Hitung Jumlah Kategori/Jenis PPKS
        const counts = {};
        safeData.forEach(item => {
            const cat = item.jenis_ppks || 'Lainnya';
            counts[cat] = (counts[cat] || 0) + 1;
        });

        const dashKat = document.getElementById('dashTotalKategori');
        if (dashKat) {
            dashKat.innerText = `${Object.keys(counts).length} Jenis`;
        }

        // 4. Tampilkan 4 Input Terbaru
        const recentList = document.getElementById('recentList');
        if (recentList) {
            recentList.innerHTML = '';

            if (safeData.length === 0) {
                recentList.innerHTML = `<p class="text-sm text-slate-400 text-center py-8">Belum ada data tersedia.</p>`;
            } else {
                safeData.slice(0, 4).forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.className = "flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/60";
                    itemElement.innerHTML = `
                        <div>
                            <p class="text-sm font-semibold text-slate-800">${item.nama || '-'}</p>
                            <p class="text-xs text-amber-600 font-medium">${item.jenis_ppks || '-'}</p>
                        </div>
                        <span class="text-[10px] font-mono px-2 py-1 bg-teal-50 text-teal-600 rounded border border-teal-200">${(item.alamat || 'KEC').split(' ')[0]}</span>
                    `;
                    recentList.appendChild(itemElement);
                });
            }
        }

        // 5. Render Grafik dengan Chart.js
        renderChart(Object.keys(counts), Object.values(counts));

    } catch (err) {
        console.error('Error loading dashboard:', err.message);
    }
}

function renderChart(labels, values) {
    const canvas = document.getElementById('ppksChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Hapus grafik lama jika sudah ada (agar tidak tumpang tindih)
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['Belum Ada Data'],
            datasets: [{
                label: 'Jumlah Warga PPKS',
                data: values.length > 0 ? values : [0],
                backgroundColor: 'rgba(13, 148, 136, 0.7)',
                borderColor: 'rgba(13, 148, 136, 1)',
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}