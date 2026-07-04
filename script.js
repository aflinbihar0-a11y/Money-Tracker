// Mengambil data dari LocalStorage saat pertama kali web dibuka
let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];

// 1. DAFTAR KATEGORI (Sudah ditambahkan Kategori rutin, Pulsa, Kos, dan Tambah Lainnya)
const daftarKategori = {
    pemasukan: ["Gaji Bulanan", "Side Hustle", "Bonus Lainnya", "Tambah Lainnya..."],
    pengeluaran: ["Makanan", "Minuman", "Transportasi", "Nongkrong Kafe", "Hiburan", "Tak Terduga", "Pengeluaran rutin", "Pulsa dan Kuota", "Kos/ Sewa Rumah", "Tambah Lainnya..."]
};

// Fungsi untuk mengubah isi dropdown kategori berdasarkan Jenis yang dipilih
function updateKategoriOptions() {
    const jenis = document.getElementById('jenis').value;
    const kategoriSelect = document.getElementById('kategori');
    const kategoriBaruInput = document.getElementById('kategori-baru-input');
    if (!kategoriSelect) return;

    kategoriSelect.innerHTML = '';
    daftarKategori[jenis].forEach(kat => {
        const option = document.createElement('option');
        option.value = kat;
        option.innerText = kat;
        kategoriSelect.appendChild(option);
    });

    // Reset dan sembunyikan input kustom setiap kali jenis transaksi berganti
    if (kategoriBaruInput) {
        kategoriBaruInput.style.display = "none";
        kategoriBaruInput.value = "";
    }
}

// FUNGSI BARU: Mendeteksi apakah user memilih opsi 'Tambah Lainnya...'
function cekKategoriLainnya() {
    const kategoriSelect = document.getElementById('kategori');
    const kategoriBaruInput = document.getElementById('kategori-baru-input');
    
    if (kategoriSelect && kategoriSelect.value === "Tambah Lainnya...") {
        kategoriBaruInput.style.display = "block";
        kategoriBaruInput.focus();
    } else if (kategoriBaruInput) {
        kategoriBaruInput.style.display = "none";
        kategoriBaruInput.value = "";
    }
}

// Membuat pilihan filter Periode (Bulan + Tahun) secara otomatis dari data input
function generateFilterOptions() {
    const filterBulanSelect = document.getElementById('filter-bulan');
    if (!filterBulanSelect) return;

    const nilaiSaatIni = filterBulanSelect.value; 
    filterBulanSelect.innerHTML = '<option value="all">Semua Periode</option>';
    
    let daftarPeriode = [];
    transaksi.forEach(item => {
        if (item.tanggal) {
            const tahunBulan = item.tanggal.substring(0, 7); 
            if (!daftarPeriode.includes(tahunBulan)) {
                daftarPeriode.push(tahunBulan);
            }
        }
    });

    daftarPeriode.sort().reverse();

    daftarPeriode.forEach(periode => {
        const option = document.createElement('option');
        option.value = periode;
        const opsiTanggal = { year: 'numeric', month: 'long' };
        option.innerText = new Date(periode + "-02").toLocaleDateString('id-ID', opsiTanggal); 
        filterBulanSelect.appendChild(option);
    });

    if (nilaiSaatIni && filterBulanSelect.querySelector(`option[value="${nilaiSaatIni}"]`)) {
        filterBulanSelect.value = nilaiSaatIni;
    } else if (daftarPeriode.length > 0 && !nilaiSaatIni) {
        filterBulanSelect.value = daftarPeriode[0]; 
    }
}

function updateUI() {
    const daftar = document.getElementById('daftar-transaksi');
    const totalSaldoEl = document.getElementById('total-saldo');
    const totalPemasukanEl = document.getElementById('total-pemasukan');
    const totalPengeluaranEl = document.getElementById('total-pengeluaran');
    const filterBulanSelect = document.getElementById('filter-bulan');
    
    if (!daftar) return;

    const periodeTerpilih = filterBulanSelect ? filterBulanSelect.value : 'all';
    daftar.innerHTML = '';
    let totalSaldo = 0;
    let totalPemasukan = 0;   
    let totalPengeluaran = 0;  

    transaksi.forEach((item, index) => {
        const periodeTransaksi = item.tanggal ? item.tanggal.substring(0, 7) : ''; 

        if (periodeTerpilih === 'all' || periodeTransaksi === periodeTerpilih) {
            const li = document.createElement('li');
            li.classList.add(item.jenis);
            
            if (item.jenis === 'pemasukan') {
                totalSaldo += item.nominal;
                totalPemasukan += item.nominal;
            } else {
                totalSaldo -= item.nominal;
                totalPengeluaran += item.nominal;
            }

            const opsiTanggal = { year: 'numeric', month: 'short', day: 'numeric' };
            const formatTanggal = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', opsiTanggal) : '-';

            li.innerHTML = `
                <div>
                    <small style="color: #888; display: block;">${formatTanggal} • <span style="font-weight: 600; color: #11998e;">[${item.kategori || 'Tanpa Kategori'}]</span></small>
                    <strong>${item.deskripsi}</strong> (Rp ${item.nominal.toLocaleString('id-ID')})
                </div>
                <button class="hapus-btn" onclick="hapusTransaksi(${index})">X</button>
            `;
            daftar.appendChild(li);
        }
    });

    if (totalSaldoEl) totalSaldoEl.innerText = `Rp ${totalSaldo.toLocaleString('id-ID')}`;
    if (totalPemasukanEl) totalPemasukanEl.innerText = `Rp ${totalPemasukan.toLocaleString('id-ID')}`;
    if (totalPengeluaranEl) totalPengeluaranEl.innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    
    localStorage.setItem('transaksi', JSON.stringify(transaksi));
}

