    document.addEventListener('DOMContentLoaded', function() {
        // 1. Render Ikon Lucide
        if (window.lucide) {
            lucide.createIcons();
        }
        
        // 2. Load Data Supabase ke Dashboard
        loadDashboardData();

        // 3. Observer untuk merespons perubahan Dark Mode secara instan
        const observer = new MutationObserver(() => {
            if (window.lastDashboardData) {
                updateDashboardThemeUI(window.lastDashboardData);
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    });

    let myChart = null;

    // --- HELPER: Samain logika status dengan ppks.js ---
    // Status yang tidak dikenali (kosong, null, "Tervalidasi", dll) dianggap "pending",
    // persis seperti cara renderPpksTable() di ppks.js menampilkan badge.
    function getEffectiveStatus(item) {
        const s = (item.status || 'pending').toLowerCase().trim();
        if (s === 'disetujui' || s === 'acc' || s === 'selesai') return 'disetujui';
        if (s === 'proses' || s === 'dalam proses') return 'proses';
        return 'pending';
    }

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
            window.lastDashboardData = safeData; // Cache data untuk re-render warna saat toggle tema

            // 2. Update Total Data Terdaftar (Untuk Gauge & Card Text)
            const dashTotal = document.getElementById('dashTotalPPKS');
            if (dashTotal) {
                dashTotal.innerText = `${safeData.length}`;
            }

            // Update visual Gauge Chart jika ada
            updateGaugeTheme(safeData.length);

            // 3. HITUNG STATUS VERIFIKASI (Pending, Proses, Disetujui)
            // Pakai getEffectiveStatus() supaya konsisten dengan badge yang ditampilkan di ppks.js
            const totalPending = safeData.filter(item => getEffectiveStatus(item) === 'pending').length;
            const totalProses = safeData.filter(item => getEffectiveStatus(item) === 'proses').length;
            const totalDisetujui = safeData.filter(item => getEffectiveStatus(item) === 'disetujui').length;

            // Render angka Status Verifikasi ke HTML
            const statPending = document.getElementById('statPending');
            const statProses = document.getElementById('statProses');
            const statDisetujui = document.getElementById('statDisetujui');
            const statSelesai = document.getElementById('statSelesai');

            if (statPending) statPending.textContent = totalPending;
            if (statProses) statProses.textContent = totalProses;
            if (statDisetujui) statDisetujui.textContent = totalDisetujui;
            if (statSelesai) statSelesai.textContent = totalDisetujui;

            // 4. Hitung Jumlah Kategori/Jenis PPKS
            const counts = {};
            safeData.forEach(item => {
                const cat = item.jenis_ppks || 'Lainnya';
                counts[cat] = (counts[cat] || 0) + 1;
            });

            const dashKat = document.getElementById('dashTotalKategori');
            if (dashKat) {
                dashKat.innerText = `${Object.keys(counts).length}`;
            }

            // 5. Tampilkan 4 Input Terbaru
            renderRecentList(safeData.slice(0, 4));

            // 6. Render Grafik Bar Chart dengan Chart.js
            renderChart(Object.keys(counts), Object.values(counts));

        } catch (err) {
            console.error('Error loading dashboard:', err.message);
        }
    }

    // Fungsi Render List Input Terakhir dengan Dukungan Dark Mode
    function renderRecentList(recentItems) {
        const recentList = document.getElementById('recentList');
        if (!recentList) return;

        recentList.innerHTML = '';

        if (recentItems.length === 0) {
            recentList.innerHTML = `<p class="text-xs text-slate-400 dark:text-slate-500 text-center py-8">Belum ada data tersedia.</p>`;
            return;
        }

        recentItems.forEach(item => {
            const itemElement = document.createElement('div');
            // Warna item menyesuaikan dark:bg-slate-900 dan border slate-800
            itemElement.className = "flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200";
            itemElement.innerHTML = `
                <div>
                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">${item.nama || '-'}</p>
                    <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">${item.jenis_ppks || '-'}</p>
                </div>
                <span class="text-[10px] font-mono px-2 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800/80">${(item.alamat || 'KEC').split(' ')[0]}</span>
            `;
            recentList.appendChild(itemElement);
        });
    }

    // Update Gauge Chart secara Dinamis
    function updateGaugeTheme(totalValue) {
        if (window.myGaugeChart) {
            const isDark = document.documentElement.classList.contains('dark');
            window.myGaugeChart.data.datasets[0].data = [totalValue, 0];
            window.myGaugeChart.data.datasets[0].backgroundColor = ['#10b981', isDark ? '#1e293b' : '#f1f5f9'];
            window.myGaugeChart.update();
        }
    }

    // Fungsi Re-render UI Komponen saat Tema Berubah
    function updateDashboardThemeUI(data) {
        updateGaugeTheme(data.length);
        
        const counts = {};
        data.forEach(item => {
            const cat = item.jenis_ppks || 'Lainnya';
            counts[cat] = (counts[cat] || 0) + 1;
        });

        renderChart(Object.keys(counts), Object.values(counts));
        renderRecentList(data.slice(0, 4));
    }

    // Render Grafik Bar Chart dengan Chart.js
    function renderChart(labels, values) {
        const canvas = document.getElementById('ppksChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const isDark = document.documentElement.classList.contains('dark');
        
        // Warna teks & garis grid dinamis sesuai tema
        const textColor = isDark ? '#94a3b8' : '#475569';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

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
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.85)' : 'rgba(5, 150, 105, 0.75)',
                    borderColor: isDark ? '#34d399' : '#059669',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    hoverBackgroundColor: isDark ? '#34d399' : '#047857'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        titleColor: isDark ? '#f8fafc' : '#0f172a',
                        bodyColor: isDark ? '#cbd5e1' : '#334155',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: { color: textColor, font: { size: 11 } },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0, color: textColor, font: { size: 11 } },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }
