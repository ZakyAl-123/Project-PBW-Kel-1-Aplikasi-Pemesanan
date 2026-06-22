const express = require('express');
const path = require('path'); // Library untuk menangani path folder
const db = require('./koneksi');

const app = express();
const PORT = 3000;

// Middleware untuk membaca form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Mengizinkan server mengakses file statis (CSS, JS, Gambar) di folder "Owner"
// Jadi nanti di HTML, Anda cukup panggil link="style.css" tanpa menyebut folder lagi
app.use(express.static(path.join(__dirname, 'Owner')));

// Rute untuk menampilkan halaman login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Rute untuk memproses login
app.post('/proses-login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM tb_owner WHERE username = ?', [username]);

        if (rows.length > 0) {
            const owner = rows[0];
            
            // Verifikasi Password (di sini kita masih menggunakan perbandingan teks biasa)
            if (password === owner.password) {
                // Arahkan ke file index.html di dalam folder "Owner"
                res.send(`
                    <script>
                        alert('Selamat datang, ${owner.nama_lengkap}!'); 
                        window.location.href = '/index.html';
                    </script>
                `);
            } else {
                res.send("<script>alert('Password salah!'); window.location.href='/login.html';</script>");
            }
        } else {
            res.send("<script>alert('Username tidak ditemukan!'); window.location.href='/login.html';</script>");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Terjadi kesalahan pada server.");
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});