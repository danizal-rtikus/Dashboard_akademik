// URL API Google Apps Script Anda.
// PASTIKAN URL INI BENAR DAN SUDAH DI-DEPLOY DENGAN AKSES PUBLIK.
const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbx08B1SNgVpBV39kprGbAnL3VWQ1BN3iUIUSkBe5sAJkfiHVMAHdJhLgwhjSpt_-qLXLw/exec';

let originalData = []; // Variabel global untuk menyimpan data asli dari API
let currentPage = 1;
const rowsPerPage = 10; // Jumlah baris per halaman untuk tabel detail, disesuaikan untuk "Recent"
const fullTableRowsPerPage = 15; // Jumlah baris per halaman untuk tabel penuh

/**
 * Menampilkan halaman yang dipilih dan menyembunyikan halaman lainnya.
 * Juga mengelola status aktif pada sidebar.
 * @param {string} pageId - ID dari elemen halaman yang akan ditampilkan.
 */
function showPage(pageId) {
  const pages = document.querySelectorAll('.page-section');
  pages.forEach(page => page.style.display = 'none');
  document.getElementById(pageId).style.display = 'block';

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  document.getElementById('menu' + pageId.replace('Page', '')).classList.add('active');

  // Reset current page to 1 when changing pages
  currentPage = 1;
  updateDashboard(); // Re-render dashboard to apply current page and filters
}

// Event Klik Sidebar
document.getElementById('menuDashboard').addEventListener('click', function() {
  showPage('dashboardPage');
});
document.getElementById('menuDataMahasiswa').addEventListener('click', function() {
  showPage('dataMahasiswaPage');
});
document.getElementById('menuAnalytics').addEventListener('click', function() {
  showPage('analyticsPage');
});
document.getElementById('menuReport').addEventListener('click', function() {
  showPage('reportPage');
});
document.getElementById('showAllMahasiswa').addEventListener('click', function(e) {
  e.preventDefault(); // Prevent default link behavior
  showPage('dataMahasiswaPage');
});

// Display current date in header
function displayCurrentDate() {
  const now = new Date();
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  document.getElementById('currentDate').innerText = now.toLocaleDateString('en-GB', options).replace(/\//g, '/'); // mm/dd/yyyy
}


/**
 * Mengambil data dari Google Apps Script Web App URL.
 * Menangani potensi error dari operasi fetch atau respons Apps Script.
 */
async function loadDataFromAppsScript() {
    try {
        const response = await fetch(appsScriptUrl);
        const result = await response.json(); // Data yang dikembalikan adalah JSON

        if (result.error) {
            console.error('Error from Apps Script:', result.error);
            // Tampilkan pesan error di dashboard jika ada masalah
            document.getElementById("recentMahasiswaTable").innerHTML = `<p style='text-align:center; color:red;'>Gagal memuat data: ${result.error}</p>`;
            document.getElementById("detailTable").innerHTML = `<p style='text-align:center; color:red;'>Gagal memuat data: ${result.error}</p>`;
            return;
        }

        if (result.data) {
            originalData = result.data; // Simpan data yang diambil ke originalData
            populateAngkatanFilter(originalData); // Isi filter angkatan
            populateProdiFilter(originalData); // Isi filter prodi
            updateDashboard(); // Perbarui seluruh dashboard dengan data yang baru dimuat
        } else {
            console.warn('No data received from Apps Script.');
            document.getElementById("recentMahasiswaTable").innerHTML = `<p style='text-align:center; color:gray;'>Tidak ada data yang ditemukan.</p>`;
            document.getElementById("detailTable").innerHTML = `<p style='text-align:center; color:gray;'>Tidak ada data yang ditemukan.</p>`;
        }

    } catch (error) {
        console.error('Error fetching data from Apps Script:', error);
        document.getElementById("recentMahasiswaTable").innerHTML = `<p style='text-align:center; color:red;'>Gagal memuat data. Pastikan URL Apps Script benar dan dapat diakses.</p>`;
        document.getElementById("detailTable").innerHTML = `<p style='text-align:center; color:red;'>Gagal memuat data. Pastikan URL Apps Script benar dan dapat diakses.</p>`;
    }
}

/**
 * Mengisi dropdown filter Program Studi.
 * @param {Array<Object>} data - Data mahasiswa.
 */
function populateProdiFilter(data) {
  const prodiSet = new Set(data.map(d => d["Program Studi"]));
  const dropdown = document.getElementById("prodiFilter");
  dropdown.innerHTML = '<option value="all">Semua Program Studi</option>';
  Array.from(prodiSet).sort().forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    dropdown.appendChild(option);
  });
}

