
// ── SUBSIDIARY MAPPING ──
const SUBSIDIARY_MAPPING = {
    "101": "Americas", "102": "Americas", "103": "Americas", "104": "Americas", "105": "Americas", 
    "107": "Americas", "108": "Americas", "111": "Americas", "115": "Americas", "116": "Sysomos", 
    "117": "Americas", "121": "Americas", "130": "Americas", "131": "Americas", "133": "Americas", 
    "140": "Americas", "144": "Americas", "151": "Americas", "158": "Americas", "188": "Americas",
    "910": "Americas", "920": "Americas", "923": "Americas", "930": "Americas", "940": "Americas", "950": "Americas",
    "106": "Sysomos",  "326": "Sysomos", "116": "Sysomos",
    "201": "APAC", "211": "APAC", "212": "APAC", "221": "APAC", "231": "APAC", "241": "APAC", 
    "243": "APAC", "251": "APAC", "261": "APAC", "271": "APAC", "281": "APAC", "291": "APAC",
    "302": "EMEA", "311": "EMEA", "312": "EMEA", "321": "EMEA", "323": "EMEA", "331": "EMEA",
    "334": "EMEA", "335": "EMEA", "341": "EMEA", "351": "EMEA", "361": "EMEA", "371": "EMEA", "381": "EMEA",
    "382": "EMEA", "383": "EMEA", "391": "EMEA", "392": "EMEA", "401": "EMEA", "411": "EMEA", "412": "EMEA",
    "421": "EMEA", "431": "EMEA", "441": "EMEA", "451": "EMEA", "461": "EMEA", "511": "EMEA", "512": "EMEA",
    "513": "EMEA", "514": "EMEA", "521": "EMEA", "531": "EMEA", "541": "EMEA", "611": "EMEA", "621": "EMEA",
    "631": "EMEA", "711": "EMEA", "721": "EMEA", "731": "EMEA", "741": "EMEA", "751": "EMEA", "761": "EMEA",
    "771": "EMEA", "811": "EMEA", "821": "EMEA"
};

// ── UTILITIES ──
const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
const pct = (a, t) => ((a / t) * 100).toFixed(1) + '%';
const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

// ── EXCEL INGESTION ENGINE ──
function processXlsFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const validDatasets = [];
            const headerKeys = ["subsidiary", "subsidiaria", "amount", "monto", "remaining", "date", "fecha", "number", "número"];
            const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            const currentMonthIdx = new Date().getMonth();

            workbook.SheetNames.forEach(name => {
                const ws = workbook.Sheets[name];
                if (!ws['!ref']) return;
                
                const sampleRows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: "" }).slice(0, 10);
                let sheetScore = 0;
                let hasEssential = false;

                sampleRows.forEach(row => {
                    if (!Array.isArray(row)) return;
                    const rowStr = row.join(" ").toLowerCase();
                    let rowMatches = 0;
                    headerKeys.forEach(k => {
                        if (rowStr.includes(k)) rowMatches++;
                    });
                    if (rowStr.includes("amount") || rowStr.includes("remaining")) {
                        if (rowStr.includes("subsidiary") || rowStr.includes("date") || rowStr.includes("number")) hasEssential = true;
                    }
                    sheetScore = Math.max(sheetScore, rowMatches);
                });

                let isOld = false;
                monthNames.forEach((m, idx) => {
                    if (idx < currentMonthIdx && name.toLowerCase().includes(m)) isOld = true;
                });

                if (hasEssential && sheetScore >= 2 && !isOld) {
                    console.log(`✅ Sheet "${name}" qualified.`);
                    const fullData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
                    validDatasets.push({ name: name, data: fullData });
                }
            });

            if (validDatasets.length === 0) {
                // Fallback to largest sheet
                let best = workbook.SheetNames[0];
                let maxR = 0;
                workbook.SheetNames.forEach(n => {
                    const range = XLSX.utils.decode_range(workbook.Sheets[n]['!ref'] || "A1:A1");
                    const r = range.e.r - range.s.r;
                    if (r > maxR) { maxR = r; best = n; }
                });
                validDatasets.push({ name: best, data: XLSX.utils.sheet_to_json(workbook.Sheets[best], { header: 1, defval: "" }) });
            }

            let allProcessed = [];
            validDatasets.forEach(item => {
                const extracted = processExtractedData(item.data, item.name);
                allProcessed = allProcessed.concat(extracted);
            });
            
            if (allProcessed.length > 0) {
                updateUnappliedData(allProcessed);
                showToast(`¡Éxito! Cargados ${allProcessed.length} registros de ${validDatasets.length} pestañas.`);
                closeUploadModal();
            } else {
                showToast("No se encontraron datos válidos.", "error");
            }
        } catch (err) {
            console.error("XLS Error:", err);
            showToast("Error crítico procesando Excel.", "error");
        }
    };
    reader.readAsArrayBuffer(file);
}

