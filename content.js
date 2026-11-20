const STORAGE_KEYS = {
    PROSES_SEMAKIN: 'ed_autofill_process_date',
    BULAN_SASARAN: 'ed_autofill_target_month',
    TAHUN_SASARAN: 'ed_autofill_target_year',
    TARIKH_CUTI: 'ed_autofill_holidays',
    NAMA_AKTIVITI: 'ed_manual_nama',
    MASA_MULA: 'ed_manual_mula',
    MASA_TAMAT: 'ed_manual_tamat',
    HBH_HARI: 'ed_hbh_days'
};

const KATEGORI_BIASA = '1';
const KATEGORI_CUTI = '7';
const KATEGORI_HBH = '15';

// Fungsi Helper Chrome Storage
async function getVal(key, fallback = "") {
    const data = await chrome.storage.local.get(key);
    return data[key] !== undefined ? data[key] : fallback;
}

async function setVal(key, value) {
    await chrome.storage.local.set({ [key]: value });
}

async function delVal(key) {
    await chrome.storage.local.remove(key);
}

// Redirect Logic
if (window.location.href.includes('/aktiviti/papar')) {
    getVal(STORAGE_KEYS.PROSES_SEMAKIN).then(val => {
        if (parseInt(val) > 0) {
            window.location.replace('https://ediary.sprm.gov.my/aktiviti/tambah');
        }
    });
}

