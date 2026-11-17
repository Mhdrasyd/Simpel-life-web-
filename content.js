const CONTENT = {
  "NPC_BARU": {
    "3": {
      "name": "Nona Harlot",
      "role": "Informan Kota",
      "dialog": "Aku mengenal banyak kabar kota. Bantu lindungi para saksi dari sindikat!"
    },
    "4": {
      "name": "Bang Togar",
      "role": "NPC Batak / Pemilik Bengkel",
      "dialog": "Horas! Aku Togar. Bengkelku jadi tempat warga mencari bantuan melawan mafia."
    },
    "5": {
      "name": "Bang Gilak",
      "role": "Penemu Nyentrik",
      "dialog": "Panggil aku Gilak! Idenya boleh aneh, tapi alatku bisa membantu warga!"
    },
    "6": {
      "name": "Bu Maya",
      "role": "CEO Perusahaan Logistik",
      "dialog": "Sindikat menyusup ke jalur logistik. Kita bongkar dengan bukti, bukan dugaan."
    }
  },
  "QUEST_TAMBAHAN": [
    {
      "id": "harlot_1",
      "npc": "3",
      "title": "Pesan Rahasia di Kedai",
      "brief": "Ambil pesan titipan informan sebelum pengintai mafia menemukannya.",
      "story": "Kamu mampir ke kedai dan mengenali amplop bersandi di bawah meja. Pesan sampai dengan aman ke Nona Harlot.",
      "energy": 15,
      "hours": 1,
      "reward": 90,
      "requires": null
    },
    {
      "id": "harlot_2",
      "npc": "3",
      "title": "Jalur Aman Saksi",
      "brief": "Periksa rute gang agar saksi dapat menuju rumah aman tanpa diikuti.",
      "story": "Kamu meninjau gang pasar dan menandai jalan yang bebas pengintai. Saksi tiba di rumah aman tanpa terluka.",
      "energy": 20,
      "hours": 2,
      "reward": 140,
      "requires": "harlot_1"
    },
    {
      "id": "harlot_3",
      "npc": "3",
      "title": "Daftar Informan Palsu",
      "brief": "Cocokkan pesan saksi untuk menemukan nama samaran penyusup sindikat.",
      "story": "Kamu membandingkan catatan para saksi. Nama penyusup ditemukan dan jaringan informan kembali aman.",
      "energy": 25,
      "hours": 2,
      "reward": 190,
      "requires": "harlot_2"
    },
    {
      "id": "togar_1",
      "npc": "4",
      "title": "Peralatan Bengkel yang Hilang",
      "brief": "Cari peti peralatan warga yang disembunyikan kaki tangan mafia di pasar.",
      "story": "Kamu menelusuri tanda peti di pasar, menemukan alat yang hilang, lalu mengembalikannya ke bengkel Bang Togar.",
      "energy": 20,
      "hours": 2,
      "reward": 120,
      "requires": null
    },
    {
      "id": "togar_2",
      "npc": "4",
      "title": "Konvoi Bantuan Warga",
      "brief": "Bantu siapkan kendaraan dan dampingi pengiriman bantuan melewati rute aman.",
      "story": "Kamu memeriksa roda kendaraan dan memandu konvoi melalui jalan alternatif. Bantuan tiba tanpa pungutan sindikat.",
      "energy": 25,
      "hours": 3,
      "reward": 170,
      "requires": "togar_1"
    },
    {
      "id": "togar_3",
      "npc": "4",
      "title": "Bukti Pemerasan Pasar",
      "brief": "Kumpulkan salinan kuitansi dari pedagang yang bersedia menjadi saksi.",
      "story": "Para pedagang menyerahkan salinan kuitansi. Kamu membawa bukti pemerasan ke pos pengaduan warga.",
      "energy": 30,
      "hours": 3,
      "reward": 220,
      "requires": "togar_2"
    },
    {
      "id": "gilak_1",
      "npc": "5",
      "title": "Radio dari Barang Bekas",
      "brief": "Cari komponen bekas untuk radio komunikasi pos keamanan warga.",
      "story": "Kamu mengumpulkan kabel dan speaker bekas. Bersama Bang Gilak, kamu merakit radio untuk pos warga.",
      "energy": 15,
      "hours": 2,
      "reward": 100,
      "requires": null
    },
    {
      "id": "gilak_2",
      "npc": "5",
      "title": "Alarm Gudang Warga",
      "brief": "Pasang alarm sederhana agar warga tahu jika gudang mereka didatangi penyusup.",
      "story": "Kamu memasang sensor pintu dan menguji bel. Penjaga kini mendapat peringatan saat ada penyusup.",
      "energy": 25,
      "hours": 2,
      "reward": 160,
      "requires": "gilak_1"
    },
    {
      "id": "gilak_3",
      "npc": "5",
      "title": "Peta Rute Rahasia",
      "brief": "Susun laporan pengamatan warga menjadi peta jalur distribusi sindikat.",
      "story": "Kamu menyatukan catatan waktu dan lokasi kendaraan. Peta rute sindikat selesai dan disimpan sebagai bukti.",
      "energy": 30,
      "hours": 3,
      "reward": 210,
      "requires": "gilak_2"
    },
    {
      "id": "ceo_1",
      "npc": "6",
      "title": "Audit Faktur Mencurigakan",
      "brief": "Bandingkan faktur dan catatan kiriman untuk mencari transaksi palsu mafia.",
      "story": "Kamu menemukan nomor faktur ganda. Bu Maya memisahkan transaksi mencurigakan untuk diperiksa lebih lanjut.",
      "energy": 20,
      "hours": 2,
      "reward": 130,
      "requires": null
    },
    {
      "id": "ceo_2",
      "npc": "6",
      "title": "Kargo yang Dialihkan",
      "brief": "Lacak kiriman bantuan yang dialihkan sindikat melalui catatan pengiriman.",
      "story": "Kamu mencocokkan nomor segel dan alamat tujuan. Kargo ditemukan dan dikirim kembali kepada warga yang berhak.",
      "energy": 30,
      "hours": 3,
      "reward": 200,
      "requires": "ceo_1"
    },
    {
      "id": "ceo_3",
      "npc": "6",
      "title": "Berkas Jaringan Sindikat",
      "brief": "Susun bukti transaksi menjadi berkas laporan yang dapat diperiksa pihak berwenang.",
      "story": "Kamu mengurutkan faktur dan kesaksian. Bu Maya menyerahkan berkas kepada pihak berwenang; warga mendapat harapan baru.",
      "energy": 35,
      "hours": 3,
      "reward": 260,
      "requires": "ceo_2"
    }
  ]
};
if(typeof module!=="undefined")module.exports=CONTENT;
