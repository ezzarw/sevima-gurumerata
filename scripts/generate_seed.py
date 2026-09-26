#!/usr/bin/env python3
"""
Generator seed GuruMerata → supabase/seed.sql

Aturan bisnis (sama persis dengan src/lib/domain/logika.ts):
  beban mapel  x        = rombel x jam tatap muka per rombel per minggu
  jumlah_butuh          = max(1, floor(x / 24))      # 24 jam = ambang wajib untuk TPG
  jam_ngajar per guru   = min(40, ceil(x / jumlah_ada))
  kurang                = max(butuh - ada, 0)        # sekolah kekurangan guru
  lebih                 = max(ada - butuh, 0)        # guru kelebihan -> jam ngajar < 24 -> TPG rawan

Roster guru dibangkitkan dari rombel, jadi angka kekurangan/kelebihan muncul
dari datanya sendiri: kota besar cenderung kelebihan, daerah 3T kekurangan.
Deterministik (UUID tetap) supaya aman dijalankan ulang.
"""
import uuid, os, json, math

DIR = os.path.dirname(os.path.abspath(__file__))
NS = uuid.UUID("11111111-2222-3333-4444-555555555555")
def uid(*parts): return str(uuid.uuid5(NS, "|".join(parts)))
def esc(s): return "'" + str(s).replace("'", "''") + "'"

JAM = json.load(open(os.path.join(DIR, "..", "src", "lib", "domain", "jam-per-rombel.json")))
JAM = {k: v for k, v in JAM.items() if not k.startswith("_")}

AMBANG_JAM = 24
JAM_MAKSIMAL = 40

PROV = [
    ("31", "DKI Jakarta", -6.2088, 106.8456),
    ("32", "Jawa Barat", -6.9147, 107.6098),
    ("53", "Nusa Tenggara Timur", -10.1772, 123.6070),
    ("94", "Papua", -2.5916, 140.6690),
    ("73", "Sulawesi Selatan", -5.1477, 119.4327),
]

KAB = [
    ("31", "Kota Jakarta Pusat", -6.1862, 106.8340),
    ("31", "Kota Jakarta Timur", -6.2250, 106.9004),
    ("32", "Kota Bandung", -6.9175, 107.6191),
    ("32", "Kabupaten Bogor", -6.4819, 106.8540),
    ("53", "Kota Kupang", -10.1772, 123.6070),
    ("53", "Kabupaten Sumba Timur", -9.6568, 120.2640),
    ("94", "Kota Jayapura", -2.5916, 140.6690),
    ("94", "Kabupaten Asmat", -5.5430, 138.1290),
    ("73", "Kota Makassar", -5.1477, 119.4327),
    ("73", "Kabupaten Jeneponto", -5.6820, 119.7450),
]

