document.addEventListener('DOMContentLoaded', function () {
    if (window.lucide) {
        lucide.createIcons();
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterWarga);
    }
});

async function handleRegisterWarga(e) {
    e.preventDefault();

    const nik = document.getElementById('regNik').value.trim();
    const nama = document.getElementById('regNama').value.trim();
    const hp = document.getElementById('regHp').value.trim();
    const pass = document.getElementById('regPassword').value.trim();
    const alertBox = document.getElementById('alertBox');
    const btn = document.getElementById('btnRegister');

    // Reset Alert Box
    alertBox.className = 'hidden mb-4 p-3 text-xs rounded-lg text-center font-medium';
    btn.disabled = true;
    btn.innerHTML = `<span>Mendaftarkan...</span>`;

    try {
        const client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);

        if (!client) {
            throw new Error('Koneksi Supabase belum terhubung!');
        }

        // 1. Cek apakah NIK sudah pernah didaftarkan sebelumnya
        const { data: existingUser, error: checkErr } = await client
            .from('users_warga')
            .select('nik')
            .eq('nik', nik)
            .maybeSingle();

        if (checkErr) throw checkErr;

        if (existingUser) {
            alertBox.textContent = 'NIK ini sudah terdaftar! Silakan langsung login.';
            alertBox.classList.add('bg-rose-50', 'border', 'border-rose-200', 'text-rose-600');
            alertBox.classList.remove('hidden');
            return;
        }

        // 2. Kirim data warga baru ke tabel users_warga
        const { error: insertErr } = await client
            .from('users_warga')
            .insert([{
                nik: nik,
                nama_lengkap: nama,
                no_hp: hp,
                password: pass
            }]);

        if (insertErr) throw insertErr;

        // 3. Notifikasi Berhasil & Redirect ke Login
        alertBox.textContent = 'Pendaftaran berhasil! Mengalihkan ke halaman login...';
        alertBox.classList.add('bg-emerald-50', 'border', 'border-emerald-200', 'text-emerald-600');
        alertBox.classList.remove('hidden');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (err) {
        alertBox.textContent = 'Gagal mendaftar: ' + err.message;
        alertBox.classList.add('bg-rose-50', 'border', 'border-rose-200', 'text-rose-600');
        alertBox.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Daftar Akun</span>`;
    }
}