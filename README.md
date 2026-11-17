# Simple Life RPG: Mafia Underworld - Web 2.0

Game berbahasa Indonesia, versi web dari `simple_life_rpg_update.py` milikmu.
HTML, CSS, JavaScript biasa. Tidak butuh framework, npm install di proyek, atau proses build. Tidak memakai kode, aset, akun, atau layanan Konoha.

## Yang baru di Web 2.0

- Musik latar chiptune asli, disintesis langsung di perangkat dengan WebAudio. Tanpa file audio, tanpa cuplikan lagu: bebas hak cipta. Lagu kota santai, lagu boss lebih tegang, efek suara kecil (koin, tanam, panen, pukul), dan sting kemenangan/kekalahan.
- Pemutar musik menyatu di pojok atas (tombol ♪): putar/jeda, volume, preferensi tersimpan.
- Cloud Save (tombol ☁): cadangkan progres dan lanjutkan di HP/perangkat lain dengan Kode Save. Butuh satu kali setup gratis di dashboard Vercel (langkah di bawah). Tanpa setup itu game tetap jalan normal dengan save lokal.
- Polesan UI/UX: warna langit mengikuti jam di game, meter pixel bersegmen, bar air tanaman, tahap tumbuh tanaman, toast kejadian terbaru, bar status menempel di layar HP, animasi halus (hormati prefers-reduced-motion).

## Isi proyek

- index.html: halaman utama
- style.css: tampilan pixel retro, responsif untuk HP
- content.js: dialog 4 NPC dan 12 quest, diekstrak langsung dari Python asli
- engine.js: aturan permainan dan pertanian
- music-data.js / music.js: lagu dan pemutar chiptune
- cloud.js: panel dan sinkronisasi cloud save di sisi pemain
- api/cloud.js: fungsi serverless Vercel untuk menyimpan save (Redis REST)
- app.js: tombol, layar, autosave
- vercel.json: pengaturan static site
- test-*.cjs: tes logika (opsional, tidak ikut deployment)

## Main

Ketik nama, lalu tekan Mulai petualangan. Kalau ada save, tekan Lanjutkan petualangan.

Lima pekerjaan lama, Pak Tua, main quest, cicilan hutang, Don Salvatore, 4 NPC dan seluruh 12 quest sampingan tetap tersedia. Quest sampingan tidak mengganti main quest. Hadiah quest hanya sekali. Semua angka upah, biaya, waktu, energi, damage dan hadiah lama dipertahankan.

## Bertani

Buka Lahan & Bertani. Tersedia 4 petak gratis.

1. Beli benih di Kios Benih & Hasil Panen.
2. Tanam di petak kosong: -5 energi, +30 menit.
3. Siram / Rawat: -5 energi, +30 menit, memberi 24 jam air.
4. Kerja, quest, atau istirahat agar waktu game maju. Tanaman hanya tumbuh selama masih ada air. Hujan ringan dan badai ikut menyiram otomatis. Jika air habis, pertumbuhan berhenti, tanaman tidak mati.
5. Panen saat siap: -5 energi, +30 menit. Lalu jual hasil di kios.

| Tanaman | Harga benih | Jam tumbuh | Hasil panen | Harga jual per unit |
| --- | ---: | ---: | ---: | ---: |
| Padi | $35 | 24 | 3 | $25 |
| Jagung | $50 | 36 | 4 | $30 |

Semua uang adalah uang fiktif di dalam game. Waktu hanya maju lewat aktivitas, bukan saat tab ditinggal. Cuaca adalah cuaca acak dunia game, bukan prakiraan cuaca sungguhan.

## Musik

Tekan tombol ♪ di pojok atas untuk membuka pemutar: putar/jeda dan volume. Musik mulai otomatis saat kamu menekan tombol pertama kali (aturan browser). Lagu berubah sendiri saat boss fight. Pilihan musik dan volume tersimpan di perangkat.

## Cloud Save

Setiap pemain punya Kode Save (contoh: KOTA-7F2K), terlihat di panel ☁.

- Sinkron otomatis: setiap aksi ikut dicadangkan ke cloud (bisa dimatikan di panel).
- Pindah perangkat: di HP/browser lain, buka panel ☁, masukkan Kode Save yang sama di kolom "Punya kode dari perangkat lain?", tekan Hubungkan, lalu Pulihkan dari Cloud.
- Progres tetap tersimpan otomatis di perangkat (localStorage) walau cloud mati atau belum diaktifkan.
- Simpan kode baik-baik. Siapa pun yang tahu kodenya bisa memuat dan menimpa cadanganmu.

### Aktifkan Cloud Save (sekali saja, gratis)

Tanpa langkah ini game tetap jalan 100%, hanya cloud save yang belum aktif.