# nama, npsn, jenjang, kabupaten, rombel, alamat, lat, lon, mapel yang dilaporkan, kabupaten "domisili" guru
SEKOLAH = [
    ("SMAN 8 Jakarta", "20103201", "SMA", "Kota Jakarta Pusat", 24, "Jl. Taman Bukitduri No.2, Tebet", -6.2223, 106.8565,
     ["Matematika", "Bahasa Inggris", "Fisika", "Kimia"], "Kota Jakarta Pusat"),
    ("SMP Negeri 2 Jakarta", "20100205", "SMP", "Kota Jakarta Pusat", 18, "Jl. Sumenep No.40, Menteng", -6.1901, 106.8412,
     ["Matematika", "Bahasa Indonesia", "Informatika"], "Kota Jakarta Pusat"),
    ("SDN Menteng 01 Pagi", "20102110", "SD", "Kota Jakarta Pusat", 9, "Jl. Besuki No.4, Menteng", -6.1955, 106.8318,
     ["Matematika", "Bahasa Indonesia", "PJOK"], "Kota Jakarta Pusat"),
    ("SMK Negeri 26 Jakarta", "20103103", "SMK", "Kota Jakarta Timur", 24, "Jl. Balai Pustaka Baru No.1, Rawamangun", -6.1930, 106.8810,
     ["Informatika", "Produktif TKJ", "Akuntansi", "Bahasa Inggris"], "Kota Jakarta Timur"),
    ("SMP Negeri 109 Jakarta", "20101502", "SMP", "Kota Jakarta Timur", 18, "Jl. Gardu No.7, Duren Sawit", -6.2330, 106.9180,
     ["IPS", "Bahasa Indonesia", "Informatika"], "Kota Jakarta Timur"),
    ("SMAN 3 Bandung", "20219601", "SMA", "Kota Bandung", 21, "Jl. Belitung No.8, Sumur Bandung", -6.9122, 107.6157,
     ["Kimia", "Biologi", "Sejarah", "Matematika"], "Kota Bandung"),
    ("SMP Negeri 5 Bandung", "20219031", "SMP", "Kota Bandung", 15, "Jl. Sumatra No.40, Sumur Bandung", -6.9074, 107.6126,
     ["Matematika", "Bahasa Inggris", "Seni Budaya"], "Kota Bandung"),
    ("SDN 1 Cibaduyut", "20200442", "SD", "Kota Bandung", 9, "Jl. Cibaduyut Raya No.170, Bojongloa Kidul", -6.9532, 107.5893,
     ["Matematika", "Bahasa Indonesia"], "Kota Bandung"),
    ("SMK Negeri 1 Bogor", "20220401", "SMK", "Kabupaten Bogor", 24, "Jl. Heulang No.6, Tanah Sareal", -6.4756, 106.8513,
     ["Informatika", "Akuntansi", "Bahasa Inggris"], "Kabupaten Bogor"),
    ("SMP Negeri 1 Cibinong", "20220318", "SMP", "Kabupaten Bogor", 18, "Jl. KSR Dadi Kusmayadi No.2, Cibinong", -6.4803, 106.8441,
     ["IPA", "Bahasa Indonesia", "Matematika"], "Kabupaten Bogor"),
    ("SMAN 1 Kupang", "50302901", "SMA", "Kota Kupang", 18, "Jl. Cak Doko No.58, Oebobo", -10.1736, 123.6058,
     ["Matematika", "Biologi", "Bahasa Inggris"], "Kota Kupang"),
    ("SMP Negeri 4 Kupang", "50302612", "SMP", "Kota Kupang", 12, "Jl. Perintis Kemerdekaan, Oebufu", -10.1651, 123.6195,
     ["Matematika", "IPA", "Informatika"], "Kota Kupang"),
    ("SDN Naikoten 2", "50302188", "SD", "Kota Kupang", 6, "Jl. Yos Sudarso No.12, Naikoten", -10.1841, 123.5961,
     ["Matematika", "Bahasa Indonesia"], "Kota Kupang"),
    ("SMAN 1 Waingapu", "50303977", "SMA", "Kabupaten Sumba Timur", 15, "Jl. Ahmad Yani No.40, Waingapu", -9.6563, 120.2664,
     ["Matematika", "Fisika", "Bahasa Inggris"], "Kota Kupang"),
    ("SMP Negeri 1 Lewa", "50303455", "SMP", "Kabupaten Sumba Timur", 9, "Jl. Pendidikan, Lewa Paku", -9.7235, 120.1450,
     ["Matematika", "IPS", "Bahasa Indonesia"], "Kabupaten Sumba Timur"),
    ("SMAN 1 Jayapura", "94301201", "SMA", "Kota Jayapura", 18, "Jl. Sam Ratulangi No.17, Bayangkara", -2.5357, 140.7069,
     ["Matematika", "Kimia", "Bahasa Inggris"], "Kota Jayapura"),
    ("SMP Negeri 3 Jayapura", "94300712", "SMP", "Kota Jayapura", 12, "Jl. Trikora No.4, Hamadi", -2.5652, 140.6603,
     ["IPA", "Bahasa Indonesia", "Matematika"], "Kota Jayapura"),
    ("SDN Inpres 1 Agats", "94300402", "SD", "Kabupaten Asmat", 6, "Jl. Pelabuhan Agats, Asmat", -5.5407, 138.1341,
     ["Matematika", "Bahasa Indonesia", "IPA"], "Kabupaten Asmat"),
    ("SMP Negeri 1 Agats", "94300588", "SMP", "Kabupaten Asmat", 6, "Jl. Yos Sudarso Agats, Asmat", -5.5461, 138.1253,
     ["Matematika", "IPA"], "Kabupaten Asmat"),
    ("SMP Negeri 2 Jeneponto", "73301401", "SMP", "Kabupaten Jeneponto", 12, "Jl. Poros Jeneponto, Bontosunggu", -5.6803, 119.7417,
     ["Matematika", "Bahasa Indonesia", "IPS"], "Kota Makassar"),
    ("SMK Negeri 3 Makassar", "73302811", "SMK", "Kota Makassar", 21, "Jl. Gunung Mariam No.16, Maradekaya", -5.1455, 119.4247,
     ["Akuntansi", "Informatika", "Bahasa Inggris"], "Kota Makassar"),
    ("SMP Negeri 8 Makassar", "73300905", "SMP", "Kota Makassar", 15, "Jl. Baji Ateka No.7, Antang", -5.1632, 119.4801,
     ["Matematika", "Bahasa Indonesia", "PJOK"], "Kota Makassar"),
]

