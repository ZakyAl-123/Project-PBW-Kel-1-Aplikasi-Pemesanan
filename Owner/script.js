document.addEventListener("DOMContentLoaded", () => {
    // 1. Tampilkan Tanggal Hari Ini
    const dateTodayEl = document.getElementById('dateToday');
    if (dateTodayEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateTodayEl.innerText = new Date().toLocaleDateString('id-ID', options);
    }

    // 2. Logika Perpindahan Tab Menu Sidebar
    const sidebarItems = document.querySelectorAll('.sidebar-menu li');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('pageTitle');

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            sidebarItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');

            tabContents.forEach(tab => tab.classList.remove('active'));

            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            if (pageTitle) pageTitle.innerText = item.innerText;
        });
    });

    // 3. Logika Keluar (Logout)
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm("Yakin ingin keluar dari portal owner?")) {
                window.location.href = '../login.html';
            }
        });
    }

    // ========================================================
    // 4. FITUR: TARIK DATA MENU DARI DATABASE (Tadi Hilang)
    // ========================================================
    const tabelMenuBody = document.getElementById('tabelMenuBody');

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    async function loadDataMenu() {
        if (!tabelMenuBody) return;

        try {
            tabelMenuBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Memuat data...</td></tr>';

            const response = await fetch('/api/menu');
            const dataMenu = await response.json();

            tabelMenuBody.innerHTML = '';

            dataMenu.forEach((menu) => {
                const badgeClass = menu.status === 'Tersedia' ? 'badge success' : 'badge danger';

                const barisHtml = `
                    <tr>
                        <td>#M00${menu.id_menu}</td>
                        <td><img src="${menu.foto}" alt="Menu" class="td-img"></td>
                        <td>${menu.nama_menu}</td>
                        <td>${formatRupiah(menu.harga)}</td>
                        <td><span class="${badgeClass}">${menu.status}</span></td>
                        <td>
                            <button type="button" class="btn-icon edit" onclick='bukaEditMenu(${JSON.stringify(menu)})'>
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn-icon delete" aria-label="Hapus Data" onclick="hapusMenu(${menu.id_menu})">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tabelMenuBody.innerHTML += barisHtml;
            });
        } catch (error) {
            console.error('Gagal memuat menu:', error);
            tabelMenuBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Gagal memuat data menu.</td></tr>';
        }
    }

    // Panggil fungsi agar tabel terisi saat web dibuka
    loadDataMenu();

    // ========================================================
    // 5. FITUR: MODAL & TAMBAH MENU BARU
    // ========================================================
    const modalTambahMenu = document.getElementById('modalTambahMenu');
    const btnTambahMenu = document.getElementById('btnTambahMenu');
    const closeModal = document.querySelector('.close-modal');
    const formTambahMenu = document.getElementById('formTambahMenu');

    // Buka Modal
    if (btnTambahMenu) {
        btnTambahMenu.addEventListener('click', () => {
            modalTambahMenu.classList.add('show');
        });
    }

    // Tutup Modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modalTambahMenu.classList.remove('show');
        });
    }

    // Proses Submit (Simpan)
    if (formTambahMenu) {
        formTambahMenu.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btnSubmit = formTambahMenu.querySelector('button[type="submit"]');
            if (btnSubmit) {
                btnSubmit.innerText = "Menyimpan...";
                btnSubmit.disabled = true;
            }

            const formData = new FormData();
            formData.append('nama_menu', document.getElementById('inputNamaMenu').value);
            formData.append('harga', document.getElementById('inputHarga').value);
            formData.append('status', document.getElementById('inputStatus').value);

            const fileFoto = document.getElementById('inputFoto');
            if (fileFoto && fileFoto.files.length > 0) {
                formData.append('foto', fileFoto.files[0]);
            }

            try {
                const response = await fetch('/api/menu', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.sukses) {
                    alert(result.pesan);
                    modalTambahMenu.classList.remove('show');
                    formTambahMenu.reset();
                    loadDataMenu(); // Sekarang fungsi ini sudah aman dipanggil
                } else {
                    alert(result.pesan);
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Terjadi kesalahan sistem saat menyimpan data.");
            } finally {
                // Kembalikan tombol seperti semula
                if (btnSubmit) {
                    btnSubmit.innerText = "Simpan Menu";
                    btnSubmit.disabled = false;
                }
            }
        });
    }
    // === FITUR: HAPUS MENU ===
    window.hapusMenu = async (id) => {
        if (!confirm("Apakah Anda yakin ingin menghapus menu ini?")) return;

        try {
            const response = await fetch(`/api/menu/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.sukses) {
                alert(result.pesan);
                loadDataMenu(); // Segarkan tabel secara otomatis
            } else {
                alert(result.pesan);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan saat menghapus data.");
        }
    }

    // === FITUR: EDIT MENU ===
    const modalEditMenu = document.getElementById('modalEditMenu');
    const formEditMenu = document.getElementById('formEditMenu');

    // Fungsi untuk membuka modal edit dengan data yang sudah ada
    window.bukaEditMenu = (menu) => {
        document.getElementById('editId').value = menu.id_menu;
        document.getElementById('editNama').value = menu.nama_menu;
        document.getElementById('editHarga').value = menu.harga;
        document.getElementById('editStatus').value = menu.status;
        modalEditMenu.classList.add('show');
    };

    document.querySelector('.close-modal-edit').onclick = () => modalEditMenu.classList.remove('show');

    formEditMenu.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editId').value;
        const formData = new FormData(formEditMenu);

        const response = await fetch(`/api/menu/${id}`, { method: 'PUT', body: formData });
        const result = await response.json();

        if (result.sukses) {
            alert(result.pesan);
            modalEditMenu.classList.remove('show');
            loadDataMenu();
        }
    });

    // ========================================================
    // FITUR: TARIK DATA TRANSAKSI
    // ========================================================
    const tabelTransaksiBody = document.getElementById('tabelTransaksiBody');

    async function loadDataTransaksi() {
        if (!tabelTransaksiBody) return;

        try {
            const response = await fetch('/api/pesanan');
            const dataTransaksi = await response.json();

            tabelTransaksiBody.innerHTML = '';

            dataTransaksi.forEach(trx => {
                const badgeClass = trx.status === 'Selesai' ? 'badge success' : 'badge warning';
                // Potong format waktu agar rapi
                const waktu = new Date(trx.waktu).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});

                // ... (kode sebelumnya)
                const html = `
                    <tr>
                        <td>#TRX-00${trx.id_pesanan}</td>
                        <td>Meja ${trx.no_meja}</td>
                        <td>${trx.total_item} Item</td>
                        <td>${formatRupiah(trx.total_harga)}</td>
                        <td>${waktu} WIB</td>
                        <td><span class="${badgeClass}">${trx.status}</span></td>
                        <td><button type="button" class="btn-small" onclick="lihatDetailPesanan(${trx.id_pesanan})">Lihat Detail</button></td>
                    </tr>
                `;
                tabelTransaksiBody.innerHTML += html;
// ... (kode setelahnya)
            });
        } catch (error) {
            console.error("Gagal muat transaksi:", error);
        }
    }

    // Panggil fungsinya
    loadDataTransaksi();

    // ========================================================
    // FITUR: LIHAT DETAIL PESANAN
    // ========================================================
    const modalDetailPesanan = document.getElementById('modalDetailPesanan');
    const tabelDetailBody = document.getElementById('tabelDetailBody');
    const detailIdPesanan = document.getElementById('detailIdPesanan');

    // Tutup modal
    document.querySelector('.close-modal-detail').addEventListener('click', () => {
        modalDetailPesanan.classList.remove('show');
    });

    window.lihatDetailPesanan = async (idPesanan) => {
        try {
            // Tampilkan nomor TRX dan buka modal
            detailIdPesanan.innerText = '00' + idPesanan;
            tabelDetailBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat detail...</td></tr>';
            modalDetailPesanan.classList.add('show');

            // Ambil data dari API
            const response = await fetch(`/api/pesanan/${idPesanan}`);
            const dataDetail = await response.json();

            tabelDetailBody.innerHTML = ''; // Kosongkan loading

            if (dataDetail.length === 0) {
                tabelDetailBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Detail tidak ditemukan.</td></tr>';
                return;
            }

            // Looping data detail menu
            dataDetail.forEach(item => {
                tabelDetailBody.innerHTML += `
                    <tr>
                        <td>${item.nama_menu}</td>
                        <td>${formatRupiah(item.harga)}</td>
                        <td>${item.qty}x</td>
                        <td><strong>${formatRupiah(item.subtotal)}</strong></td>
                    </tr>
                `;
            });

        } catch (error) {
            console.error("Gagal muat detail:", error);
            tabelDetailBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat detail dari server.</td></tr>';
        }
    };

    // ========================================================
    // FITUR: MUAT STATISTIK DASHBOARD
    // ========================================================
    async function loadStatistik() {
        try {
            const response = await fetch('/api/statistik');
            const data = await response.json();

            // Masukkan data dari database ke elemen HTML
            document.getElementById('statTotalPesanan').innerText = data.totalPesanan;
            document.getElementById('statMenuAktif').innerText = data.menuAktif;
            
            // Format pendapatan hari ini menjadi Rupiah
            document.getElementById('statPendapatan').innerText = formatRupiah(data.pendapatanHariIni);
        } catch (error) {
            console.error("Gagal memuat statistik:", error);
        }
    }

    // Panggil fungsi secara otomatis saat portal Owner dibuka
    loadStatistik();
});