/**
 * Mengisi dropdown filter Angkatan.
 * @param {Array<Object>} data - Data mahasiswa.
 */
function populateAngkatanFilter(data) {
  const angkatanSet = new Set(data.map(d => d.Angkatan));
  const dropdown = document.getElementById("angkatanFilter");
  dropdown.innerHTML = '<option value="all">Semua Angkatan</option>';
  Array.from(angkatanSet).sort().forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    dropdown.appendChild(option);
  });
}

/**
 * Memperbarui statistik overview di dashboard dan circular progress.
 * @param {Array<Object>} data - Data mahasiswa yang sudah difilter.
 */
function updateStats(data) {
  const total = data.length;
  const aktif = data.filter(d => d.Status === "Aktif").length;
  const cuti = data.filter(d => d.Status === "Cuti").length;
  // Anda bisa tambahkan status lain jika ada, misalnya nonAktif, Lulus, Dikeluarkan, dst.
  // const nonAktif = data.filter(d => d.Status === "Non-Aktif").length;

  // Hitung persentase sesungguhnya
  const totalMahasiswaPercent = 100; // Total mahasiswa selalu 100%
  const aktifPercent = total > 0 ? (aktif / total * 100).toFixed(1) : 0; // Hitung persentase aktif
  const cutiPercent = total > 0 ? (cuti / total * 100).toFixed(1) : 0;   // Hitung persentase cuti

  document.getElementById("totalMahasiswa").innerText = total;
  document.getElementById("jumlahAktif").innerText = aktif;
  document.getElementById("jumlahCuti").innerText = cuti;

  // Update circular progress bars
  updateCircularProgress('totalMahasiswaProgress', totalMahasiswaPercent);
  updateCircularProgress('jumlahAktifProgress', aktifPercent);
  updateCircularProgress('jumlahCutiProgress', cutiPercent);

  // Update change percentages (sekarang menggunakan persentase yang dihitung)
  // Anda bisa menyesuaikan ini jika Anda ingin menampilkan tren perubahan,
  // bukan hanya persentase dari total saat ini.
  // Untuk saat ini, kita akan menampilkan persentase yang dihitung untuk match tampilan.
  document.getElementById("totalMahasiswaChange").innerText = `${totalMahasiswaPercent}%`;
  document.getElementById("jumlahAktifChange").innerText = `${aktifPercent}%`;
  document.getElementById("jumlahCutiChange").innerText = `${cutiPercent}%`;

  // The original dashboard had these, keeping them for completeness but they are not in the new design's overview cards
  // document.getElementById("totalProgramStudi").innerText = new Set(data.map(d => d['Program Studi'])).size;
  // document.getElementById("jumlahAngkatan").innerText = new Set(data.map(d => d.Angkatan)).size;
  // document.getElementById("persentaseAktif").innerText = persen + '%';
  // document.querySelector('.progress-container').title = `${aktif} Mahasiswa Aktif dari ${total}`;
  // document.getElementById("progressAktif").style.width = persen + '%';
  // const prodiCounts = countOccurrences(data, "Program Studi");
  // const sortedProdi = Object.entries(prodiCounts).sort((a, b) => b[1] - a[1]);
  // const top3Prodi = sortedProdi.slice(0, 3).map((item, index) => `${index + 1}. ${item[0]} (${item[1]})`).join('<br>');
  // document.getElementById("topProgramStudi").innerHTML = top3Prodi || "-";
}

/**
 * Updates a CSS-based circular progress bar.
 * @param {string} elementId - The ID of the inner text element.
 * @param {number} percentage - The percentage value (0-100).
 */