# ── Nama guru ──────────────────────────────────────────────────────────
# (nama depan, nama belakang) — nama Indonesia umum dari berbagai daerah.
NAMA = [
    # 220 nama guru Indonesia dari berbagai daerah. Jumlahnya sengaja di atas
    # kebutuhan (174 guru) supaya tidak ada nama yang berputar dan berulang.
    "Sulastri", "Ahmad Baedowi", "Siti Aminah", "Ratna Kumala", "Hendra Wijaya",
    "Nurlela", "Bayu Pratama", "Fitriani", "Gunawan", "Dwi Handayani",
    "Heri Setiawan", "Ika Puspita", "Lukman Hakim", "Maya Sari", "Nanda Pratama",
    "Asep Saepudin", "Euis Komariah", "Dadan Hamdani", "Neneng Hasanah", "Slamet Riyadi",
    "Oktaviani", "Wahyu Hidayat", "Yuni Astuti", "Zainal Abidin", "Ayu Wulandari",
    "Citra Ayu", "Dedi Kurniawan", "Eka Putri Ananda", "Yohanes Tefa", "Maria Goreti Bria",
    "Petrus Kanisius", "Yulius Kaka", "Yosefina Dami", "Fransiskus Xaverius Ati", "Nikolaus Ola",
    "Dorkas Wenda", "Yakobus Wanimbo", "Selviana Rumbiak", "Marthinus Wenda", "Apriani Yulianti",
    "Rina Marlina", "Andi Muhammad Ihsan", "Nurhaeda", "Baso Ali", "Rahmatia",
    "Muhammad Fadli", "Hasnah Yusuf", "Taufik Hidayat", "Umi Kalsum", "Vina Anggraini",
    "Sartika Dewi", "Ramli Siregar", "Grace Kila", "Bonifasius Ninu", "Hasanuddin",
    "Sitti Rahmawati", "Jonatan Rumbekwan", "Agustina Malo", "Ferdinandus Leki", "Sri Handayani",
    "Bambang Setiadi", "Lilis Suryani", "Muhammad Arifin", "Nurlaila", "Antonius Doko",
    "Theresia Kewa", "Yohanis Rumbiak", "Selpiana Tefa", "Ahmad Fauzi", "Dewi Kartika",
    "Erna Wati", "Firman Syah", "Gita Permata", "Hasan Basri", "Indah Purnama",
    "Joko Susilo", "Kartini", "Lalu Hamzanwadi", "Murni Sari", "Nasruddin",
    "Oktovina Bria", "Paulus Kaka", "Qori Amalia", "Rusli Tanjung", "Sitti Aminah",
    "Tuti Herawati", "Umar Faruk", "Veronika Wenda", "Wahid Hasyim", "Yanti Suryani",
    "Zulkifli", "Anita Rahmawati", "Benny Sinaga", "Cahyo Nugroho", "Dahlia",
    "Endang Supriatna", "Fajar Nugraha", "Gusti Ayu Ratih", "Heryanto", "Irma Susanti",
    "Jamaluddin", "Kholid Hidayat", "Lestari Ningsih", "Muhaimin", "Novita Sari",
    "Oman Suherman", "Panca Wijaya", "Qomarudin", "Rahmawati", "Suryadi",
    "Titik Handayani", "Usman Ali", "Vera Lestari", "Warsito", "Yulia Puspita",
    "Zaenal Arifin", "Arif Budiman", "Bella Kartika", "Candra Kurniawan", "Damayanti",
    "Eko Prasetyo", "Farida Hanum", "Gede Sukarta", "Hidayah Putri", "Iwan Setiawan",
    "Jumiati", "Kurnia Sari", "Luthfi Hakim", "Maesaroh", "Nanang Suryana",
    "Oktaviana Sari", "Purnomo Adi", "Ridwan Kamil", "Suhartini", "Tri Wulandari",
    "Umi Kulsum", "Vivi Yanti", "Wahyuningsih", "Yusuf Maulana", "Zainuddin",
    "Agus Salim", "Bunga Citra", "Cecep Nurdin", "Dian Permatasari", "Edy Sutrisno",
    "Faizah", "Gunadi", "Hartini", "Ida Farida", "Junaidi",
    "Kasmawati", "Lukman Nulhakim", "Maisaroh", "Nurhayati", "Oki Setiana",
    "Pipit Anggraini", "Rahmania", "Saiful Anwar", "Siti Halimah", "Teguh Santoso",
    "Ujang Solihin", "Vina Melati", "Wawan Kurnia", "Yusnani", "Zulfikar",
    "Aisyah Nur", "Bagus Prasetyo", "Cindy Lestari", "Darmawan", "Elly Rosana",
    "Fauzan Akbar", "Gina Sonia", "Hendri Saputra", "Ikbal Maulana", "Jelita Sari",
    "Kamaluddin", "Lisa Marlina", "Munawir", "Nadia Safitri", "Oscar Prabowo",
    "Putri Amelia", "Rahmat Hidayat", "Samsul Bahri", "Tari Wulandari", "Umar Said",
    "Valentina Dua", "Winda Astuti", "Yohana Mote", "Zubaidah", "Adi Nugroho",
    "Brilian Saputra", "Catur Wibowo", "Desi Ratnasari", "Ely Suciati", "Fikri Haikal",
    "Gadis Pramesti", "Hadi Susanto", "Ira Wulandari", "Joni Iskandar", "Kiki Amalia",
    "Laksana Putra", "Mega Sari", "Niko Pratama", "Ovianti", "Prima Yudha",
    "Rani Oktaviani", "Sandi Permana", "Tiara Anggraini", "Untung Prayitno", "Vino Bastian",
    "Wulan Sari", "Yoga Pratama", "Zahra Aulia", "Alfin Syah", "Bimo Saputro",
    "Cahaya Murni", "Dodi Prasetyo", "Erika Putri", "Fadli Ramadhan", "Gita Savitri",
]

