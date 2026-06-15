
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Get-Location
$dataSource = Join-Path $root "data_source"
$dataJsPath = Join-Path $root "data.js"

# 1. Find the newest Excel file
$excelFile = Get-ChildItem -Path $dataSource -Filter "*.xlsx" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $excelFile) {
    Write-Host "No Excel file found in $dataSource"
    exit 0
}

Write-Host "Processing $($excelFile.Name)..."

# 2. Parse Excel using Zip method
$xlPath = $excelFile.FullName
$zipPath = $xlPath + ".zip"
Copy-Item $xlPath $zipPath -Force
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

$strings = @()
$ssEntry = $zip.Entries | Where-Object { $_.FullName -eq 'xl/sharedStrings.xml' }
if ($ssEntry) {
    $sr = New-Object System.IO.StreamReader($ssEntry.Open())
    [xml]$ssXml = $sr.ReadToEnd(); $sr.Close()
    $strings = $ssXml.sst.si | ForEach-Object {
        if ($_.t) { $_.t } elseif ($_.r) { ($_.r | ForEach-Object { $_.t }) -join '' } else { '' }
    }
}

function GetVal($cellNode, $strs) {
    if (-not $cellNode) { return '' }
    if (-not $cellNode.v) { return '' }
    $t = $cellNode.GetAttribute('t')
    if ($t -eq 's') {
        $idx = [int]$cellNode.v
        if ($idx -lt $strs.Count) { return $strs[$idx] } else { return '' }
    }
    return $cellNode.v
}

$dataEntries = $zip.Entries | Where-Object { $_.FullName -like 'xl/worksheets/sheet*.xml' }
$bestEntry = $null
$maxRows = 0
foreach ($entry in $dataEntries) {
    $sr = New-Object System.IO.StreamReader($entry.Open())
    [xml]$xml = $sr.ReadToEnd(); $sr.Close()
    $rowCount = if ($xml.worksheet.sheetData.row) { $xml.worksheet.sheetData.row.Count } else { 0 }
    if ($rowCount -gt $maxRows) {
        $maxRows = $rowCount
        $bestEntry = $entry
    }
}

if (-not $bestEntry) {
    Write-Host "Could not find data sheet."
    $zip.Dispose()
    Remove-Item $zipPath -Force
    exit 1
}

Write-Host "Reading $($bestEntry.FullName) ($maxRows rows)..."
$sr = New-Object System.IO.StreamReader($bestEntry.Open())
[xml]$shXml = $sr.ReadToEnd(); $sr.Close()
$rows = $shXml.worksheet.sheetData.row

# 3. Process records
$seenPMT = @{}
$records = @()

# Date Helper
function ParseExcelDate($val) {
    $d = 0.0
    if ([double]::TryParse($val, [ref]$d)) {
        return (Get-Date "1900-01-01").AddDays($d - 2).ToString("MM/dd/yyyy")
    }
    return $val
}

foreach ($row in $rows) {
    $rowNum = [int]$row.r
    if ($rowNum -le 1) { continue } 

    $colMap = @{}
    foreach($c in $row.c) {
        $col = $c.r -replace '\d+',''
        $colMap[$col] = $c
    }

    $region  = GetVal $colMap['E'] $strings
    $month   = GetVal $colMap['C'] $strings
    $year    = GetVal $colMap['D'] $strings
    $pmtNum  = GetVal $colMap['G'] $strings
    $amtStr  = if ($colMap['L']) { $colMap['L'].v } else { '' }
    $custStr = GetVal $colMap['N'] $strings
    $dateRaw = if ($colMap['B']) { $colMap['B'].v } else { '' }
    $dateStr = ParseExcelDate $dateRaw

    if (-not $region -or -not $month -or -not $year -or -not $amtStr) { continue }

    $amt = 0.0
    if (-not [double]::TryParse($amtStr, [ref]$amt)) { continue }
    if ($amt -le 0.01) { continue }

    if ($pmtNum -and $seenPMT.ContainsKey($pmtNum)) { continue }
    if ($pmtNum) { $seenPMT[$pmtNum] = $true }

    $records += [PSCustomObject]@{
        Region   = $region
        Month    = $month.ToUpper()
        Year     = $year
        Amount   = $amt
        Customer = $custStr
        Date     = $dateStr
    }
}

$zip.Dispose()
Remove-Item $zipPath -Force

Write-Host "Found $($records.Count) unique records."

# 4. Aggregate
$monthlyGroups = $records | Group-Object Region, Year, Month
$monthlyData = $monthlyGroups | ForEach-Object {
    $parts = $_.Name -split ', '
    @{
        region = $parts[0]
        year   = $parts[1]
        month  = $parts[2]
        total  = [Math]::Round(($_.Group | Measure-Object Amount -Sum).Sum, 2)
    }
}

$topItems = $records | Sort-Object Amount -Descending | Select-Object -First 20 | ForEach-Object {
    @{
        date     = $_.Date
        customer = $_.Customer
        amount   = [Math]::Round($_.Amount, 2)
        region   = $_.Region
    }
}

$yearsList = @('2022', '2023', '2024', '2025', '2026')
$history = @{
    years    = $yearsList
    americas = @(0,0,0,0,0)
    apac     = @(0,0,0,0,0)
    emea     = @(0,0,0,0,0)
    sysomos  = @(0,0,0,0,0)
}

for ($i=0; $i -lt $yearsList.Count; $i++) {
    $y = $yearsList[$i]
    $history.americas[$i] = [Math]::Round(($records | Where-Object { $_.Year -eq $y -and $_.Region -eq 'Americas' } | Measure-Object Amount -Sum).Sum, 2)
    $history.apac[$i]     = [Math]::Round(($records | Where-Object { $_.Year -eq $y -and $_.Region -eq 'APAC' }     | Measure-Object Amount -Sum).Sum, 2)
    $history.emea[$i]     = [Math]::Round(($records | Where-Object { $_.Year -eq $y -and $_.Region -eq 'EMEA' }     | Measure-Object Amount -Sum).Sum, 2)
    $history.sysomos[$i]  = [Math]::Round(($records | Where-Object { $_.Year -eq $y -and $_.Region -eq 'Sysomos' }  | Measure-Object Amount -Sum).Sum, 2)
}

# 5. Build JS JSON
$jsonMonthly = $monthlyData | ConvertTo-Json -Compress -Depth 5
$jsonTop = $topItems | ConvertTo-Json -Compress -Depth 5
$jsonHistory = $history | ConvertTo-Json -Compress -Depth 5

$newUnappliedSection = @"
        unappliedPayments: {
            monthlyData: $jsonMonthly,
            topItems: $jsonTop,
            history: $jsonHistory
        }
"@

# 6. Careful Replacement
$content = Get-Content $dataJsPath -Raw

# We look for 'unappliedPayments: {' and replace everything until the end of that block.
# Since it's the last property of cashapp, we can look for the closing of cashapp.
$startTag = 'unappliedPayments: {'
$startIndex = $content.IndexOf($startTag)

if ($startIndex -ge 0) {
    # Find the end of DASHBOARD_DATA
    # We'll just keep everything before unappliedPayments and rebuild the ending.
    $before = $content.Substring(0, $startIndex)
    
    $newContent = $before + $newUnappliedSection + "`n    }`n};"
    $newContent | Set-Content $dataJsPath -Force
    Write-Host "data.js updated successfully."
} else {
    Write-Host "ERROR: Could not find unappliedPayments section."
}
