const mysql = require('mysql2');

// Membuat sambungan ke database MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',         // Default user XAMPP
    password: '',         // Default password XAMPP (kosong)
    database: 'db_kel1'
});

// Ubah ke mode Promise agar mudah dipakai
const db = pool.promise();

// Cek koneksi di terminal saat server dinyalakan
pool.getConnection((err, connection) => {
    if (err) {
        console.error('KONEKSI DATABASE GAGAL! Pastikan XAMPP MySQL menyala.', err.message);
    } else {
        console.log('KONEKSI DATABASE BERHASIL TERSAMBUNG!');
        connection.release();
    }
});

module.exports = db;