GELAR = {
    "Matematika": "S.Pd", "Fisika": "S.Pd", "Kimia": "S.Pd", "Biologi": "S.Pd", "Sejarah": "S.Pd",
    "Bahasa Indonesia": "S.Pd", "Bahasa Inggris": "S.Pd", "IPS": "S.Pd", "IPA": "S.Pd", "PJOK": "S.Pd",
    "Seni Budaya": "S.Pd", "Informatika": "S.Kom", "Produktif TKJ": "S.Kom", "Akuntansi": "S.E",
}

# ── Hitung kebutuhan ───────────────────────────────────────────────────
def beban(rombel, mapel, jenjang):
    return rombel * JAM[jenjang][mapel]

def butuh_guru(rombel, mapel, jenjang):
    return max(1, math.floor(beban(rombel, mapel, jenjang) / AMBANG_JAM))

def jam_per_guru(rombel, mapel, jenjang, ada):
    return min(JAM_MAKSIMAL, math.ceil(beban(rombel, mapel, jenjang) / ada))

KAB_PROV = {nama: kode for kode, nama, _lat, _lon in KAB}

def penyesuaian(kabupaten, indeks):
    """Pola nasional: kota besar kelebihan guru, daerah 3T kekurangan guru."""
    provinsi = KAB_PROV[kabupaten]
    if provinsi in ("31", "32") and indeks < 2:
        return 1          # kelebihan guru -> jam ngajar di bawah 24 jam -> TPG rawan
    if provinsi in ("53", "94") and indeks < 2:
        return -1         # kekurangan guru -> sekolah menumpuk rombel
    if kabupaten == "Kota Makassar" and indeks < 2:
        return 1
    if kabupaten == "Kabupaten Jeneponto" and indeks < 3:
        return -1
    return 0

