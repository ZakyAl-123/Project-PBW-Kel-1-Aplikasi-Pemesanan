const express = require('express');
const path = require('path');
const db = require('./koneksi');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// === ATURAN AKSES FOLDER ===
// Mengizinkan server membaca folder utama, tapi mematikan auto-baca index.html
app.use(express.static(__dirname, { index: false }));

// === RUTE HALAMAN UTAMA ===
// Membuka landing page (index.html) saat localhost:3000 diakses
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// === KONFIGURASI UPLOAD GAMBAR ===
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'img/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// === RUTE LOGIN ===
app.post('/proses-login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM tb_owner WHERE username = ?', [username]);
        if (rows.length > 0 && password === rows[0].password) {
            res.send(`<script>alert('Selamat datang!'); window.location.href = '/Owner/index.html';</script>`);
        } else {
            res.send("<script>alert('Login Gagal!'); window.location.href='/login.html';</script>");
        }
    } catch (error) {
        res.status(500).send("Server Error");
    }
});

// === RUTE API MENU ===
app.get('/api/menu', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM tb_menu');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ pesan: "Error" });
    }
});

app.post('/api/menu', upload.single('foto'), async (req, res) => {
    const { nama_menu, harga, status } = req.body;
    const fotoPath = req.file ? '/img/' + req.file.filename : '/img/default.jpg';
    try {
        await db.execute('INSERT INTO tb_menu (nama_menu, harga, status, foto) VALUES (?, ?, ?, ?)',
            [nama_menu, harga, status, fotoPath]);
        res.json({ sukses: true, pesan: "Menu berhasil ditambah!" });
    } catch (error) {
        res.status(500).json({ sukses: false, pesan: "Gagal simpan!" });
    }
});

// Rute API untuk Menghapus Menu berdasarkan ID
app.delete('/api/menu/:id', async (req, res) => {
    const idMenu = req.params.id;

    try {
        await db.execute('DELETE FROM tb_menu WHERE id_menu = ?', [idMenu]);
        res.json({ sukses: true, pesan: "Menu berhasil dihapus!" });
    } catch (error) {
        console.error("Error hapus menu:", error);
        res.status(500).json({ sukses: false, pesan: "Gagal menghapus menu." });
    }
});

// Rute API untuk Update Menu
app.put('/api/menu/:id', upload.single('foto'), async (req, res) => {
    const idMenu = req.params.id;
    const { nama_menu, harga, status } = req.body;

    try {
        if (req.file) {
            // Jika user upload foto baru
            const fotoPath = '/img/' + req.file.filename;
            await db.execute('UPDATE tb_menu SET nama_menu=?, harga=?, status=?, foto=? WHERE id_menu=?',
                [nama_menu, harga, status, fotoPath, idMenu]);
        } else {
            // Jika tidak ganti foto
            await db.execute('UPDATE tb_menu SET nama_menu=?, harga=?, status=? WHERE id_menu=?',
                [nama_menu, harga, status, idMenu]);
        }
        res.json({ sukses: true, pesan: "Menu berhasil diperbarui!" });
    } catch (error) {
        res.status(500).json({ sukses: false, pesan: "Gagal update menu." });
    }
});

// === RUTE API: MENYIMPAN PESANAN DARI PELANGGAN ===
app.post('/api/pesanan', async (req, res) => {
    const { no_meja, total_item, total_harga, keranjang } = req.body;

    try {
        // 1. Simpan ke tabel tb_pesanan (Nota utama)
        const [result] = await db.execute(
            "INSERT INTO tb_pesanan (no_meja, total_item, total_harga, status) VALUES (?, ?, ?, 'Dimasak')",
            [no_meja, total_item, total_harga]
        );
        const id_pesanan = result.insertId;

        // 2. Simpan detail menu ke tb_detail_pesanan
        for (const id_menu in keranjang) {
            const item = keranjang[id_menu];
            const subtotal = item.harga * item.qty;
            await db.execute(
                "INSERT INTO tb_detail_pesanan (id_pesanan, id_menu, qty, subtotal) VALUES (?, ?, ?, ?)",
                [id_pesanan, id_menu, item.qty, subtotal]
            );
        }
        res.json({ sukses: true, pesan: "Pesanan berhasil dikirim ke Dapur!" });
    } catch (error) {
        console.error("Error simpan pesanan:", error);
        res.status(500).json({ sukses: false, pesan: "Gagal memproses pesanan." });
    }
});

// === RUTE API: AMBIL DATA TRANSAKSI UNTUK OWNER ===
app.get('/api/pesanan', async (req, res) => {
    try {
        // Ambil data pesanan dan urutkan dari yang paling baru
        const [rows] = await db.execute("SELECT * FROM tb_pesanan ORDER BY waktu DESC");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ pesan: "Error mengambil data transaksi." });
    }
});