function updateCircularProgress(elementId, percentage) {
  const innerTextElement = document.getElementById(elementId);
  const progressBarContainer = innerTextElement.closest('.circular-progress');
  if (!progressBarContainer) return;

  const gradientElement = progressBarContainer.querySelector('.circular-progress-gradient');
  if (gradientElement) {
    gradientElement.style.setProperty('--progress', `${percentage}%`);
  }
  innerTextElement.innerText = `${percentage}%`;
}


/**
 * Memperbarui tabel detail mahasiswa.
 * @param {Array<Object>} data - Data mahasiswa yang sudah difilter.
 * @param {string} targetElementId - ID elemen div untuk menempatkan tabel.
 * @param {number} limit - Jumlah baris yang akan ditampilkan (untuk recent orders).
 * @param {boolean} showPagination - Apakah akan menampilkan tombol paginasi.
 */
function updateTable(data, targetElementId, limit = null, showPagination = true) {
  const tableContainer = document.getElementById(targetElementId);
  if (!tableContainer) return;

  if (data.length === 0) {
    tableContainer.innerHTML = "<p style='text-align:center;'>Tidak ada data ditemukan.</p>";
    return;
  }

  let dataToRender = data;
  let currentRowsPerPage = rowsPerPage; // Default for recent
  if (targetElementId === 'detailTable') {
    currentRowsPerPage = fullTableRowsPerPage; // Use fullTableRowsPerPage for the main table
  }

  const totalPages = Math.ceil(data.length / currentRowsPerPage);
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
  if (currentPage < 1 && totalPages > 0) currentPage = 1;

  const start = (currentPage - 1) * currentRowsPerPage;
  if (limit) {
    dataToRender = data.slice(start, start + limit);
  } else {
    dataToRender = data.slice(start, start + currentRowsPerPage);
  }


  let tableHTML = `<table><thead><tr><th>No</th><th>NIM</th><th>Nama</th><th>Program Studi</th><th>Status</th><th>Angkatan</th><th>Agama</th><th>Provinsi</th><th>Jenjang</th></tr></thead><tbody>`;

  dataToRender.forEach((d, i) => {
    const statusClass = d.Status === "Aktif" ? "Aktif" : (d.Status === "Cuti" ? "Cuti" : "");
    tableHTML += `<tr>
      <td>${start + i + 1}</td>
      <td>${d.NIM}</td>
      <td class="nama">${d.Nama}</td>
      <td class="program-studi">${d["Program Studi"]}</td>
      <td><span class="status-badge ${statusClass}">${d.Status}</span></td>
      <td>${d.Angkatan}</td>
      <td>${d.Agama}</td>
      <td>${d.Provinsi}</td>
      <td>${d.Jenjang}</td>
    </tr>`;
  });

  tableHTML += `</tbody></table>`;

  if (showPagination) {
    tableHTML += `<div style="text-align:center; margin-top:15px;">
      <button onclick="prevPage()" class="pagination-button" ${currentPage === 1 ? 'disabled' : ''}>❮</button>
      <span style="margin: 0 10px;">Page ${currentPage} of ${totalPages}</span>
      <button onclick="nextPage()" class="pagination-button" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>❯</button>
    </div>`;
  }

  tableContainer.innerHTML = tableHTML;
}

/**
 * Memperbarui tabel "Recent Mahasiswa" di dashboard.
 * Menampilkan hanya beberapa baris pertama.
 * @param {Array<Object>} data - Data mahasiswa yang sudah difilter.
 */
function updateRecentMahasiswaTable(data) {
  // Show only the first 5 entries for "Recent Mahasiswa"
  updateTable(data, 'recentMahasiswaTable', 5, false); // No pagination for recent table
}

/**
 * Menghasilkan tabel statistik berdasarkan Program Studi.
 * Tabel berisi Jumlah Student Body, Aktif, dan Cuti, diurutkan berdasarkan Student Body terbanyak.
 * @param {Array<Object>} data - Data mahasiswa.
 * @param {string} targetElementId - ID elemen div untuk menempatkan tabel.
 */
