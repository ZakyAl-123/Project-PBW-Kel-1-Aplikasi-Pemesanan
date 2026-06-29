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
        const totalPesanan = rowsPesanan[0].total_pesanan;

        // 2. Hitung Pendapatan Khusus Hari Ini
        const [rowsPendapatan] = await db.execute("SELECT SUM(total_harga) AS total_pendapatan FROM tb_pesanan WHERE DATE(waktu) = CURDATE()");
        const pendapatanHariIni = rowsPendapatan[0].total_pendapatan || 0; // Jika 0/null, jadikan 0

        // 3. Hitung Jumlah Menu yang Aktif (Tersedia)
        const [rowsMenu] = await db.execute("SELECT COUNT(id_menu) AS menu_aktif FROM tb_menu WHERE status = 'Tersedia'");
        const menuAktif = rowsMenu[0].menu_aktif;

        // Kirim sebagai JSON
        res.json({
            totalPesanan: totalPesanan,
            pendapatanHariIni: pendapatanHariIni,
            menuAktif: menuAktif
        });
    } catch (error) {
        console.error("Error ambil statistik:", error);
        res.status(500).json({ pesan: "Gagal mengambil statistik." });
    }
});

app.listen(PORT, () => {
    console.log(`Server aktif di http://localhost:${PORT}`);
});