function processExtractedData(rows, sheetName = "") {
    if (!rows || rows.length < 2) return [];

    let headerRowIdx = 0;
    let idxSub = -1, idxDate = -1, idxNum = -1, idxAmt = -1, idxCust = -1;

    const subKeys = ["subsidiary", "sub"];
    const dateKeys = ["date", "fecha"];
    const numKeys = ["number", "número", "doc"];
    const amtKeys = ["remaining", "pendiente", "amount", "monto"];
    const custKeys = ["customer", "cliente", "name"];

    for (let i = 0; i < Math.min(rows.length, 25); i++) {
        if (!Array.isArray(rows[i])) continue;
        const row = rows[i].map(c => String(c || "").toLowerCase().trim());
        const amt = row.findIndex(c => amtKeys.some(k => c.includes(k)));
        if (amt !== -1) {
            headerRowIdx = i;
            idxAmt = amt;
            idxSub = row.findIndex(c => subKeys.some(k => c.includes(k)));
            idxDate = row.findIndex(c => dateKeys.some(k => c.includes(k)));
            idxNum = row.findIndex(c => numKeys.some(k => c.includes(k)));
            idxCust = row.findIndex(c => custKeys.some(k => c.includes(k)));
            break;
        }
    }

    const colSub = idxSub !== -1 ? idxSub : 0;
    const colDate = idxDate !== -1 ? idxDate : 1;
    const colNum = idxNum !== -1 ? idxNum : 3;
    const colAmt = idxAmt !== -1 ? idxAmt : 7;
    const colCust = idxCust !== -1 ? idxCust : 10;

    const seenNumbers = new Set();
    const results = [];
    const lowSheetName = sheetName.toLowerCase();

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;
        
        const subFull = String(row[colSub] || "").trim();
        const lowSub = subFull.toLowerCase();
        if (lowSub === "total" || lowSub === "grand total" || lowSub.includes("subsidiary")) continue;
        
        const docNum = String(row[colNum] || "").trim().toUpperCase();
        if (docNum && seenNumbers.has(docNum)) continue;
        if (docNum) seenNumbers.add(docNum);
        
        const match = subFull.match(/(\d{3})/);
        const subCode = match ? match[1] : "";
        let region = SUBSIDIARY_MAPPING[subCode];
        
        if (!region) {
            const combined = (lowSub + " " + lowSheetName);
            if (combined.includes("sysomos")) region = "Sysomos";
            else if (combined.includes("apac") || combined.includes("singapore")) region = "APAC";
            else if (combined.includes("emea") || combined.includes("europe") || combined.includes("uk")) region = "EMEA";
            else if (combined.includes("americas") || combined.includes("us")) region = "Americas";
            else region = "Americas";
        }
        
        const dateRaw = row[colDate];
        if (!dateRaw) continue;
        let dObj = (typeof dateRaw === 'number') ? new Date(Math.round((dateRaw - 25569) * 86400 * 1000)) : new Date(dateRaw);
        if (isNaN(dObj.getTime())) continue;

        let amtRaw = row[colAmt];
        let amount = Math.abs(parseFloat(String(amtRaw).replace(/[^-0-9.]/g, ''))) || 0;
        if (amount === 0) continue;

        results.push({
            date: dObj.toLocaleDateString(),
            year: dObj.getUTCFullYear().toString(),
            month: MONTHS[dObj.getUTCMonth()],
            customer: String(row[colCust] || "N/A").trim(),
            amount: amount,
            region: region
        });
    }
    return results;
}
