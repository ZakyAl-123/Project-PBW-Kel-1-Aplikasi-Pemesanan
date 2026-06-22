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
});