// ==========================================
// 1. INVENTARISASI & LOAD DOKUMEN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    applyRolePermissions();
});

// ==========================================
// 2. FUNGSI TAMPILKAN PROFIL & BADGE ROLE
// ==========================================
function loadUserProfile() {
    const userSession = localStorage.getItem('loggedInUser');
    
    if (userSession) {
        const user = JSON.parse(userSession);
        
        const nameEl = document.getElementById('userAdminName');
        const roleEl = document.getElementById('userAdminRole');
        
        if (nameEl) nameEl.textContent = user.nama || user.username || 'Admin';
        
        if (roleEl) {
            const role = user.role || 'Admin';
            roleEl.textContent = role;
            
            // Pewarnaan Badge sesuai Role
            if (role === 'Super Admin') {
                roleEl.className = 'text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded w-fit mt-0.5';
            } else if (role === 'Pimpinan') {
                roleEl.className = 'text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit mt-0.5';
            } else if (role === 'Petugas Lapangan') {
                roleEl.className = 'text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-0.5';
            } else {
                // Default untuk Admin / Operator
                roleEl.className = 'text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded w-fit mt-0.5';
            }
        }
    }
}

// ==========================================
// 3. FUNGSI HAK AKSES BERDASARKAN ROLE
// ==========================================
function applyRolePermissions() {
    const userSession = localStorage.getItem('loggedInUser');
    if (!userSession) return;

    const user = JSON.parse(userSession);
    const role = user.role || 'Admin';

    // Jika Petugas Lapangan: Sembunyikan menu Master Jenis PPKS
    if (role === 'Petugas Lapangan') {
        const menuJenis = document.querySelector('a[href="jenis-ppks.html"]');
        if (menuJenis) menuJenis.style.display = 'none';
    }

    // Jika Pimpinan: Sembunyikan semua tombol Tambah Data (Mode Viewer)
    if (role === 'Pimpinan') {
        const btnTambah = document.querySelectorAll('.btn-tambah, button[onclick*="openModal"]');
        btnTambah.forEach(btn => btn.style.display = 'none');
    }
}

// ==========================================
// 4. FUNGSI LOGOUT GLOBAL (WINDOW)
// ==========================================
window.handleLogout = function() {
    const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar dari aplikasi SIP-PPKS?");
    if (confirmLogout) {
        // Hapus data sesi login
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('adminSession');
        
        // Redirect balik ke login.html di folder yang sama
        window.location.replace('login.html');
    }
};

// ==========================================
// 5. FUNGSI LOGIN GLOBAL (HANDLE LOGIN FORM)
// ==========================================
window.handleLogin = async function(event) {
    event.preventDefault();

    const identifierInput = document.getElementById('identifier')?.value.trim();
    const passwordInput = document.getElementById('password')?.value;
    const errorBox = document.getElementById('loginErrorMessage');
    const errorText = document.getElementById('loginErrorText');

    if (errorBox) errorBox.classList.add('hidden');

    try {
        // Cek pengguna ke Supabase
        // Memeriksa kolom email, username, ATAU nik
        const { data: user, error } = await supabaseClient
            .from('users') // Pastikan nama tabel kamu di Supabase adalah 'users'
            .select('*')
            .or(`email.eq.${identifierInput},username.eq.${identifierInput},nik.eq.${identifierInput}`)
            .eq('password', passwordInput)
            .maybeSingle();

        if (error || !user) {
            throw new Error('Username/NIK/Email atau Kata Sandi salah.');
        }

        // Simpan sesi login ke LocalStorage
        localStorage.setItem('loggedInUser', JSON.stringify(user));

        // Arahkan Pengguna Berdasarkan Role
        if ((user.role || '').toLowerCase() === 'warga') {
            window.location.href = 'form-lapor.html';
        } else {
            window.location.href = 'dashboard.html';
        }

    } catch (err) {
        if (errorBox && errorText) {
            errorText.textContent = err.message || 'Gagal terhubung ke sistem.';
            errorBox.classList.remove('hidden');
        } else {
            alert(err.message || 'Gagal login.');
        }
    }
};