function tambahTransaksi() {
    const deskripsi = document.getElementById('deskripsi').value;
    const nominal = parseInt(document.getElementById('nominal').value);
    const tanggal = document.getElementById('tanggal').value;
    const jenis = document.getElementById('jenis').value;
    let kategori = document.getElementById('kategori').value;
    const kategoriBaruInput = document.getElementById('kategori-baru-input');

    // Jika memilih 'Tambah Lainnya...', ambil isi teks kustom buatan user
    if (kategori === "Tambah Lainnya...") {
        const kategoriKustom = kategoriBaruInput ? kategoriBaruInput.value.trim() : "";
        if (kategoriKustom === "") {
            alert('Mohon ketik nama kategori baru Anda!');
            return;
        }
        kategori = kategoriKustom;

        // Masukkan kategori buatan user ke daftar sementara agar bisa dipilih lagi selama halaman belum di-refresh
        if (!daftarKategori[jenis].includes(kategori)) {
            daftarKategori[jenis].splice(daftarKategori[jenis].length - 1, 0, kategori);
        }
    }

    if (deskripsi.trim() === '' || isNaN(nominal) || tanggal === '' || kategori === '') {
        alert('Mohon isi semua data dengan benar!');
        return;
    }

    transaksi.push({ deskripsi, nominal, tanggal, jenis, kategori });
    document.getElementById('deskripsi').value = '';
    document.getElementById('nominal').value = '';
    document.getElementById('tanggal').value = '';

    updateKategoriOptions(); // Reset pilihan dropdown ke semula
    generateFilterOptions();
    updateUI();
}

// LOGIKA UNTUK MENGEKSPOR DATA KE FORMAT EXCEL (.XLSX)
function downloadExcel() {
    const periodeTerpilih = document.getElementById('filter-bulan').value;
    
    const dataTerfilter = transaksi.filter(item => {
        const periodeTransaksi = item.tanggal ? item.tanggal.substring(0, 7) : '';
        return periodeTerpilih === 'all' || periodeTransaksi === periodeTerpilih;
    });

    if (dataTerfilter.length === 0) {
        alert("Tidak ada data transaksi pada periode ini untuk diunduh!");
        return;
    }

    const dataExcel = dataTerfilter.map(item => ({
        "Tanggal": item.tanggal,
        "Deskripsi Transaksi": item.deskripsi,
        "Jenis": item.jenis === "pemasukan" ? "Pemasukan (+)" : "Pengeluaran (-)",
        "Kategori": item.kategori,
        "Nominal (Rp)": item.nominal
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");

    let namaFile = `Rekapan_Keuangan_Semua_Periode.xlsx`;
    if (periodeTerpilih !== 'all') {
        namaFile = `Rekapan_Keuangan_${periodeTerpilih}.xlsx`;
    }

    XLSX.writeFile(workbook, namaFile);
}

function hapusTransaksi(index) {
    transaksi.splice(index, 1);
    generateFilterOptions(); 
    updateUI();
}

// Daftarkan fungsi ke objek window global agar tidak hilang/error saat dipanggil dari HTML HTML
window.updateKategoriOptions = updateKategoriOptions;
window.cekKategoriLainnya = cekKategoriLainnya;
window.tambahTransaksi = tambahTransaksi;
window.hapusTransaksi = hapusTransaksi;
window.downloadExcel = downloadExcel;
window.updateUI = updateUI;

document.addEventListener("DOMContentLoaded", () => {
    updateKategoriOptions();
    generateFilterOptions();
    updateUI();
    
    // Sambungkan fungsi pengecekan ke elemen HTML secara dinamis untuk backup
    const kategoriSelect = document.getElementById('kategori');
    if (kategoriSelect) {
        kategoriSelect.addEventListener('change', cekKategoriLainnya);
    }
});