L = []
L.append("-- GuruMerata — data sintetis untuk keperluan demo.")
L.append("--")
L.append("-- Data ini BUKAN data resmi Dapodik, SIMPKB, atau InfoGTK. Nama guru dibangkitkan")
L.append("-- secara sintetis; nama sekolah, kabupaten, dan provinsi memakai nama nyata supaya")
L.append("-- polanya mudah dikenali. Angka kekurangan/kelebihan guru sengaja dibuat mengikuti")
L.append("-- temuan lapangan: kota besar cenderung kelebihan guru, daerah 3T kekurangan guru,")
L.append("-- sehingga jam tatap muka turun di bawah 24 jam dan TPG rawan berhenti.")
L.append("--")
L.append("-- 5 provinsi · 10 kabupaten · 22 sekolah · guru · kebutuhan per mapel · contoh mutasi")
L.append("--")
L.append("-- beban x      = rombel x jam tatap muka mapel per minggu")
L.append("-- jumlah_butuh = max(1, floor(x / 24))   -> 24 jam syarat TPG")
L.append("-- jam_ngajar   = min(40, ceil(x / jumlah_ada))")
L.append("begin;")
L.append("")

for kode, nama, lat, lon in PROV:
    L.append(f"insert into public.provinsi (id, kode, nama, latitude, longitude) values "
             f"({esc(uid('prov', kode))}, {esc(kode)}, {esc(nama)}, {lat}, {lon}) on conflict (kode) do nothing;")
L.append("")
for kode, nama, lat, lon in KAB:
    L.append(f"insert into public.kabupaten (id, provinsi_id, nama, latitude, longitude) values "
             f"({esc(uid('kab', nama))}, {esc(uid('prov', kode))}, {esc(nama)}, {lat}, {lon}) "
             f"on conflict (provinsi_id, nama) do nothing;")
L.append("")
for nama, npsn, jenjang, kab, rombel, alamat, lat, lon, mapel_list, _dom in SEKOLAH:
    L.append(f"insert into public.sekolah (id, kabupaten_id, nama, npsn, jenjang, jumlah_rombel, alamat, latitude, longitude) values "
             f"({esc(uid('sekolah', nama))}, {esc(uid('kab', kab))}, {esc(nama)}, {esc(npsn)}, {esc(jenjang)}, {rombel}, {esc(alamat)}, {lat}, {lon}) "
             f"on conflict (npsn) do nothing;")
L.append("")

L.append("-- Guru + kebutuhan per mapel")
SEKOLAH_BY_NAMA = {s[0]: s for s in SEKOLAH}
daftar_guru = []
nama_idx = 0
urutan = 0
total_guru = 0
total_butuh = 0
ringkasan = []
for nama_sekolah, npsn, jenjang, kab, rombel, alamat, lat, lon, mapel_list, domisili_utama in SEKOLAH:
    for i, mapel in enumerate(mapel_list):
        butuh = butuh_guru(rombel, mapel, jenjang)
        ada = max(0, butuh + penyesuaian(kab, i))
        if ada == 0:
            ada = 1
        jam = jam_per_guru(rombel, mapel, jenjang, ada)
        nama_guru = ""
        L.append(f"insert into public.kebutuhan_guru (id, sekolah_id, mapel, jumlah_butuh, jumlah_ada) values "
                 f"({esc(uid('kebutuhan', nama_sekolah, mapel))}, {esc(uid('sekolah', nama_sekolah))}, {esc(mapel)}, {butuh}, {ada}) "
                 f"on conflict (sekolah_id, mapel) do update set jumlah_butuh = excluded.jumlah_butuh, jumlah_ada = excluded.jumlah_ada;")
        for k in range(ada):
            if nama_idx >= len(NAMA):
                raise SystemExit(
                    f"Nama guru tidak cukup: butuh {nama_idx + 1} nama, tersedia {len(NAMA)}. "
                    "Tambahkan nama pada daftar NAMA."
                )
            nama_guru = f"{NAMA[nama_idx]}, {GELAR[mapel]}"
            nama_idx += 1
            urutan += 1
            if k % 3 == 0:
                status = "PNS"
            elif k % 3 == 1:
                status = "PPPK"
            else:
                status = "Honorer"
            sert = status != "Honorer" or (urutan % 4 != 0)
            domisili = domisili_utama if urutan % 5 else kab
            th = 1975 + (urutan * 7) % 18
            nip = f"{th}{(urutan*3)%12+1:02d}{(urutan*5)%28+1:02d}{2005+(urutan%15)}{1 if status=='PNS' else 2}{(urutan%3)+1:02d}{(urutan*11)%900+100:03d}"
            nuptk = f"{(urutan*13)%9000+1000}{(urutan*17)%9000+1000}{(urutan*19)%9000+1000}{(urutan*23)%9000+1000}"[:16]
            L.append(f"insert into public.guru (id, nama, nip, nuptk, status_kepegawaian, mapel, sertifikasi, sekolah_id, domisili, jam_ngajar) values "
                     f"({esc(uid('guru', nama_guru, nama_sekolah))}, {esc(nama_guru)}, {esc(nip)}, {esc(nuptk)}, {esc(status)}, {esc(mapel)}, "
                     f"{'true' if sert else 'false'}, {esc(uid('sekolah', nama_sekolah))}, {esc(domisili)}, {jam}) on conflict (id) do nothing;")
        total_guru += ada
        total_butuh += butuh
        ringkasan.append((nama_sekolah, mapel, butuh, ada, jam))
        daftar_guru.append((nama_guru, nama_sekolah, mapel, jam))

