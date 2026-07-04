// ISI DENGAN MODUL FIREBASE SDK RESMI
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// Tambahan modul untuk Cloud Firestore Database
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ✅ CONFIGURASI FIREBASE ASLI MILIK AFLIN
const firebaseConfig = {
    apiKey: "AIzaSyC0UiNRwTFjw7vLgmuKnuo8x4JnISGneLE",
    authDomain: "money-tracker-6af12.firebaseapp.com",
    projectId: "money-tracker-6af12",
    storageBucket: "money-tracker-6af12.firebasestorage.app",
    messagingSenderId: "415269324665",
    appId: "1:415269324665:web:737dca248e33d4eef911a8",
    measurementId: "G-RW6C5H828V"
};

// Inisialisasi Firebase, Auth, & Firestore Database
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Hubungkan ke Cloud Database
const provider = new GoogleAuthProvider();

// Tampungan data transaksi aktif
let transaksi = [];
let chartKategori = null;
let userSekarang = null;

// Daftar Kategori Standar
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

// Memantau Status Login User
onAuthStateChanged(auth, async (user) => {
    const statusUser = document.getElementById('status-user');
    const authBtn = document.getElementById('auth-btn');

    if (user) {
        userSekarang = user;
        statusUser.innerText = `👋 Halo, ${user.displayName}`;
        authBtn.innerText = "Keluar";
        authBtn.style.background = "#e74c3c";

        // Ambil data transaksi dari Cloud Firestore khusus untuk UID user ini
        await ambilDataDariCloud();
    } else {
        userSekarang = null;
        statusUser.innerText = "🔒 Belum Masuk (Akses Terkunci)";
        authBtn.innerText = "Masuk dengan Google";
        authBtn.style.background = "#3498db";
        transaksi = []; 
        updateUI(); // Kosongkan layar
    }
    
    updateKategoriOptions();
    generateFilterOptions();
});

// Logika Fungsi Tombol Login/Logout Klik
document.getElementById('auth-btn').addEventListener('click', () => {
    if (userSekarang) {
        signOut(auth).catch((error) => alert("Gagal keluar: " + error.message));
    } else {
        signInWithPopup(auth, provider).catch((error) => alert("Gagal login: " + error.message));
    }
});

// Fungsi untuk Mengambil Data dari Cloud Firestore
async function ambilDataDariCloud() {
    if (!userSekarang) return;
    try {
        transaksi = [];
        // Ambil data dari koleksi "transaksi" berdasarkan UID pengguna
        const q = query(
            collection(db, "transaksi"), 
            where("userId", "==", userSekarang.uid)
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((documentSnapshot) => {
            const data = documentSnapshot.data();
            // Simpan id dokumen firestore agar nanti bisa dihapus
            transaksi.push({
                id: documentSnapshot.id,
                ...data
            });
        });
        
        // Urutkan manual berdasarkan tanggal di sisi client
        transaksi.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

        updateUI();
    } catch (error) {
        console.error("Gagal mengambil data cloud: ", error);
    }
}

function updateKategoriOptions() {
    const jenisEl = document.getElementById('jenis');
    const kategoriSelect = document.getElementById('kategori');
    const kategoriBaruInput = document.getElementById('kategori-baru-input');
    
    if (!jenisEl || !kategoriSelect) return;
    
    const jenis = jenisEl.value;
    kategoriSelect.innerHTML = '';
    
    if (daftarKategori[jenis]) {
        daftarKategori[jenis].forEach(kat => {
            const option = document.createElement('option');
            option.value = kat;
            option.innerText = kat;
            kategoriSelect.appendChild(option);
        });
    }

    if (kategoriBaruInput) {
        kategoriBaruInput.style.display = "none";
        kategoriBaruInput.value = "";
    }
}

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

function updateGrafik() {
    const filterBulanSelect = document.getElementById('filter-bulan');
    const periodeTerpilih = filterBulanSelect ? filterBulanSelect.value : 'all';

    const dataTerfilter = transaksi.filter(item => {
        const periodeTransaksi = item.tanggal ? item.tanggal.substring(0, 7) : '';
        return item.jenis === 'pengeluaran' && (periodeTerpilih === 'all' || periodeTransaksi === periodeTerpilih);
    });

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

    if (chartKategori) {
        chartKategori.destroy();
    }

    if (data.length === 0) {
        if (boxGrafik) boxGrafik.style.display = 'none';
        return;
    } else {
        if (boxGrafik) boxGrafik.style.display = 'block';
    }

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

    transaksi.forEach((item) => {
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
                <button class="hapus-btn" onclick="hapusTransaksiCloud('${item.id}')">X</button>
            `;
            daftar.appendChild(li);
        }
    });

    if (totalSaldoEl) totalSaldoEl.innerText = `Rp ${totalSaldo.toLocaleString('id-ID')}`;
    if (totalPemasukanEl) totalPemasukanEl.innerText = `Rp ${totalPemasukan.toLocaleString('id-ID')}`;
    if (totalPengeluaranEl) totalPengeluaranEl.innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;

    updateGrafik();
}

// Fungsi Simpan Transaksi Langsung ke Internet (Cloud)
async function tambahTransaksi() {
    if (!userSekarang) {
        alert("Akses Terkunci! Silakan klik 'Masuk dengan Google' terlebih dahulu.");
        return;
    }

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

    // ✅ PERBAIKAN: Spasi pada nama variabel di bawah ini sudah dihapus
    const dataTransaksiBaru = {
        userId: userSekarang.uid, 
        deskripsi,
        nominal,
        tanggal,
        jenis,
        kategori
    };

    try {
        // Kirim dan simpan ke Cloud Firestore
        await addDoc(collection(db, "transaksi"), dataTransaksiBaru);
        
        // Reset form input
        document.getElementById('deskripsi').value = '';
        document.getElementById('nominal').value = '';
        document.getElementById('tanggal').value = '';

        // Ambil data terbaru dari cloud agar UI sinkron
        await ambilDataDariCloud();
        generateFilterOptions();
    } catch (error) {
        alert("Gagal menyimpan ke database cloud: " + error.message);
    }
}

// Fungsi Hapus Transaksi Langsung dari Internet (Cloud)
async function hapusTransaksiCloud(docId) {
    if (!docId || docId === 'undefined') return;
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini dari database cloud?")) {
        try {
            await deleteDoc(doc(db, "transaksi", docId));
            // Refresh data setelah sukses dihapus
            await ambilDataDariCloud();
            generateFilterOptions();
        } catch (error) {
            alert("Gagal menghapus data dari cloud: " + error.message);
        }
    }
}

function downloadExcel() {
    if (!userSekarang) {
        alert("Silakan login terlebih dahulu untuk mengunduh laporan.");
        return;
    }

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

// Ikat fungsi ke ranah global window agar tetap bekerja pada tipe module
window.updateKategoriOptions = updateKategoriOptions;
window.cekKategoriLainnya = cekKategoriLainnya;
window.tambahTransaksi = tambahTransaksi;
window.hapusTransaksiCloud = hapusTransaksiCloud;
window.downloadExcel = downloadExcel;
window.updateUI = updateUI;
window.updateGrafik = updateGrafik;

// Pasang Event listener cadangan saat form dimuat pertama kali
document.addEventListener("DOMContentLoaded", () => {
    const jenisEl = document.getElementById('jenis');
    const kategoriSelect = document.getElementById('kategori');
    
    if(jenisEl) jenisEl.addEventListener('change', updateKategoriOptions);
    if(kategoriSelect) kategoriSelect.addEventListener('change', cekKategoriLainnya);
});
