document.addEventListener("DOMContentLoaded", () => {
    // 1. Tampilkan Tanggal Hari Ini
    const dateTodayEl = document.getElementById('dateToday');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateTodayEl.innerText = new Date().toLocaleDateString('id-ID', options);

    // 2. Logika Perpindahan Tab Menu Sidebar
    const sidebarItems = document.querySelectorAll('.sidebar-menu li');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('pageTitle');

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // Hapus class active dari semua menu sidebar
            sidebarItems.forEach(li => li.classList.remove('active'));
            // Tambahkan class active ke menu yang diklik
            item.classList.add('active');

            // Sembunyikan semua tab content
            tabContents.forEach(tab => tab.classList.remove('active'));

            // Tampilkan tab yang sesuai dengan data-target
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Ubah Judul Halaman Sesuai Menu
            pageTitle.innerText = item.innerText;
        });
    });

    // 3. Logika Tombol Hapus (Simulasi)
    const deleteButtons = document.querySelectorAll('.btn-icon.delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if(confirm("Apakah Anda yakin ingin menghapus data ini?")) {
                // Menghapus baris (tr) tempat tombol ini berada
                const row = this.closest('tr');
                row.remove();
                alert("Data berhasil dihapus!");
            }
        });
    });

    // 4. Logika Keluar (Logout)
    document.getElementById('btnLogout').addEventListener('click', () => {
        if(confirm("Yakin ingin keluar dari portal owner?")) {
            // Mengarahkan kembali ke file login utama (naik 1 folder ../)
            window.location.href = '../login.html';
        }
    });
});