function safeInput(selector, value) {
    const el = document.querySelector(selector);
    if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

async function initGUI() {
    const css = `
        #autofill-panel { position: fixed; top: 10px; right: 10px; z-index: 10000; background: #fff; border: 2px solid #3c8dbc; padding: 15px; border-radius: 10px; width: 330px; max-height: 92vh; overflow-y: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.2); font-family: 'Segoe UI', Arial, sans-serif; }
        #autofill-panel h4 { margin: 0 0 10px 0; color: #3c8dbc; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px; }
        #autofill-panel label.field-label { font-weight: bold; display: block; margin-top: 8px; margin-bottom: 3px; font-size: 13px; color: #333; }
        #autofill-panel input[type="text"],
        #autofill-panel input[type="time"],
        #autofill-panel input[type="number"],
        #autofill-panel textarea { width: 100%; padding: 7px 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; font-family: inherit; }
        #autofill-panel input::placeholder, #autofill-panel textarea::placeholder { color: #b0b0b0; font-style: italic; }
        .hbh-days { display: flex; justify-content: space-between; gap: 6px; margin-top: 4px; margin-bottom: 6px; }
        .hbh-option { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #222; cursor: pointer; user-select: none; }
        .hbh-option input[type="checkbox"].hbh-circle {
            appearance: none;
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            border: 1.5px solid #3c8dbc;
            border-radius: 50%;
            background: #fff;
            margin: 0;
            cursor: pointer;
            position: relative;
            flex-shrink: 0;
        }
        .hbh-option input[type="checkbox"].hbh-circle:checked {
            border-color: #3c8dbc;
            background: #fff;
        }
        .hbh-option input[type="checkbox"].hbh-circle:checked::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #3c8dbc;
            transform: translate(-50%, -50%);
        }
        .btn-start { background: #28a745; color: white; border: none; width: 100%; padding: 10px; margin-top: 14px; font-weight: bold; cursor: pointer; border-radius: 5px; font-size: 14px; }
        .btn-stop { background: #f39c12; color: white; border: none; width: 100%; padding: 8px; margin-top: 8px; cursor: pointer; border-radius: 5px; font-weight: bold; font-size: 13px; }
        .btn-reset { background: #dc3545; color: white; border: none; width: 100%; padding: 8px; margin-top: 8px; cursor: pointer; border-radius: 5px; font-weight: bold; font-size: 13px; }
        .github-note { margin-top: 14px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 8px; font-style: italic; }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = css;
    document.head.appendChild(styleSheet);

    const savedHbhDays = await getVal(STORAGE_KEYS.HBH_HARI, []);

    const panel = document.createElement('div');
    panel.id = 'autofill-panel';
    panel.innerHTML = `
        <h4>⚙️ e-Diary Auto</h4>
        <label class="field-label">1. Nama Aktiviti:</label>
        <input type="text" id="g_nama" placeholder="Isi maklumat aktiviti di sini..." value="${await getVal(STORAGE_KEYS.NAMA_AKTIVITI)}">
        <div style="display:flex; gap:5px;">
            <div style="flex:1;"><label class="field-label">2. Masa Mula:</label><input type="time" id="g_mula" value="${await getVal(STORAGE_KEYS.MASA_MULA, '08:00')}"></div>
            <div style="flex:1;"><label class="field-label">3. Masa Tamat:</label><input type="time" id="g_tamat" value="${await getVal(STORAGE_KEYS.MASA_TAMAT, '17:00')}"></div>
        </div>
        <div style="display:flex; gap:5px;">
            <div style="flex:1;"><label class="field-label">Bulan:</label><input type="number" id="g_bln" placeholder="Cth: 2" value="${await getVal(STORAGE_KEYS.BULAN_SASARAN)}"></div>
            <div style="flex:1;"><label class="field-label">Tahun:</label><input type="number" id="g_thn" placeholder="Cth: 2026" value="${await getVal(STORAGE_KEYS.TAHUN_SASARAN)}"></div>
        </div>
        <label class="field-label">4. Cuti/Sakit (DD/MM):</label>
        <textarea id="g_cuti" placeholder="Cth: 1/1, 05/01, 31/8..." rows="2">${await getVal(STORAGE_KEYS.TARIKH_CUTI)}</textarea>

        <label class="field-label">5. Hari Bekerja Hibrid (HBH):</label>
        <div class="hbh-days">
            <label class="hbh-option"><input type="checkbox" class="hbh-circle" name="hbh_day" value="2"> Selasa</label>
            <label class="hbh-option"><input type="checkbox" class="hbh-circle" name="hbh_day" value="3"> Rabu</label>
            <label class="hbh-option"><input type="checkbox" class="hbh-circle" name="hbh_day" value="4"> Khamis</label>
        </div>
        
        <button id="btn_mula" class="btn-start">SIMPAN & JALANKAN</button>
        <div style="display:flex; gap:5px;">
            <button id="btn_stop" style="flex:1;" class="btn-stop">HENTI</button>
            <button id="btn_reset" style="flex:1;" class="btn-reset">RESET</button>
        </div>
        
        <div class="github-note">github.com/fahmieabdrahim</div>
    `;
    document.body.appendChild(panel);

    // Logik pilihan bulatan HBH (maksimum 2 hari)
    let activeHbhSelection = Array.isArray(savedHbhDays)
        ? savedHbhDays.map(d => parseInt(d, 10)).filter(d => [2, 3, 4].includes(d)).slice(0, 2)
        : [];

    const hbhInputs = Array.from(document.querySelectorAll('input[name="hbh_day"]'));

    function syncHbhVisuals() {
        hbhInputs.forEach(cb => {
            const val = parseInt(cb.value, 10);
            cb.checked = activeHbhSelection.includes(val);
        });
    }

    syncHbhVisuals();

    hbhInputs.forEach(cb => {
        cb.addEventListener('change', () => {
            const val = parseInt(cb.value, 10);

            if (cb.checked) {
                if (activeHbhSelection.includes(val)) return;

                if (activeHbhSelection.length >= 2) {
                    cb.checked = false;
                    alert("Anda hanya boleh memilih maksimum 2 hari HBH sahaja.");
                    return;
                }

                activeHbhSelection.push(val);
            } else {
                activeHbhSelection = activeHbhSelection.filter(item => item !== val);
            }

            syncHbhVisuals();
        });
    });

    document.getElementById('btn_mula').onclick = async () => {
        await setVal(STORAGE_KEYS.NAMA_AKTIVITI, document.getElementById('g_nama').value);
        await setVal(STORAGE_KEYS.MASA_MULA, document.getElementById('g_mula').value);
        await setVal(STORAGE_KEYS.MASA_TAMAT, document.getElementById('g_tamat').value);
        await setVal(STORAGE_KEYS.BULAN_SASARAN, document.getElementById('g_bln').value);
        await setVal(STORAGE_KEYS.TAHUN_SASARAN, document.getElementById('g_thn').value);
        await setVal(STORAGE_KEYS.TARIKH_CUTI, document.getElementById('g_cuti').value);
        await setVal(STORAGE_KEYS.HBH_HARI, activeHbhSelection);
        await setVal(STORAGE_KEYS.PROSES_SEMAKIN, 1);
        window.location.replace('https://ediary.sprm.gov.my/aktiviti/tambah');
    };

    document.getElementById('btn_stop').onclick = async () => {
        await delVal(STORAGE_KEYS.PROSES_SEMAKIN);
        alert("Proses dihentikan.");
        location.reload();
    };

    document.getElementById('btn_reset').onclick = async () => {
        if (confirm("Padam semua tetapan?")) {
            await chrome.storage.local.clear();
            await setVal(STORAGE_KEYS.MASA_MULA, "08:00");
            await setVal(STORAGE_KEYS.MASA_TAMAT, "17:00");
            location.reload();
        }
    };
}

// Logik Proses
async function proses() {
    let day = parseInt(await getVal(STORAGE_KEYS.PROSES_SEMAKIN, 0));
    let month = parseInt(await getVal(STORAGE_KEYS.BULAN_SASARAN, 0));
    let year = parseInt(await getVal(STORAGE_KEYS.TAHUN_SASARAN, 0));

    if (day === 0 || isNaN(month) || isNaN(year)) return;

    const dateObj = new Date(year, month - 1, day);
    if (dateObj.getMonth() + 1 != month) {
        await delVal(STORAGE_KEYS.PROSES_SEMAKIN);
        alert("Selesai!");
        return;
    }

    const inputCuti = await getVal(STORAGE_KEYS.TARIKH_CUTI, "");
    const senaraiCutiBersih = inputCuti.split(',').map(t => {
        let b = t.trim().split('/');
        return b.length === 2 ? `${b[0].padStart(2, '0')}/${b[1].padStart(2, '0')}` : "";
    });

    const ddmm = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
    const dayOfWeek = dateObj.getDay(); // 0=Ahad, 2=Selasa, 3=Rabu, 4=Khamis, 6=Sabtu

    // Langkau hujung minggu sahaja
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        await setVal(STORAGE_KEYS.PROSES_SEMAKIN, day + 1);
        location.reload();
        return;
    }

    const isCutiDay = senaraiCutiBersih.includes(ddmm);
    const hbhDays = await getVal(STORAGE_KEYS.HBH_HARI, []);
    const isHbhDay = !isCutiDay && Array.isArray(hbhDays) && hbhDays.includes(dayOfWeek);

    let kategoriValue = KATEGORI_BIASA;
    if (isCutiDay) {
        kategoriValue = KATEGORI_CUTI;
    } else if (isHbhDay) {
        kategoriValue = KATEGORI_HBH;
    }

    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    safeInput('#tactivity-title', await getVal(STORAGE_KEYS.NAMA_AKTIVITI));
    safeInput('#tactivity-date_from_only', formattedDate);
    safeInput('#tactivity-date_to_only', formattedDate);
    safeInput('#tactivity-time_from_only', await getVal(STORAGE_KEYS.MASA_MULA));
    safeInput('#tactivity-time_to_only', await getVal(STORAGE_KEYS.MASA_TAMAT));
    safeInput('#tactivity-location', 'Pejabat');
    safeInput('#tactivity-activity', kategoriValue);
    safeInput('#tactivity-permission_type', '3');

    if (window.CKEDITOR && CKEDITOR.instances['tactivity-detail']) {
        CKEDITOR.instances['tactivity-detail'].setData("Melaksanakan tugas rasmi harian.");
    }

    await setVal(STORAGE_KEYS.PROSES_SEMAKIN, day + 1);

    setTimeout(() => {
        const btnSubmit = document.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.click();
            setTimeout(() => {
                const btnConfirm = document.getElementById('submit');
                if (btnConfirm) btnConfirm.click();
            }, 1500);
        }
    }, 3000);
}

if (window.location.pathname.includes('/aktiviti/tambah')) {
    initGUI().then(() => {
        getVal(STORAGE_KEYS.PROSES_SEMAKIN, 0).then(val => {
            if (parseInt(val) > 0) setTimeout(proses, 2000);
        });
    });
}
