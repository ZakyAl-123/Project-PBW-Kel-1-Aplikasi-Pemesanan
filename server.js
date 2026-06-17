const express = require('express');
const db = require('./koneksi'); // Memanggil file koneksi.js yang baru kita buat

const app = express();
const PORT = 3000;

// Middleware agar Express bisa membaca data dari Form HTML (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));
// Middleware untuk membaca JSON
app.use(express.json());

// Rute untuk memproses form login Owner (metode POST)
app.post('/proses-login', async (req, res) => {
    // Menangkap username dan password dari input form HTML
    const { username, password } = req.body;

    try {
        // Mencari data owner di database (Menggunakan tanda ? untuk mencegah SQL Injection)
        const [rows] = await db.execute('SELECT * FROM tb_owner WHERE username = ?', [username]);

        // Jika username ditemukan
        if (rows.length > 0) {
            const owner = rows[0];

            // Cek password (Catatan: Untuk produksi nyata, gunakan library 'bcrypt' untuk mengecek password yang di-hash)
            // Di sini kita gunakan teks biasa untuk contoh
            if (password === owner.password) {
                // Login Berhasil
                res.send(`<script>alert('Selamat datang, ${owner.nama_lengkap}!'); window.location.href='/Owner/index.html';</script>`);
            } else {
                // Password Salah
                res.send("<script>alert('Password salah!'); window.location.href='/login.html';</script>");
            }
        } else {
            // Username tidak ditemukan
            res.send("<script>alert('Username tidak ditemukan!'); window.location.href='/login.html';</script>");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Terjadi kesalahan pada server.");
    }
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server Node.js berjalan di http://localhost:${PORT}`);
});