function generateProdiStatsTable(data, targetElementId) {
  const tableContainer = document.getElementById(targetElementId);
  if (!tableContainer) return;

  // Menghitung statistik per Program Studi
  const prodiStats = {};
  data.forEach(d => {
    const prodi = d["Program Studi"] || "Tidak Diketahui";
    if (!prodiStats[prodi]) {
      prodiStats[prodi] = {
        total: 0,
        aktif: 0,
        cuti: 0
      };
    }
    prodiStats[prodi].total++;
    if (d.Status === "Aktif") {
      prodiStats[prodi].aktif++;
    } else if (d.Status === "Cuti") {
      prodiStats[prodi].cuti++;
    }
  });

  // Mengubah objek prodiStats menjadi array untuk pengurutan
  let prodiStatsArray = Object.entries(prodiStats).map(([prodiName, stats]) => ({
    prodi: prodiName,
    ...stats
  }));

  // Mengurutkan berdasarkan 'total' (Jumlah Student Body) terbanyak
  prodiStatsArray.sort((a, b) => b.total - a.total);

  if (prodiStatsArray.length === 0) {
    tableContainer.innerHTML = "<p style='text-align:center;'>Tidak ada data statistik program studi ditemukan.</p>";
    return;
  }

  let tableHTML = `
    <table>
      <thead>
        <tr>
          <th>No</th>
          <th>Program Studi</th>
          <th>Jumlah Student Body</th>
          <th>Aktif</th>
          <th>Cuti</th>
        </tr>
      </thead>
      <tbody>
  `;

  prodiStatsArray.forEach((stats, i) => {
    tableHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${stats.prodi}</td>
        <td>${stats.total}</td>
        <td>${stats.aktif}</td>
        <td>${stats.cuti}</td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  tableContainer.innerHTML = tableHTML;
}

/**
 * Menghasilkan chart pie menggunakan Plotly.
 * @param {Object} dataMap - Objek berisi hitungan kategori.
 * @param {string} elementId - ID elemen div untuk menempatkan chart.
 * @param {string} title - Judul chart.
 */
function generatePieChart(dataMap, elementId, title) {
  const labels = Object.keys(dataMap);
  const values = Object.values(dataMap);
  const trace = { labels, values, type: 'pie', hole: .4, marker: { colors: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'] } };
  const layout = { title: title, margin: { t: 40, b: 20, l: 20, r: 20 }, height: 350, showlegend: true, legend: { orientation: "h", x: 0, y: -0.2 } };
  Plotly.react(elementId, [trace], layout);
}

/**
 * Memperbarui semua chart (kecuali tren) di bagian Analytics.
 * @param {Array<Object>} data - Data mahasiswa yang sudah difilter.
 */
function updateCharts(data) {
  generatePieChart(countOccurrences(data, 'Program Studi'), 'programStudiChart', 'Populasi Program Studi');
  generatePieChart(countOccurrences(data, 'Status'), 'statusChart', 'Populasi Status Mahasiswa');
  generatePieChart(countOccurrences(data, 'Agama'), 'agamaChart', 'Populasi Agama dan Keyakinan');
  generatePieChart(countOccurrences(data, 'Provinsi'), 'provinsiChart', 'Populasi Asal Provinsi');
}

/**
 * Memperbarui chart tren mahasiswa per angkatan.
 * @param {Array<Object>} data - Data mahasiswa yang sudah difilter.
 */
function updateTrenChart(data) {
  const angkatanCounts = countOccurrences(data, "Angkatan");
  // Urutkan angkatan secara numerik
  const years = Object.keys(angkatanCounts).sort((a, b) => parseInt(a) - parseInt(b));
  const counts = years.map(year => angkatanCounts[year]);

  const trace = {
    x: years,
    y: counts,
    type: 'scatter',
    mode: 'lines+markers',
    marker: { color: '#3498db' },
    line: { shape: 'linear' }
  };

  const layout = {
    title: 'Tren Mahasiswa per Angkatan',
    xaxis: { title: 'Angkatan' },
    yaxis: { title: 'Jumlah Mahasiswa' },
    margin: { t: 40, b: 40, l: 40, r: 20 },
    height: 350
  };

  Plotly.react('trenMahasiswaChart', [trace], layout);
}

/**
 * Menghitung frekuensi kemunculan nilai dalam kolom tertentu.
 * @param {Array<Object>} data - Data mahasiswa.
 * @param {string} key - Kunci kolom yang akan dihitung.
 * @returns {Object} - Objek berisi hitungan kemunculan.
 */
function countOccurrences(data, key) {
  return data.reduce((acc, row) => {
    const value = row[key] || 'Tidak diketahui';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Mendapatkan data mahasiswa yang sudah difilter berdasarkan input pengguna.
 * @returns {Array<Object>} - Data mahasiswa yang sudah difilter.
 */
function getFilteredData() {
  // Only apply filters if on the Data Mahasiswa page
  const isDataMahasiswaPage = document.getElementById('dataMahasiswaPage').style.display === 'block';

  if (!isDataMahasiswaPage) {
    return originalData; // Return all data if not on the data mahasiswa page
  }

  const keyword = document.getElementById('searchBox').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const prodiFilter = document.getElementById('prodiFilter').value;
  const angkatanFilter = document.getElementById('angkatanFilter').value;

  return originalData.filter(d => {
    const matchKeyword = (!keyword || (d.Nama && d.Nama.toLowerCase().includes(keyword)) || (d.NIM && String(d.NIM).toLowerCase().includes(keyword)));
    const matchStatus = (statusFilter === 'all' || d.Status === statusFilter);
    const matchProdi = (prodiFilter === 'all' || d["Program Studi"] === prodiFilter);
    const matchAngkatan = (angkatanFilter === 'all' || d.Angkatan == angkatanFilter);
    return matchKeyword && matchStatus && matchProdi && matchAngkatan;
  });
}

/**
 * Memperbarui seluruh bagian dashboard (statistik, tabel, dan chart).
 */
function updateDashboard() {
  const filtered = getFilteredData();

  // Update stats only on dashboard page
  if (document.getElementById('dashboardPage').style.display === 'block') {
    updateStats(filtered);
    generateProdiStatsTable(filtered, 'recentMahasiswaTable'); // <--- BARIS YANG SUDAH DIUBAH
  }

  // Update full table only on dataMahasiswaPage
  if (document.getElementById('dataMahasiswaPage').style.display === 'block') {
    updateTable(filtered, 'detailTable', null, true); // Full table with pagination
  }

  // Update charts only on analytics page
  if (document.getElementById('analyticsPage').style.display === 'block') {
    updateCharts(filtered);
    updateTrenChart(filtered);
  }
}

/**
 * Pindah ke halaman sebelumnya di tabel detail.
 */
function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    updateDashboard();
  }
}

/**
 * Pindah ke halaman berikutnya di tabel detail.
 */
function nextPage() {
  const filtered = getFilteredData();
  const currentRowsPerPage = document.getElementById('dataMahasiswaPage').style.display === 'block' ? fullTableRowsPerPage : rowsPerPage;
  const totalPages = Math.ceil(filtered.length / currentRowsPerPage);

  if (currentPage < totalPages) {
    currentPage++;
    updateDashboard();
  }
}

// Inisialisasi saat halaman dimuat
window.onload = function() {
  displayCurrentDate(); // Display current date
  loadDataFromAppsScript(); // Load data from Google Apps Script API

  // Event listener for filters and search (now located on Data Mahasiswa page)
  const searchBox = document.getElementById('searchBox');
  const statusFilter = document.getElementById('statusFilter');
  const prodiFilter = document.getElementById('prodiFilter');
  const angkatanFilter = document.getElementById('angkatanFilter');

  if (searchBox) searchBox.addEventListener('input', function() { currentPage = 1; updateDashboard(); });
  if (statusFilter) statusFilter.addEventListener('change', function() { currentPage = 1; updateDashboard(); });
  if (prodiFilter) prodiFilter.addEventListener('change', function() { currentPage = 1; updateDashboard(); });
  if (angkatanFilter) angkatanFilter.addEventListener('change', function() { currentPage = 1; updateDashboard(); });

// Event listener for Refresh Button
document.getElementById('refreshDataBtn').addEventListener('click', function() {
    console.log('Refreshing data...');
    loadDataFromAppsScript(); // Memanggil ulang fungsi untuk memuat data
});

  // Toggle sidebar
  document.getElementById('sidebarToggle').addEventListener('click', function() {
      document.body.classList.toggle('sidebar-collapsed');
  });

  // Tampilkan halaman dashboard secara default
  showPage('dashboardPage');
};