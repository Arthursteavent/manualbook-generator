import { Sidebar } from '../components/layout/Sidebar';

interface FormatGuideItem {
  id: string;
  title: string;
  badge: string;
  wordInput: string;
  description: string;
  renderPreview: React.ReactNode;
}

export function DocumentationPage() {
  


  const handleDownloadWord = () => {
    const link = document.createElement('a');
    link.href = '/api/download-template';
    link.download = 'Template_Format_ManualBook.docx';
    document.body.appendChild(link);
    link.click(); 
    document.body.removeChild(link);
  };

  const guides: FormatGuideItem[] = [
    {
      id: 'cover',
      title: 'Judul Utama & Cover Dokumen',
      badge: 'Cover Page',
      description: 'Tulis di baris 1 dan baris 2 dokumen paling atas untuk menghasilkan Halaman Sampul (Cover).',
      wordInput: `MANUAL BOOK PANDUAN PENGGUNAAN SISTEM AUTOMASI AI`,
      renderPreview: (
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 24, borderRadius: 12, border: '1px solid #334155', color: '#fff' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#00d2ff', textTransform: 'uppercase', marginBottom: 12 }}>
            MANUAL BOOK
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', borderLeft: '4px solid #00d2ff', paddingLeft: 12, margin: '8px 0' }}>
            MANUAL BOOK PANDUAN PENGGUNAAN SISTEM AUTOMASI AI
          </h2>
        </div>
      ),
    },
    {
      id: 'heading1',
      title: 'Bab Utama (Heading 1)',
      badge: 'Chapter Level 1',
      description: 'Gunakan Style Heading 1 di Word (tanpa perlu mengetik "BAB 1" atau angka). Otomatis menjadi Bab utama, membuat halaman bab baru, & masuk ke Daftar Isi.',
      wordInput: `Pengenalan Umum Sistem`,
      renderPreview: (
        <div style={{ background: '#ffffff', padding: 20, borderRadius: 10, border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '3px solid #00d2ff', paddingBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#00d2ff', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              1
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              Pengenalan Umum Sistem
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'heading2',
      title: 'Sub-Bab (Heading 2)',
      badge: 'Sub-Chapter Level 2',
      description: 'Gunakan Style Heading 2 di Word (tanpa perlu mengetik angka "1.1"). Otomatis dirender dengan garis bawah aksen biru dan didaftarkan sebagai Sub-Bab.',
      wordInput: `Overview Aplikasi`,
      renderPreview: (
        <div style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #00d2ff', paddingBottom: 6 }}>
            1.1 Overview Aplikasi
          </div>
        </div>
      ),
    },
    {
      id: 'heading3',
      title: 'Sub-Sub-Bab (Heading 3)',
      badge: 'Sub-Chapter Level 3',
      description: 'Gunakan Style Heading 3 di Word (tanpa perlu mengetik angka "1.1.1"). Otomatis dirender sebagai Sub-Sub-Bab tingkat 3.',
      wordInput: `Detail Konfigurasi Sistem`,
      renderPreview: (
        <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>
            1.1.1 Detail Konfigurasi Sistem
          </div>
        </div>
      ),
    },
    {
      id: 'steps',
      title: 'Poin Langkah Bernomor (Numbered Steps)',
      badge: 'Steps List',
      description: 'Ketik angka dan titik (1., 2., 3.). Otomatis dikelompokkan menjadi list prosedur bernomor ( Tanpa numerik otomatis bawaan word ).',
      wordInput: `1. Unduh pustaka ketergantungan utama menggunakan package manager.
2. Inisialisasi berkas konfigurasi lingkungan (.env) sesuai dengan kunci API.
3. Jalankan perintah migrasi skema database lokal untuk penyiapan awal.`,
      renderPreview: (
        <div style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Unduh pustaka ketergantungan utama menggunakan package manager.',
            'Inisialisasi berkas konfigurasi lingkungan (.env) sesuai dengan kunci API.',
            'Jalankan perintah migrasi skema database lokal untuk penyiapan awal.',
          ].map((text, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {idx + 1}
              </span>
              <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'custom_steps',
      title: 'Poin Langkah Format "Langkah N :',
      badge: 'Custom Steps',
      description: 'Gunakan kata "Langkah 1 :", "Langkah 2 :", dst. Otomatis dirender sebagai bullet list berbold biru.',
      wordInput: `Langkah 1 : Validasi otentikasi kunci enkripsi pada header permintaan.
Langkah 2 : Pengambilan data mentah dari antrean pesan (message queue).
Langkah 3 : Transformasi data ke dalam format JSON terstruktur.`,
      renderPreview: (
        <div style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { step: 'Langkah 1', desc: 'Validasi otentikasi kunci enkripsi pada header permintaan.' },
            { step: 'Langkah 2', desc: 'Pengambilan data mentah dari antrean pesan (message queue).' },
            { step: 'Langkah 3', desc: 'Transformasi data ke dalam format JSON terstruktur.' },
          ].map((item, idx) => (
            <div key={idx} style={{ fontSize: 13, color: '#334155' }}>
              <span style={{ fontWeight: 800, color: '#0284c7' }}>{item.step}: </span>
              <span>{item.desc}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'features',
      title: 'Fitur & Parameter (Feature List)',
      badge: 'Parameter List',
      description: 'Gunakan format "Nama Parameter : Penjelasan". Otomatis dijadikan poin list berbold biru.',
      wordInput: `MaxConcurrency : Jumlah maksimum tugas paralel yang dapat diproses secara bersamaan oleh worker node.
TimeoutPeriod : Batas waktu maksimal (dalam detik) sebelum sistem menandakan status kegagalan koneksi.
RetryAttempts : Batas percobaan ulang eksekusi ketika terjadi hambatan jaringan sementara.`,
      renderPreview: (
        <div style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'MaxConcurrency', desc: 'Jumlah maksimum tugas paralel yang dapat diproses secara bersamaan oleh worker node.' },
            { name: 'TimeoutPeriod', desc: 'Batas waktu maksimal (dalam detik) sebelum sistem menandakan status kegagalan koneksi.' },
            { name: 'RetryAttempts', desc: 'Batas percobaan ulang eksekusi ketika terjadi hambatan jaringan sementara.' },
          ].map((item, idx) => (
            <div key={idx} style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
              <strong style={{ color: '#0284c7', fontWeight: 700 }}>{item.name}: </strong>
              <span>{item.desc}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'callout',
      title: 'Kotak Catatan / Perhatian (Callout Note Box)',
      badge: 'Callout Note',
      description: 'Paragraf diawali kata "Catatan:", "Perhatian:", "Warning:", atau "Note:". Otomatis dirender dalam kotak aksen bernuansa kuning-amber.',
      wordInput: `Catatan: Pastikan Anda telah mengunduh kredensial akses terbaru sebelum melanjutkan langkah migrasi data.`,
      renderPreview: (
        <div style={{ background: '#fffbebf0', padding: '12px 16px', borderLeft: '4px solid #f59e0b', borderRadius: '0 8px 8px 0', color: '#92400e', fontSize: 12.5 }}>
          <strong>Catatan:</strong> <span>Pastikan Anda telah mengunduh kredensial akses terbaru sebelum melanjutkan langkah migrasi data.</span>
        </div>
      ),
    },
    {
      id: 'image_legend',
      title: 'Gambar & Legenda Keterangan Visual (Image & Legend)',
      badge: 'Image & Legend',
      description: 'Sisipkan gambar di Word beserta caption (Gambar N. Caption) dan poin penjelasan di bawahnya. Otomatis dirender dengan bingkai gambar & badge lingkaran biru sekuensial.',
      wordInput: `[Sisipkan Gambar di Word]
Gambar 8. Log Deteksi RF dan Informasi Drone
3. Posisi Drone
4. Estimasi lokasi pilot.`,
      renderPreview: (
        <div style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid #cbd5e1', textAlign: 'center' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ width: '100%', height: 90, background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>
              🖼️ [Gambar Visual Tampilan Aplikasi]
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>Gambar 8. Log Deteksi RF dan Informasi Drone</div>
          </div>
          <div style={{ marginTop: 10 }}>
            {[
              { num: 3, text: 'Posisi Drone' },
              { num: 4, text: 'Estimasi lokasi pilot.' },
            ].map((item) => (
              <div key={item.num} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6, textAlign: 'left' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {item.num}
                </span>
                <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, flex: 1, textAlign: 'left' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'bullets',
      title: 'Poin Peluru Standar (Bullet List)',
      badge: 'Bullet List',
      description: 'Gunakan bullet list standar Word (poin peluru). Otomatis dirender sebagai daftar peluru rapi rata kiri.',
      wordInput: `• Modul deteksi frekuensi radio bawaan
• Sistem peringatan dini insiden drone
• Laporan audit dan bukti fisik berbasis PDF`,
      renderPreview: (
        <div style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid #cbd5e1' }}>
          <ul style={{ margin: 0, paddingLeft: 20, listStyleType: 'disc' }}>
            <li style={{ marginBottom: 4, fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>Modul deteksi frekuensi radio bawaan</li>
            <li style={{ marginBottom: 4, fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>Sistem peringatan dini insiden drone</li>
            <li style={{ marginBottom: 4, fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>Laporan audit dan bukti fisik berbasis PDF</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'table',
      title: 'Tabel Data (Word Table)',
      badge: 'Data Table',
      description: 'Buat Tabel Word standar. Baris 1 otomatis dijadikan Header Tabel.',
      wordInput: `Modul Utama\tKapasitas Beban\tStatus Operasional
Engine Ingest\t1.500 req/sec\tStabil
Parser PDF\t850 req/sec\tOptimal
Exporter PDF\t1.200 req/sec\tAktif`,
      renderPreview: (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: 700, textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', borderBottom: '2px solid #cbd5e1' }}>Modul Utama</th>
              <th style={{ padding: '8px 12px', borderBottom: '2px solid #cbd5e1' }}>Kapasitas Beban</th>
              <th style={{ padding: '8px 12px', borderBottom: '2px solid #cbd5e1' }}>Status Operasional</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>Engine Ingest</td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>1.500 req/sec</td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#16a34a', fontWeight: 700 }}>Stabil</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px' }}>Parser PDF</td>
              <td style={{ padding: '8px 12px' }}>850 req/sec</td>
            </tr>
          </tbody>
        </table>
      ),
    },
    {
      id: 'table_image',
      title: 'Gambar / Visual dalam Tabel (Image in Table)',
      badge: 'Table with Images',
      description: 'Anda dapat menyisipkan Gambar / Screenshot ke dalam sel tabel Word. Gambar akan otomatis tersisip dan disesuaikan ukurannya di dalam sel tabel.',
      wordInput: `Komponen\tVisual / Screenshot\tKeterangan
Dashboard\t[Sisipkan Gambar di Word]\tTampilan antarmuka utama pengguna`,
      renderPreview: (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: 700, textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', borderBottom: '2px solid #cbd5e1' }}>Komponen</th>
              <th style={{ padding: '8px 12px', borderBottom: '2px solid #cbd5e1' }}>Visual / Screenshot</th>
              <th style={{ padding: '8px 12px', borderBottom: '2px solid #cbd5e1' }}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px 12px', color: '#0f172a', fontWeight: 600 }}>Dashboard</td>
              <td style={{ padding: '8px 12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', padding: '8px 12px', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🖼️</span> [Gambar dalam Sel Tabel]
                </div>
              </td>
              <td style={{ padding: '8px 12px', color: '#334155' }}>Tampilan antarmuka utama pengguna</td>
            </tr>
          </tbody>
        </table>
      ),
    },

  ];

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden', background: '#000000', color: '#f2f4f6', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Content */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', padding: '24px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid #1e293b', paddingBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#00d2ff', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
              PANDUAN & DOKUMENTASI
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.5px' }}>
              📚 Format Standar Dokumen Word (.docx)
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '6px 0 0' }}>
              Panduan visual pemetaan format input Microsoft Word ke hasil render komponen A4 AI ManualBook.
            </p>
          </div>

          <button
            onClick={handleDownloadWord}
            style={{
              background: 'linear-gradient(135deg, #00d2ff, #0088cc)',
              border: 'none',
              color: '#ffffff',
              padding: '11px 20px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 210, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <span>📥</span> Download Template Word (.docx)
          </button>
        </div>

        {/* Quick Nav Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {guides.map((g) => (
            <a
              key={g.id}
              href={`#guide-${g.id}`}
              style={{
                background: '#090d16',
                border: '1px solid #1e293b',
                color: '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              # {g.title}
            </a>
          ))}
        </div>

        {/* Format Guides List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {guides.map((item, index) => (
            <div
              id={`guide-${item.id}`}
              key={item.id}
              style={{
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#00d2ff', background: 'rgba(0, 210, 255, 0.12)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(0, 210, 255, 0.25)' }}>
                    {index + 1}. {item.badge}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    {item.title}
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18, marginTop: 0 }}>
                {item.description}
              </p>

              {/* Side-by-Side Comparison Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Left: Input Text Word */}
                <div style={{ background: '#030712', border: '1px solid #1f2937', borderRadius: '10px', padding: '16px', position: 'relative' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📝</span> Cara Tulis di Microsoft Word (.docx)
                  </div>
                  <pre
                    style={{
                      fontFamily: "'Fira Code', 'Courier New', monospace",
                      fontSize: '12.5px',
                      color: '#e5e7eb',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.6,
                    }}
                  >
                    {item.wordInput}
                  </pre>
                </div>

                {/* Right: Render Preview */}
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✨</span> Hasil Render Komponen A4 Aplikasi
                  </div>
                  {item.renderPreview}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
