// Memanggil library mysql2
const mysql = require('mysql2');

// Membuat konfigurasi pool koneksi
const pool = mysql.createPool({
    host: 'localhost',      // Host database Anda
    user: 'root',           // Username database (default XAMPP/Laragon)
    password: '',           // Password database (kosongkan jika default)
    database: 'db_kel1',// Nama database Anda
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Menggunakan promise agar kode lebih bersih (bisa pakai async/await)
const db = pool.promise();

// Mengetes koneksi saat file dijalankan
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Koneksi ke database gagal:', err.message);
    } else {
        console.log('Koneksi ke database MySQL berhasil!');
        connection.release();
    }
});

// Mengekspor koneksi agar bisa dipakai di file lain
module.exports = db;