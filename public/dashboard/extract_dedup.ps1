
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

# Read sheet2 (main data sheet)
$sh2Entry = $zip.Entries | Where-Object { $_.FullName -eq 'xl/worksheets/sheet2.xml' }
$sr = New-Object System.IO.StreamReader($sh2Entry.Open())
[xml]$shXml = $sr.ReadToEnd(); $sr.Close()
$rows = $shXml.worksheet.sheetData.row

# ── DEDUPLICATION: track seen PMT numbers ──
$seenPMT = @{}
$records = @()

foreach ($row in $rows) {
    $rowNum = [int]$row.r
    if ($rowNum -le 1) { continue }  # skip header

    $region  = GetVal (GetCell $row 'N') $strings
    $month   = GetVal (GetCell $row 'C') $strings
    $year    = GetVal (GetCell $row 'D') $strings
    $pmtNum  = GetVal (GetCell $row 'F') $strings   # Payment number — deduplicate on this
    $amtCell = GetCell $row 'J'
    $amtStr  = if ($amtCell) { $amtCell.v } else { '' }
    $custStr = GetVal (GetCell $row 'L') $strings

    if (-not $region -or -not $month -or -not $year -or -not $amtStr) { continue }
    if ($region -eq 'Sysomos') { continue }

    $amt = 0.0
    if (-not [double]::TryParse($amtStr, [ref]$amt)) { continue }
    if ($amt -le 0) { continue }

    # ── SKIP DUPLICATE PMT NUMBERS ──
    if ($pmtNum -and $seenPMT.ContainsKey($pmtNum)) {
        continue
    }
    if ($pmtNum) { $seenPMT[$pmtNum] = $true }

    $records += [PSCustomObject]@{
        Region   = $region
        Month    = $month
        Year     = $year
        Amount   = $amt
        Customer = $custStr
        PMT      = $pmtNum
    }
}

$zip.Dispose()
Remove-Item $zipPath -Force

# ── Aggregate by Region/Month/Year ──
$grouped = $records | Group-Object { "$($_.Region)|$($_.Month)|$($_.Year)" }

Write-Host "`n========== MARCH 2026 (deduplicated) =========="
$mar = @{ Americas=0.0; APAC=0.0; EMEA=0.0 }
$grouped | Where-Object { $_.Name -like '*|MARCH|2026' } | ForEach-Object {
    $parts = $_.Name.Split('|')
    $reg = $parts[0]
    $total = ($_.Group | Measure-Object Amount -Sum).Sum
    $mar[$reg] += $total
    Write-Host "  $($_.Name) = $($total.ToString('N2'))  ($($_.Count) records)"
}
Write-Host ""
Write-Host "Americas : $($mar['Americas'].ToString('N2'))"
Write-Host "APAC     : $($mar['APAC'].ToString('N2'))"
Write-Host "EMEA     : $($mar['EMEA'].ToString('N2'))"
Write-Host "TOTAL    : $(($mar['Americas']+$mar['APAC']+$mar['EMEA']).ToString('N2'))"

Write-Host "`n========== APRIL 2026 (deduplicated) =========="
$apr = @{ Americas=0.0; APAC=0.0; EMEA=0.0 }
$grouped | Where-Object { $_.Name -like '*|APRIL|2026' } | ForEach-Object {
    $parts = $_.Name.Split('|')
    $reg = $parts[0]
    $total = ($_.Group | Measure-Object Amount -Sum).Sum
    $apr[$reg] += $total
}
Write-Host "Americas : $($apr['Americas'].ToString('N2'))"
Write-Host "APAC     : $($apr['APAC'].ToString('N2'))"
Write-Host "EMEA     : $($apr['EMEA'].ToString('N2'))"
Write-Host "TOTAL    : $(($apr['Americas']+$apr['APAC']+$apr['EMEA']).ToString('N2'))"

Write-Host "`n========== ALL 2026 (deduplicated) =========="
$grouped | Where-Object { $_.Name -like '*|*|2026' } | Sort-Object Name | ForEach-Object {
    $total = ($_.Group | Measure-Object Amount -Sum).Sum
    Write-Host "  $($_.Name) = $($total.ToString('N2'))  ($($_.Count) unique PMTs)"
}

Write-Host "`nTotal records read: $($records.Count)"
Write-Host "Duplicate PMTs skipped: $(($rows | Where-Object { [int]$_.r -gt 1 }).Count - $records.Count - 1)"
