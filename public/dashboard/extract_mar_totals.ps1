
# Extract REAL March 2026 totals from the original Excel file
# Maps Subsidiary column -> Region using known region table
$xlPath = "C:\Users\ernesto.jaramillo\Downloads\Month End Unapplied Payments Mar 2026 (1).xlsx"
if (-not (Test-Path $xlPath)) {
    $xlPath = "C:\Users\ernesto.jaramillo\Downloads\Month End Unapplied Payments Mar 2026.xlsx"
}
Write-Host "Reading: $xlPath"

# Region mapping
$regionMap = @{
    '102'='Americas';'121'='Americas';'130'='Americas';'151'='Americas';'152'='Americas';'160'='Americas'
    '201'='APAC';'211'='APAC';'231'='APAC';'241'='APAC';'251'='APAC';'258'='APAC'
    '311'='EMEA';'321'='EMEA';'331'='EMEA';'341'='EMEA';'351'='EMEA';'361'='EMEA'
    '371'='EMEA';'381'='EMEA';'382'='EMEA';'391'='EMEA';'401'='EMEA';'411'='EMEA';'412'='EMEA';'421'='EMEA'
}

function GetRegion($subsidiary) {
    if (-not $subsidiary) { return 'Unknown' }
    # Extract 3-digit code from beginning of string like "102 - US"
    if ($subsidiary -match '^(\d{3})') {
        $code = $matches[1]
        if ($regionMap.ContainsKey($code)) { return $regionMap[$code] }
    }
    if ($subsidiary -like '*Sysomos*') { return 'Americas' }
    return 'Unknown'
}

# Load workbook via COM
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = $xlPath + ".zip"
Copy-Item $xlPath $zipPath -Force
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

# Get shared strings
$ssEntry = $zip.Entries | Where-Object { $_.FullName -eq 'xl/sharedStrings.xml' }
$strings = @()
if ($ssEntry) {
    $sr = New-Object System.IO.StreamReader($ssEntry.Open())
    [xml]$ssXml = $sr.ReadToEnd()
    $sr.Close()
    $strings = $ssXml.sst.si | ForEach-Object {
        if ($_.t) { $_.t }
        elseif ($_.r) { ($_.r | ForEach-Object { $_.t }) -join '' }
        else { '' }
    }
}

function GetVal($cellNode, $strs) {
    if (-not $cellNode.v) { return '' }
    $t = $cellNode.GetAttribute('t')
    if ($t -eq 's') {
        $idx = [int]$cellNode.v
        if ($idx -lt $strs.Count) { return $strs[$idx] } else { return '' }
    }
    return $cellNode.v
}

# Find sheet6 (Unapplied PMT report Mar 2026)
# First read workbook.xml to get sheet mapping
$wbEntry = $zip.Entries | Where-Object { $_.FullName -eq 'xl/workbook.xml' }
$wbSr = New-Object System.IO.StreamReader($wbEntry.Open())
[xml]$wbXml = $wbSr.ReadToEnd()
$wbSr.Close()

Write-Host "`nSheets found:"
$wbXml.workbook.sheets.sheet | ForEach-Object {
    Write-Host "  $($_.name) -> sheetId=$($_.sheetId) r:id=$($_.'r:id')"
}

# Read xl/worksheets/sheet6.xml
$sh6Entry = $zip.Entries | Where-Object { $_.FullName -eq 'xl/worksheets/sheet6.xml' }
if (-not $sh6Entry) {
    Write-Host "Sheet6 not found! Entries:"
    $zip.Entries | Where-Object { $_.FullName -like '*/sheet*.xml' } | ForEach-Object { Write-Host "  $($_.FullName)" }
    $zip.Dispose(); Remove-Item $zipPath -Force; exit
}

$sh6Sr = New-Object System.IO.StreamReader($sh6Entry.Open())
[xml]$sh6Xml = $sh6Sr.ReadToEnd()
$sh6Sr.Close()

# Parse header row to find column indices
$rows = $sh6Xml.worksheet.sheetData.row
$headerRow = $rows | Where-Object { $_.r -eq '1' }

$colIdx = @{}
foreach ($cell in $headerRow.c) {
    $colLetter = $cell.r -replace '\d',''
    $val = GetVal $cell $strings
    $colIdx[$val] = $colLetter
}

Write-Host "`nColumns detected:"
$colIdx.GetEnumerator() | Sort-Object Name | ForEach-Object { Write-Host "  $($_.Name) = $($_.Value)" }

# Find column letters for Subsidiary and Amount Remaining
$subCol = $colIdx.GetEnumerator() | Where-Object { $_.Name -match 'Subsidiary|subsidiary' } | Select-Object -First 1
$amtCol = $colIdx.GetEnumerator() | Where-Object { $_.Name -match 'Amount Remaining' } | Select-Object -First 1

Write-Host "`nSubsidiary col: $($subCol.Value)"
Write-Host "Amount Remaining col: $($amtCol.Value)"

# Aggregate by region
$totals = @{ 'Americas'=0.0; 'APAC'=0.0; 'EMEA'=0.0; 'Unknown'=0.0 }
$rowCount = 0

foreach ($row in $rows) {
    if ($row.r -eq '1') { continue }  # skip header
    
    $subCell = $row.c | Where-Object { ($_.r -replace '\d','') -eq $subCol.Value } | Select-Object -First 1
    $amtCell = $row.c | Where-Object { ($_.r -replace '\d','') -eq $amtCol.Value } | Select-Object -First 1
    
    if (-not $amtCell) { continue }
    
    $subsidiary = GetVal $subCell $strings
    $amtStr = $amtCell.v
    
    $amt = 0.0
    if ($amtStr -and [double]::TryParse($amtStr, [ref]$amt)) {
        $region = GetRegion $subsidiary
        $totals[$region] += $amt
        $rowCount++
    }
}

$zip.Dispose()
Remove-Item $zipPath -Force

$grandTotal = $totals['Americas'] + $totals['APAC'] + $totals['EMEA']

Write-Host "`n===== MARCH 2026 ACTUAL TOTALS (from Excel sheet6) ====="
Write-Host "Rows processed: $rowCount"
Write-Host ""
Write-Host "Americas  : $($totals['Americas'].ToString('N2'))"
Write-Host "APAC      : $($totals['APAC'].ToString('N2'))"
Write-Host "EMEA      : $($totals['EMEA'].ToString('N2'))"
Write-Host "Unknown   : $($totals['Unknown'].ToString('N2'))"
Write-Host "GRAND TOTAL: $($grandTotal.ToString('N2'))"