// === RUTE API: AMBIL DETAIL PESANAN ===
app.get('/api/pesanan/:id', async (req, res) => {
    const idPesanan = req.params.id;
    try {
        // Menggabungkan tabel detail pesanan dengan tabel menu untuk mendapatkan nama menu
        const [rows] = await db.execute(`
            SELECT dp.qty, dp.subtotal, m.nama_menu, m.harga 
            FROM tb_detail_pesanan dp 
            JOIN tb_menu m ON dp.id_menu = m.id_menu 
            WHERE dp.id_pesanan = ?
        `, [idPesanan]);

        res.json(rows);
    } catch (error) {
        console.error("Error ambil detail:", error);
        res.status(500).json({ pesan: "Gagal mengambil detail pesanan." });
    }
});

// === RUTE API: STATISTIK DASHBOARD ===
app.get('/api/statistik', async (req, res) => {
    try {
        // 1. Hitung Total Semua Pesanan
        const [rowsPesanan] = await db.execute("SELECT COUNT(id_pesanan) AS total_pesanan FROM tb_pesanan");

        // 2. Pendapatan Khusus Hari Ini (Reset Tiap Jam 00:00)
        const [rowsHariIni] = await db.execute("SELECT SUM(total_harga) AS pendapatan_hari_ini FROM tb_pesanan WHERE DATE(waktu) = CURDATE()");

        // 3. Total Semua Pendapatan dari Awal (Tidak Pernah Reset)
        const [rowsTotal] = await db.execute("SELECT SUM(total_harga) AS total_semua FROM tb_pesanan");

        // 4. Hitung Menu Aktif
        const [rowsMenu] = await db.execute("SELECT COUNT(id_menu) AS menu_aktif FROM tb_menu WHERE status = 'Tersedia'");

        res.json({
            totalPesanan: rowsPesanan[0].total_pesanan || 0,
            pendapatanHariIni: rowsHariIni[0].pendapatan_hari_ini || 0,
            totalSemuaPendapatan: rowsTotal[0].total_semua || 0,
            menuAktif: rowsMenu[0].menu_aktif || 0
        });
    } catch (error) {
        console.error("Error ambil statistik:", error);
        res.status(500).json({ pesan: "Gagal mengambil statistik." });
    }
});

// === RUTE API: UBAH STATUS PESANAN ===
app.put('/api/pesanan/:id/status', async (req, res) => {
    const idPesanan = req.params.id;
    const { status } = req.body; // Menerima status baru (misal: 'Selesai')

    try {
        await db.execute(
            "UPDATE tb_pesanan SET status = ? WHERE id_pesanan = ?",
            [status, idPesanan]
        );
        res.json({ sukses: true, pesan: `Status pesanan #TRX-00${idPesanan} berhasil diubah menjadi ${status}!` });
    } catch (error) {
        console.error("Error ubah status:", error);
        res.status(500).json({ sukses: false, pesan: "Gagal mengubah status pesanan." });
    }
});

// ========================================================
// RUTE API: MANAJEMEN KARYAWAN
// ========================================================

// 1. Ambil semua data karyawan
app.get('/api/karyawan', async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM tb_karyawan ORDER BY id_karyawan DESC");
        res.json(rows);
    } catch (error) {
        console.error("Error ambil karyawan:", error);
        res.status(500).json({ pesan: "Gagal mengambil data karyawan." });
    }
});

// 2. Tambah karyawan baru
app.post('/api/karyawan', async (req, res) => {
    const { nama_karyawan, posisi, no_hp } = req.body;
    try {
        await db.execute(
            "INSERT INTO tb_karyawan (nama_karyawan, posisi, no_hp, status) VALUES (?, ?, ?, 'Aktif')",
            [nama_karyawan, posisi, no_hp]
        );
        res.json({ sukses: true, pesan: "Karyawan baru berhasil ditambahkan!" });
    } catch (error) {
        console.error("Error tambah karyawan:", error);
        res.status(500).json({ sukses: false, pesan: "Gagal menambah data karyawan." });
    }
});

// 3. Hapus karyawan
app.delete('/api/karyawan/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.execute("DELETE FROM tb_karyawan WHERE id_karyawan = ?", [id]);
        res.json({ sukses: true, pesan: "Data karyawan berhasil dihapus!" });
    } catch (error) {
        console.error("Error hapus karyawan:", error);
        res.status(500).json({ sukses: false, pesan: "Gagal menghapus karyawan." });
    }
});

app.listen(PORT, () => {
    console.log(`Server aktif di http://localhost:${PORT}`);
});