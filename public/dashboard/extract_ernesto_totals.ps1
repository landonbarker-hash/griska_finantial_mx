
Add-Type -AssemblyName System.IO.Compression.FileSystem
$xlPath = "C:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\UnappliedPaymentsErnestoResults datos ultimos.xlsx"
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

function GetCell($row, $colLetter) {
    return $row.c | Where-Object { ($_.r -replace '\d+','') -eq $colLetter } | Select-Object -First 1
}

# Read sheet2 (UnappliedPaymentsErnestoResult)
$sh2Entry = $zip.Entries | Where-Object { $_.FullName -eq 'xl/worksheets/sheet2.xml' }
$sr = New-Object System.IO.StreamReader($sh2Entry.Open())
[xml]$shXml = $sr.ReadToEnd(); $sr.Close()
$rows = $shXml.worksheet.sheetData.row

# Header row - find column letters
$headerRow = $rows | Where-Object { $_.r -eq '1' }
$colMap = @{}
foreach ($cell in $headerRow.c) {
    $col = $cell.r -replace '\d+',''
    $val = GetVal $cell $strings
    if ($val) { $colMap[$val] = $col }
}
Write-Host "Column map:"
$colMap.GetEnumerator() | Sort-Object Name | ForEach-Object { Write-Host "  '$($_.Name)' = $($_.Value)" }

# Aggregate by Region + Month + Year
# Columns: A=Subsidiary, C=Month, D=Year, J=AmountRemaining(USD), N=Region
$totals = @{}

foreach ($row in $rows) {
    $rowNum = [int]$row.r
    if ($rowNum -le 1) { continue }  # skip header
    
    $region  = GetVal (GetCell $row 'N') $strings
    $month   = GetVal (GetCell $row 'C') $strings
    $year    = GetVal (GetCell $row 'D') $strings
    $amtCell = GetCell $row 'J'
    $amtStr  = if ($amtCell) { $amtCell.v } else { '' }
    
    if (-not $region -or -not $month -or -not $year -or -not $amtStr) { continue }
    if ($region -eq 'Sysomos') { continue }  # skip Sysomos legacy
    
    $amt = 0.0
    if (-not [double]::TryParse($amtStr, [ref]$amt)) { continue }
    if ($amt -le 0) { continue }  # only positive remaining balances
    
    $key = "$region|$month|$year"
    if (-not $totals.ContainsKey($key)) { $totals[$key] = 0.0 }
    $totals[$key] += $amt
}

$zip.Dispose()
Remove-Item $zipPath -Force

# Show March 2026 results
Write-Host "`n========== MARCH 2026 TOTALS (from Excel) =========="
$mar2026 = @{ 'Americas'=0.0; 'APAC'=0.0; 'EMEA'=0.0 }
$totals.GetEnumerator() | Where-Object { $_.Name -like '*|MARCH|2026' } | ForEach-Object {
    $parts = $_.Name.Split('|')
    $reg = $parts[0]
    $mar2026[$reg] += $_.Value
    Write-Host "  $($_.Name) = $($_.Value.ToString('N2'))"
}
$grandMar = $mar2026['Americas'] + $mar2026['APAC'] + $mar2026['EMEA']
Write-Host ""
Write-Host "Americas : $($mar2026['Americas'].ToString('N2'))"
Write-Host "APAC     : $($mar2026['APAC'].ToString('N2'))"
Write-Host "EMEA     : $($mar2026['EMEA'].ToString('N2'))"
Write-Host "TOTAL    : $($grandMar.ToString('N2'))"

# Show April 2026 results too
Write-Host "`n========== APRIL 2026 TOTALS (from Excel) =========="
$apr2026 = @{ 'Americas'=0.0; 'APAC'=0.0; 'EMEA'=0.0 }
$totals.GetEnumerator() | Where-Object { $_.Name -like '*|APRIL|2026' } | ForEach-Object {
    $parts = $_.Name.Split('|')
    $reg = $parts[0]
    $apr2026[$reg] += $_.Value
}
$grandApr = $apr2026['Americas'] + $apr2026['APAC'] + $apr2026['EMEA']
Write-Host "Americas : $($apr2026['Americas'].ToString('N2'))"
Write-Host "APAC     : $($apr2026['APAC'].ToString('N2'))"
Write-Host "EMEA     : $($apr2026['EMEA'].ToString('N2'))"
Write-Host "TOTAL    : $($grandApr.ToString('N2'))"

# Show ALL months 2026 for context
Write-Host "`n========== ALL 2026 BY REGION/MONTH =========="
$totals.GetEnumerator() | Where-Object { $_.Name -like '*|*|2026' } | Sort-Object Name | ForEach-Object {
    Write-Host "  $($_.Name) = $($_.Value.ToString('N2'))"
}
