# 📖 Panduan Standar Format Dokumen Microsoft Word (.docx)
### ManualBook Generator - ManualArch React Edition

Dokumen ini berisi panduan lengkap dan aturan standar dalam menyusun file Microsoft Word (`.docx`) agar dapat diimpor dan diproses oleh AI Pipeline **ManualBook Generator** secara 100% presisi, rapi, dan terstruktur tanpa kebocoran format.

---

## 📌 1. Ringkasan Pemetaan Format (Quick Reference)

| Komponen Dokumen | Format di Microsoft Word | Hasil Render di Aplikasi |
| :--- | :--- | :--- |
| **Judul Utama Manual** | Baris 1 dokumen (misal: `MANUAL BOOK PANDUAN...`) | Judul Utama pada Cover Page |
| **Deskripsi / Subtitle** | Baris 2 dokumen | Sub-judul pada Cover Page |
| **Bab Utama (Level 1)** | Style **Heading 1** *atau* diawali `BAB 1 Judul...` | **Bab Utama (TOC Level 1 & Badge Angka)** |
| **Sub-Bab (Level 2)** | Style **Heading 2** *atau* diawali `1.1 Judul...` | **Sub-Bab (TOC Level 2)** |
| **Paragraf Deskripsi** | Teks paragraf biasa | Paragraf Teks Biasa |
| **Langkah Bernomor** | Teks biasa: `1. Teks...`, `2. Teks...` | **Numbered List (Langkah Berurutan)** |
| **Langkah Kustom** | `Langkah 1 : Teks...`, `Langkah 2 : Teks...` | **Bullet List Langkah (Bold Biru)** |
| **Fitur / Parameter** | `Nama Fitur : Penjelasan` | **Feature List (Teks Bold + Deskripsi)** |
| **Fitur Kondisional** | `Fungsi X : ... jika dinaikkan ... jika diturunkan ...` | **Box Fitur Kondisional (Naik/Turun)** |
| **Bullet List Biasa** | Diprakahi simbol `•`, `-`, atau `*` | **Bullet List Standar** |
| **Catatan / Warning** | Diawali `Catatan:`, `Perhatian:`, atau `Warning:` | **Callout Box Catatan (Kuning/Merah)** |
| **Tabel Data** | Tabel Word standar (Baris 1 = Header) | **Komponen Tabel Terformat A4** |
| **Gambar & Caption** | Sisipkan Gambar + teks `Gambar 1: Keterangan` di bawahnya | **Komponen Gambar & Caption Resmi** |
| **Glosarium** | Buat Tabel 2 kolom di bawah sub-bab `GLOSARIUM` | **Halaman Tabel Glosarium Bawaan** |

---

## 📝 2. Detail & Contoh Setiap Komponen

### A. Judul & Cover Dokumen
Tulis di baris pertama dan kedua dokumen Word:
```text
MANUAL BOOK PANDUAN PENGGUNAAN SISTEM AUTOMASI
Dokumentasi Sistematis Arsitektur, Fitur, dan Panduan Operasional Perangkat
```

---

### B. Bab Utama (Heading 1)
Gunakan style **Heading 1** di Word, atau tulis awalan `BAB <Nomor>`:
```text
1. Pengenalan Umum Sistem
```
*atau:*
```text
BAB 1: PENGANTAR SISTEM AUTOMASI AI
```
> **Catatan**: Sistem akan otomatis membuang awalan `BAB 1:` dan menyusun penomoran bab secara rapi (`1. Pengenalan Umum Sistem`).

---

### C. Sub-Bab (Heading 2)
Gunakan style **Heading 2** di Word, atau tulis penomoran sub-bab:
```text
1.1 Overview Aplikasi
```
*atau:*
```text
1.2 Spesifikasi Parameter Modul
```

---