L.append("")
L.append("-- Contoh pengajuan mutasi (guru & sekolah nyata dari data di atas)")
for guru_idx, tujuan, alasan, catatan_guru, status, catatan_dinas in [
    (0, "SMAN 1 Waingapu", "keluarga",
     "Suami saya bertugas di Waingapu dan kami sudah tiga tahun berjauhan. Saya ingin mengajar penuh waktu di sana.",
     "diajukan", None),
    (3, "SMAN 1 Waingapu", "karir",
     "Ingin mengabdi di daerah 3T dan membangun lab komputer di Sumba Timur.",
     "disetujui", "Disetujui. Guru bersertifikasi dan jam tatap muka di sekolah tujuan tetap di atas 24 jam, sehingga TPG aman."),
    (7, "SMK Negeri 26 Jakarta", "keluarga",
     "Mengikuti istri yang dipindahkan ke Jakarta.",
     "ditolak", "Ditolak. Kuota mapel di sekolah tujuan sudah penuh sehingga jam tatap muka kurang dari 24 jam dan TPG berisiko hangus."),
    (11, "SMP Negeri 8 Makassar", "kesehatan",
     "Perlu akses layanan kesehatan rutin yang tidak tersedia di tempat saya bertugas.",
     "dibatalkan", None),
    (15, "SMAN 1 Jayapura", "karir",
     "Ingin mengajar di jenjang SMA dengan jam tatap muka lebih banyak.",
     "diajukan", None),
]:
    nama_guru, sekolah_asal, mapel, jam = daftar_guru[guru_idx]
    dinas = "null" if not catatan_dinas else esc(catatan_dinas)
    approved = "now()" if status == "disetujui" else "null"
    L.append(f"insert into public.mutasi (id, guru_id, sekolah_asal_id, sekolah_tujuan_id, mapel, alasan, catatan_guru, status, catatan_dinas, approved_at) values "
             f"({esc(uid('mutasi', nama_guru, sekolah_asal))}, {esc(uid('guru', nama_guru, sekolah_asal))}, "
             f"{esc(uid('sekolah', sekolah_asal))}, {esc(uid('sekolah', tujuan))}, {esc(mapel)}, {esc(alasan)}, "
             f"{esc(catatan_guru)}, {esc(status)}, {dinas}, {approved}) on conflict (id) do nothing;")

L.append("")
L.append("commit;")

out = os.path.normpath(os.path.join(DIR, "..", "supabase", "seed.sql"))
with open(out, "w") as f:
    f.write("\n".join(L) + "\n")
print(f"seed ditulis: {out} | {len(L)} baris | {total_guru} guru | {total_butuh} kebutuhan mapel")
print("ringkasan per sekolah:")
for nama_sekolah in SEKOLAH_BY_NAMA:
    baris = [r for r in ringkasan if r[0] == nama_sekolah]
    kurang = sum(max(b - a, 0) for _, _, b, a, _ in baris)
    lebih = sum(max(a - b, 0) for _, _, b, a, _ in baris)
    print(f"  {nama_sekolah:26s} kurang={kurang} lebih={lebih}")

