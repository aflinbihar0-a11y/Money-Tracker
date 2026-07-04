// Mengambil data dari LocalStorage saat pertama kali web dibuka
let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];
let chartKategori = null; // Variabel global untuk menampung status grafik Chart.js

// 1. DAFTAR KATEGORI
const daftarKategori = {
    pemasukan: ["Gaji Bulanan", "Side Hustle", "Bonus Lainnya", "Tambah Lainnya..."],
    pengeluaran: [
        "Makan",
        "Minum",
        "Transportasi",
        "Nongkrong",
        "Hiburan",
        "Pengeluaran rutin",
        "Pulsa dan Kuota",
        "Kos/ Sewa Tempat tinggal",
        "Tambah Lainnya..."
    ]
};

// Fungsi untuk mengubah isi dropdown kategori berdasarkan Jenis yang dipilih
function updateKategoriOptions() {
    const jenisEl = document.getElementById('jenis');
    const kategoriSelect = document.getElementById('kategori');
    const kategoriBaruInput = document.getElementById('kategori-baru-input');
    
    if (!jenisEl || !kategoriSelect) return;
    
    const jenis = jenisEl.value;
    kategoriSelect.innerHTML = '';
    
    // Isi dropdown dari array daftarKategori
    if (daftarKategori[jenis]) {
        daftarKategori[jenis].forEach(kat => {
            const option = document.createElement('option');
            option.value = kat;
            option.innerText = kat;
            kategoriSelect.appendChild(option);
        });
    }

    // Sembunyikan input kustom setiap kali ganti jenis transaksi
    if (kategoriBaruInput) {
        kategoriBaruInput.style.display = "none";
        kategoriBaruInput.value = "";
    }
}

// Mendeteksi apakah user memilih opsi 'Tambah Lainnya...'
function cekKategoriLainnya() {
    const kategoriSelect = document.getElementById('kategori');
    const kategoriBaruInput = document.getElementById('kategori-baru-input');
    
    if (kategoriSelect && kategoriSelect.value === "Tambah Lainnya...") {
        if (kategoriBaruInput) {
            kategoriBaruInput.style.display = "block";
            kategoriBaruInput.focus();
        }
    } else if (kategoriBaruInput) {
        kategoriBaruInput.style.display = "none";
        kategoriBaruInput.value = "";
    }
}

// Membuat pilihan filter Periode secara otomatis
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

// FUNGSI BARU: Mengolah data dan menggambar grafik presentasi presentase pengeluaran
function updateGrafik() {
    const filterBulanSelect = document.getElementById('filter-bulan');
    const periodeTerpilih = filterBulanSelect ? filterBulanSelect.value : 'all';

    // 1. Filter transaksi hanya jenis PENGELUARAN pada periode yang dipilih
    const dataTerfilter = transaksi.filter(item => {
        const periodeTransaksi = item.tanggal ? item.tanggal.substring(0, 7) : '';
        return item.jenis === 'pengeluaran' && (periodeTerpilih === 'all' || periodeTransaksi === periodeTerpilih);
    });

    // 2. Hitung akumulasi nominal berdasarkan kategori masing-masing
    const totalPerKategori = {};
    dataTerfilter.forEach(item => {
        const kat = item.kategori || "Tak Terduga";
        totalPerKategori[kat] = (totalPerKategori[kat] || 0) + item.nominal;
    });

    const labels = Object.keys(totalPerKategori);
    const data = Object.values(totalPerKategori);

    const ctx = document.getElementById('grafikKategori');
    const boxGrafik = document.getElementById('box-grafik-container');
    if (!ctx) return;

    // 3. Reset canvas grafik lama agar tidak tumpang tindih saat di-hover
    if (chartKategori) {
        chartKategori.destroy();
    }

    // Sembunyikan container jika tidak ada data pengeluaran agar tampilan bersih
    if (data.length === 0) {
        if (boxGrafik) boxGrafik.style.display = 'none';
        return;
    } else {
        if (boxGrafik) boxGrafik.style.display = 'block';
    }

    // 4. Inisialisasi visualisasi Pie Chart dengan Chart.js
    chartKategori = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#e74c3c', '#3498db', '#f1c40f', '#2ecc71', 
                    '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#7f8c8d'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let value = context.raw || 0;
                            return ` ${context.label}: Rp ${value.toLocaleString('id-ID')}`;
                        }
                    }
                }
            }
        }
    });
}

// Menggambar Ulang Tampilan Tabel, Saldo, dan menyegarkan Grafik
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

    // Jalankan pembaruan data visual presentasi keuangan
    updateGrafik();
}

// Menambah Transaksi Baru
function tambahTransaksi() {
    const deskripsi = document.getElementById('deskripsi').value;
    const nominal = parseInt(document.getElementById('nominal').value);
    const tanggal = document.getElementById('tanggal').value;
    const jenis = document.getElementById('jenis').value;
    let kategori = document.getElementById('kategori').value;
    const kategoriBaruInput = document.getElementById('kategori-baru-input');

    if (kategori === "Tambah Lainnya...") {
        const kategoriKustom = kategoriBaruInput ? kategoriBaruInput.value.trim() : "";
        if (kategoriKustom === "") {
            alert('Mohon ketik nama kategori baru Anda!');
            return;
        }
        kategori = kategoriKustom;

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

    updateKategoriOptions(); 
    generateFilterOptions();
    updateUI();
}

// Ekspor ke file Excel
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

// Registrasi modul fungsi ke ranah global window
window.updateKategoriOptions = updateKategoriOptions;
window.cekKategoriLainnya = cekKategoriLainnya;
window.tambahTransaksi = tambahTransaksi;
window.hapusTransaksi = hapusTransaksi;
window.downloadExcel = downloadExcel;
window.updateUI = updateUI;
window.updateGrafik = updateGrafik;

// Dijalankan otomatis saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
    updateKategoriOptions();
    generateFilterOptions();
    updateUI();
});