1. Deploy proyek seperti biasa (`vercel --prod`).
2. Buka https://vercel.com dan masuk ke akunmu.
3. Buka proyek game-mu, lalu buka tab **Storage**.
4. Pilih **Create Database** → pilih **Upstash** (Redis). Pastikan paket **Free**. Jangan setujui yang berbayar.
5. Ikuti pembuatan database (nama bebas; region dekat Singapore bila ditawarkan), lalu **Connect Project** → pilih proyek game-mu → environment **Production**.
6. Setelah environment variables terpasang, deploy ulang: dari Termux jalankan `vercel --prod` lagi (atau tombol **Redeploy** di dashboard).
7. Buka game → tombol ☁ → status berubah menjadi **Aktif**.

Catatan: nama tombol di dashboard bisa sedikit berbeda. Yang penting database Redis dari Upstash terhubung ke proyek dan environment variables-nya terpasang. Kode di `api/cloud.js` otomatis mengenali pasangan variabel `KV_REST_API_URL`/`KV_REST_API_TOKEN`, `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, atau pasangan lain berakhiran `_REST_API_URL`/`_REST_URL` — jadi tidak perlu mengubah file apa pun.

## Autosave lokal

Setiap aksi disimpan otomatis di localStorage browser, pada alamat situs yang sama. Mode samaran, menghapus data browser, atau pindah alamat deployment dapat membuat save lokal tidak tersedia; cadangan cloud tetap ada bila cloud save aktif. Tombol Reset game meminta konfirmasi sebelum menghapus progres. Tidak ada data lain yang dikirim ke server selain save game saat cloud save aktif.

## Deploy ke Vercel dari Termux di Android

Simpan ZIP `simple-life-web.zip` ke folder Download Android. Jangan ubah namanya. Jika WhatsApp menyimpannya di folder lain, pindahkan dulu ke Download melalui aplikasi Files.

Jalankan ini di Termux, bukan dikirim sebagai pesan chat:

```sh
pkg update && pkg upgrade -y
pkg install nodejs-lts unzip -y
termux-setup-storage
```

Izinkan akses penyimpanan Android saat diminta. Setelah itu:

```sh
mkdir -p ~/game-projects
unzip ~/storage/downloads/simple-life-web.zip -d ~/game-projects
cd ~/game-projects/simple-life-web
npm i -g vercel
vercel --version
vercel login
```

Ikuti instruksi login yang tampil. Jika diberikan alamat browser atau kode perangkat, buka alamatnya di browser HP, login ke akun Vercel milikmu, dan setujui perangkat. Selesaikan verifikasi email jika diminta, lalu kembali ke Termux.

Lalu:

```sh
vercel whoami
vercel --prod
```

Pada pertanyaan setup:

- Set up and deploy: Y
- Link to existing project: Y jika memperbarui proyek simple-life-rpg yang sudah ada; N untuk proyek baru.
- Project name: simple-life-rpg (atau nama lain yang tersedia).
- Directory: ./
- Framework: Other jika diminta.
- Build command: kosong. Output directory: . jika diminta. Install command: kosong.
- Jika ditanya mau mengubah pengaturan lain: N.

CLI akan menampilkan URL deployment dan alias produksi. Buka alamat `https://...vercel.app` yang benar-benar dicetak CLI. Gunakan alias produksi yang tetap untuk bermain agar save lokal tetap di origin yang sama.

Untuk update berikutnya, ganti file proyek di folder yang sama lalu jalankan `vercel --prod`.

Tidak perlu membeli domain atau paket berbayar untuk mengikuti langkah ini. Vercel CLI tidak diperlukan untuk memainkan game setelah situs terpasang.

## Coba lokal (opsional)

Di Termux:

```sh
pkg install python -y
cd ~/game-projects/simple-life-web
python -m http.server 8000 --bind 127.0.0.1
```

Buka http://127.0.0.1:8000 di browser HP. Cloud save tidak aktif di mode lokal (tombol ☁ akan bilang belum diaktifkan); sisanya jalan normal.

## Tes

```sh
node test-engine.cjs      # 15 kelompok tes aturan game
node test-music-data.cjs  # integritas data lagu
node test-cloud.cjs       # fungsi api/cloud.js dengan mock Redis
```

Juga dimainkan langsung di Chrome ukuran 390 x 844: mulai game, musik otomatis, beli benih, tanam, siram, quest Pak Tua, boss fight sampai menang, panel musik, panel cloud, simpan ke cloud, hapus save lokal, hubungkan Kode Save, dan pulihkan dari cloud. Tidak ditemukan error JavaScript pada alur itu.

## Rujukan deployment

- https://vercel.com/docs/cli
- https://vercel.com/docs/cli/login
- https://vercel.com/docs/cli/deploying-from-cli
- https://vercel.com/docs/redis

Proyek ini siap deploy, tetapi belum diunggah ke akun Vercel milikmu. Tidak ada klaim bahwa alamat vercel.app sudah aktif.