### D. Poin Langkah Bernomor (Numbered Steps)
Tulis teks biasa dengan angka dan titik/kurung:
```text
Berikut adalah prosedur pengoperasian awal:
1. Pastikan perangkat terhubung dengan sumber daya listrik dan jaringan lokal.
2. Buka browser dan ketik alamat IP server http://192.168.1.1.
3. Masukkan Username dan Password akun Administrator.
4. Klik tombol Login untuk membuka Dashboard Utama.
```

---

### E. Poin Langkah Format "Langkah N :"
Gunakan kata `Langkah 1 :`, `Langkah 2 :`, dst:
```text
Berikut adalah petunjuk perawatan perangkat:
Langkah 1 : Periksa kebersihan saluran udara dan kipas pendingin.
Langkah 2 : Kencangkan sambungan kabel konektor antena pada port belakang.
Langkah 3 : Lakukan verifikasi tegangan listrik menggunakan multimeter.
```

---

### F. Poin Fitur & Parameter (Feature List)
Gunakan format `Nama Parameter : Penjelasan`:
```text
MaxConcurrency : Jumlah maksimum tugas paralel yang dapat diproses secara bersamaan oleh worker node.
TimeoutPeriod : Batas waktu maksimal (dalam detik) sebelum sistem menandakan status kegagalan koneksi.
RetryAttempts : Batas percobaan ulang eksekusi ketika terjadi hambatan jaringan sementara.
```

---

### G. Fitur Parameter Kondisional (Jika Dinaikkan / Diturunkan)
Tulis penjelasan fungsi dengan kata kunci `JIKA`:
```text
Fungsi Transmit Power : Mengatur kekuatan daya pancar sinyal radio modul jika dinaikkan jangkauan sinyal meluas jika diturunkan menghemat konsumsi daya.
```

---

### H. Bullet List Biasa
Gunakan karakter bullet (`•`, `-`, atau `*`):
```text
• Mendukung integrasi webhook secara langsung.
• Ekstraksi teks berbasis OCR presisi tinggi.
- Penyimpanan log otomatis pada server lokal.
```

---

### I. Catatan / Peringatan (Callout Box)
Gunakan kata kunci `Catatan:`, `Perhatian:`, atau `Warning:` di awal paragraf:
```text
Catatan: Pastikan lisensi perangkat masih berlaku sebelum melakukan pembaruan firmware.
```

---

### J. Tabel Data
Buat Tabel Word biasa. Baris 1 otomatis dijadikan Header Tabel:

| Modul Utama | Kapasitas Beban | Status Operasional |
| :--- | :--- | :--- |
| **Engine Ingest** | 1.500 req/sec | Stabil |
| **Parser PDF** | 850 req/sec | Optimal |
| **Exporter PDF** | 1.200 req/sec | Aktif |

---

### K. Gambar & Caption
Sisipkan Gambar Word (PNG/JPG), lalu di bawah gambar beri keterangan bertuliskan `Gambar <Nomor>: Keterangan`:
```text
[Sisipkan Gambar Word Di Sini]

Gambar 1: Caption Grafik Respon Transmisi Data Sistem Automasi
```

---

### L. Glosarium / Daftar Istilah (Tabel Bawaan Word)
Buat tabel 2 kolom di bawah judul `GLOSARIUM ISTILAH`:

```text
GLOSARIUM ISTILAH
Tabel glosarium berikut memuat istilah teknis beserta definisinya:
```

| Istilah / Term | Definisi Pengertian |
| :--- | :--- |
| **API** | Antarmuka perangkat lunak yang memungkinkan dua aplikasi bertukar data. |
| **Concurrency** | Kemampuan sistem untuk mengeksekusi beberapa proses secara bersamaan. |

---

## 📋 3. Template Murni (Placeholder Siap Copas)

