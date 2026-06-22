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

app.listen(PORT, () => {
    console.log(`Server aktif di http://localhost:${PORT}`);
});