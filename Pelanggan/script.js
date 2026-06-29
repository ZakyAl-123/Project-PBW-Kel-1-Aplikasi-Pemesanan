document.addEventListener("DOMContentLoaded", () => {
    // === ELEMEN HTML ===
    const menuContainer = document.getElementById('menuContainer');
    const floatingCart = document.getElementById('floatingCart');
    const totalItemsEl = document.getElementById('totalItems');
    const totalPriceFloatEl = document.getElementById('totalPriceFloat');
    
    // Elemen Modal
    const btnCheckout = document.getElementById('btnCheckout');
    const summaryModal = document.getElementById('summaryModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const btnPesanKembali = document.getElementById('btnPesanKembali');
    const btnKonfirmasi = document.getElementById('btnKonfirmasi');
    const orderListEl = document.getElementById('orderList');
    const finalPriceEl = document.getElementById('finalPrice');

    // === STATE PENYIMPANAN ===
    let keranjang = {}; 
    let daftarMenuGlobal = []; 

    // === HELPER: FORMAT RUPIAH ===
    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(angka);
    };

    // === 1. TARIK DATA DARI DATABASE (DYNAMIC) ===
    async function loadMenuPelanggan() {
        if (!menuContainer) return;

        try {
            const response = await fetch('/api/menu');
            const dataMenu = await response.json();
            
            daftarMenuGlobal = dataMenu;
            menuContainer.innerHTML = ''; 

            if (dataMenu.length === 0) {
                menuContainer.innerHTML = '<p style="text-align:center; color:white;">Maaf, menu sedang kosong.</p>';
                return;
            }

            dataMenu.forEach(menu => {
                const isHabis = menu.status === 'Habis';
                const div = document.createElement('div');
                div.className = 'menu-item';
                if (isHabis) div.style.opacity = '0.6'; 

                div.innerHTML = `
                    <img src="${menu.foto}" alt="${menu.nama_menu}" ${isHabis ? 'style="filter: grayscale(100%);"' : ''}>
                    <div class="menu-details">
                        <h3>${menu.nama_menu}</h3>
                        <p>${isHabis ? '<strong style="color:red;">Stok Habis</strong>' : 'Menu andalan kami.'}</p>
                        <div class="menu-bottom">
                            <span class="price">${formatRupiah(menu.harga)}</span>
                            
                            <div class="qty-control" ${isHabis ? 'style="display:none;"' : ''}>
                                <button type="button" class="btn-minus" onclick="updateKeranjang(${menu.id_menu}, -1)">
                                    <i class="fa-solid fa-minus"></i>
                                </button>
                                <span class="qty-display" id="qty-${menu.id_menu}">0</span>
                                <button type="button" class="btn-plus" onclick="updateKeranjang(${menu.id_menu}, 1)">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                menuContainer.appendChild(div);
            });
        } catch (error) {
            console.error("Error:", error);
            menuContainer.innerHTML = '<p style="text-align:center; color:red;">Gagal memuat menu dari server.</p>';
        }
    }

    // === 2. LOGIKA KERANJANG (PLUS MINUS) ===
    window.updateKeranjang = (id, perubahan) => {
        const menuPilihan = daftarMenuGlobal.find(m => m.id_menu === id);
        if (!menuPilihan) return;

        if (!keranjang[id]) {
            keranjang[id] = { nama: menuPilihan.nama_menu, harga: menuPilihan.harga, qty: 0 };
        }
        
        keranjang[id].qty += perubahan;
        if (keranjang[id].qty < 0) keranjang[id].qty = 0;
        
        document.getElementById(`qty-${id}`).innerText = keranjang[id].qty;
        if (keranjang[id].qty === 0) delete keranjang[id];
        
        updateUI();
    };

    // === 3. UPDATE TAMPILAN KERANJANG BAWAH ===
    function updateUI() {
        let totalQty = 0;
        let totalPrice = 0;

        for (let key in keranjang) {
            totalQty += keranjang[key].qty;
            totalPrice += (keranjang[key].harga * keranjang[key].qty);
        }

        totalItemsEl.innerText = `${totalQty} Item`;
        totalPriceFloatEl.innerText = formatRupiah(totalPrice);

        // Gunakan class 'show' persis seperti CSS asli Anda
        if (totalQty > 0) {
            floatingCart.classList.add('show');
        } else {
            floatingCart.classList.remove('show');
        }
    }

    // === 4. LOGIKA MODAL POP-UP (RINGKASAN PESANAN) ===
    
    // Buka Modal
    btnCheckout.addEventListener('click', () => {
        orderListEl.innerHTML = '';
        let grandTotal = 0;

        for (let key in keranjang) {
            const item = keranjang[key];
            const subtotal = item.harga * item.qty;
            grandTotal += subtotal;

            const row = document.createElement('div');
            row.className = 'order-item-row';
            row.innerHTML = `
                <div class="item-qty-name">
                    <span class="item-qty">${item.qty}x</span>
                    <span class="item-name">${item.nama}</span>
                </div>
                <div class="item-subtotal">${formatRupiah(subtotal)}</div>
            `;
            orderListEl.appendChild(row);
        }

        finalPriceEl.innerText = formatRupiah(grandTotal);
        summaryModal.classList.add('show');
    });

    // Tutup Modal
    const closeAndHideModal = () => summaryModal.classList.remove('show');
    if(closeModalBtn) closeModalBtn.addEventListener('click', closeAndHideModal);
    if(btnPesanKembali) btnPesanKembali.addEventListener('click', closeAndHideModal);

    // Proses Pesanan (Tombol Buat Pesanan Final)
    // Proses Pesanan (Kirim ke Database)
    if(btnKonfirmasi) {
        btnKonfirmasi.addEventListener('click', async () => {
            btnKonfirmasi.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
            
            // Hitung total item & harga dari keranjang
            let totalQty = 0;
            let grandTotal = 0;
            for (let key in keranjang) {
                totalQty += keranjang[key].qty;
                grandTotal += (keranjang[key].harga * keranjang[key].qty);
            }

            // Siapkan data untuk dikirim ke server
            const dataPesanan = {
                no_meja: "08", // Anda bisa buat ini dinamis nanti
                total_item: totalQty,
                total_harga: grandTotal,
                keranjang: keranjang
            };

            try {
                const response = await fetch('/api/pesanan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataPesanan)
                });
                
                const result = await response.json();

                if (result.sukses) {
                    alert(result.pesan);
                    window.location.reload(); // Refresh halaman untuk pembeli berikutnya
                } else {
                    alert("Terjadi kesalahan sistem.");
                    btnKonfirmasi.innerHTML = 'Proses Pesanan';
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Gagal terhubung ke server.");
                btnKonfirmasi.innerHTML = 'Proses Pesanan';
            }
        });
    }

    // Panggil fungsi memuat data menu
    loadMenuPelanggan();
});