```text
[JUDUL DOKUMEN]
[SUBTITLE / DESKRIPSI SINGKAT DOKUMEN]


1. [JUDUL BAB 1]
(Style Word: Heading 1)

1.1 [JUDUL SUB-BAB 1.1]
(Style Word: Heading 2)

[TEKS PARAGRAF DESKRIPSI BIASA]

[NAMA FITUR 1] : [DESKRIPSI FITUR 1]
[NAMA FITUR 2] : [DESKRIPSI FITUR 2]
[NAMA FITUR 3] : [DESKRIPSI FITUR 3]


2. [JUDUL BAB 2]
(Style Word: Heading 1)

2.1 [JUDUL SUB-BAB 2.1]
(Style Word: Heading 2)

1. [NAMA LANGKAH 1]
2. [NAMA LANGKAH 2]
3. [NAMA LANGKAH 3]

Langkah 1 : [DESKRIPSI LANGKAH 1]
Langkah 2 : [DESKRIPSI LANGKAH 2]
Langkah 3 : [DESKRIPSI LANGKAH 3]


3. [JUDUL BAB 3]
(Style Word: Heading 1)

3.1 [JUDUL SUB-BAB 3.1]
(Style Word: Heading 2)

-------------------------------------------------------
| [HEADER 1]      | [HEADER 2]      | [HEADER 3]      |
-------------------------------------------------------
| [ISI BARIS 1]   | [ISI BARIS 1]   | [ISI BARIS 1]   |
| [ISI BARIS 2]   | [ISI BARIS 2]   | [ISI BARIS 2]   |
-------------------------------------------------------

[SISIPKAN GAMBAR DI SINI]

Gambar 1: [KETERANGAN / CAPTION GAMBAR]
```

---

## 🧪 4. Template Contoh Dokumen Lengkap (Siap Copas)

```text
MANUAL BOOK PANDUAN PENGGUNAAN SISTEM AUTOMASI AI
Dokumentasi Sistematis Arsitektur, Fitur, dan Panduan Operasional Perangkat


1. Pengenalan Umum Sistem

1.1 Overview Aplikasi
Bab ini memuat gambaran umum, tata cara konfigurasi, serta arsitektur alur kerja otomasi berbasis kecerdasan buatan untuk pemrosesan dokumen otomatis.

1.2 Spesifikasi Parameter Modul
MaxConcurrency : Jumlah maksimum tugas paralel yang dapat diproses secara bersamaan oleh worker node.
TimeoutPeriod : Batas waktu maksimal (dalam detik) sebelum sistem menandakan status kegagalan koneksi.
RetryAttempts : Batas percobaan ulang eksekusi ketika terjadi hambatan jaringan sementara.

• Mendukung integrasi webhook secara langsung.
• Ekstraksi teks berbasis OCR presisi tinggi.
- Penyimpanan log otomatis pada server lokal.


2. Panduan Penggunaan dan Prosedur Lapangan

2.1 Tahapan Instalasi dan Konfigurasi Node
Ikuti urutan langkah berikut untuk mengaktifkan modul otomatisasi:
1. Unduh pustaka ketergantungan utama menggunakan package manager.
2. Inisialisasi berkas konfigurasi lingkungan (.env) sesuai dengan kunci API yang valid.
3. Jalankan perintah migrasi skema database lokal untuk penyiapan awal.

2.2 Rincian Alur Kerja Per Eksekusi
Langkah 1 : Validasi otentikasi kunci enkripsi pada header permintaan.
Langkah 2 : Pengambilan data mentah dari antrean pesan (message queue).
Langkah 3 : Transformasi data ke dalam format JSON terstruktur.


3. Spesifikasi Teknis dan Grafik Data

3.1 Tabel Pemetaan Kinerja Sistem

Modul Utama	Kapasitas Beban	Status Operasional
Engine Ingest	1.500 req/sec	Stabil
Parser PDF	850 req/sec	Optimal
Exporter PDF	1.200 req/sec	Aktif

[Sisipkan Gambar Di Sini]

Gambar 1: Caption Grafik Respon Transmisi Data Sistem Automasi
```
