# Server FPS Simple Life

Paket backend untuk Render. Tampilan game tetap di Vercel.

## Upload manual ke GitHub

1. Ekstrak ZIP ini di HP atau komputer. Jangan upload ZIP-nya langsung.
2. Buat repository baru dengan nama `simple-life-fps-server`. Pilih **Private**, bukan Public.
3. Upload SEMUA 7 file hasil ekstrak ke halaman utama repository. Jangan dimasukkan ke subfolder tambahan.
4. Tekan **Commit changes**, lalu kirim link repository-nya.

Isi halaman utama repository harus seperti ini:

    arena-model.mjs
    server.mjs
    start.mjs
    package.json
    package-lock.json
    render.yaml
    README.md

Tidak perlu upload password, API key, file .env, node_modules, data pemain, atau file game RPG lain.

## Pengaturan Render saat dilanjutkan

- Gunakan akun proyek Render yang sudah dibuat.
- Akses GitHub untuk Render hanya repository ini, bukan semua repository.
- Workspace: Hobby. Compute layanan: Free, dipilih terpisah.
- Runtime: Node. Region: Singapore.
- Root Directory: kosong, karena file ada di halaman utama repository.
- Build Command: `npm ci --omit=dev`
- Start Command: `npm start`
- Health Check Path: `/healthz`
- Auto-Deploy: Off.
- Environment variable: `FPS_ALLOWED_ORIGIN=https://gameprojeksenak.vercel.app`
- `PORT` dan `RENDER_EXTERNAL_URL` disediakan otomatis oleh Render.

Tidak perlu kartu, database, atau paket berbayar. Berhenti jika layanan meminta pembayaran atau izin akses repository lain.

## Yang belum selesai

Mengupload file belum membuat server online. Setelah server Render berhasil dibuat dan diuji, alamat server yang benar baru dimasukkan ke tampilan game Vercel. Paket ini tidak mengubah data, save, pembayaran, atau konfigurasi RPG.

Kapasitas awal satu ruang untuk dua pemain. Belum ada jaminan performa, banyak pemain, atau aktif 24 jam. Render Free dapat tidur setelah 15 menit tanpa aktivitas. Pengujian server online dan penerimaan pengguna tetap perlu diselesaikan sebelum rilis umum.
