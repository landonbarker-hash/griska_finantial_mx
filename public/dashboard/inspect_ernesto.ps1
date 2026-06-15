
Add-Type -AssemblyName System.IO.Compression.FileSystem
$xlPath = "C:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\UnappliedPaymentsErnestoResults datos ultimos.xlsx"
$zipPath = $xlPath + ".zip"
Copy-Item $xlPath $zipPath -Force
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

# Shared strings
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
    if (-not $cellNode.v) { return '' }
    $t = $cellNode.GetAttribute('t')
    if ($t -eq 's') {
        $idx = [int]$cellNode.v
        if ($idx -lt $strs.Count) { return $strs[$idx] } else { return '' }
    }
    return $cellNode.v
}

# List sheets
$wbEntry = $zip.Entries | Where-Object { $_.FullName -eq 'xl/workbook.xml' }
$wbSr = New-Object System.IO.StreamReader($wbEntry.Open())
[xml]$wbXml = $wbSr.ReadToEnd(); $wbSr.Close()
Write-Host "=== SHEETS ==="
foreach ($sh in $wbXml.workbook.sheets.sheet) {
    Write-Host "  $($sh.name)"
}

# List sheet files
Write-Host "`n=== SHEET FILES ==="
$zip.Entries | Where-Object { $_.FullName -like '*/sheet*.xml' } | ForEach-Object { Write-Host "  $($_.FullName)" }

# Read sheet1 first rows to understand structure
$sh1Entry = $zip.Entries | Where-Object { $_.FullName -eq 'xl/worksheets/sheet1.xml' }
if ($sh1Entry) {
    $sr = New-Object System.IO.StreamReader($sh1Entry.Open())
    [xml]$shXml = $sr.ReadToEnd(); $sr.Close()
    $rows = $shXml.worksheet.sheetData.row
    Write-Host "`n=== SHEET1 HEADER ROW ==="
    $headerRow = $rows | Where-Object { $_.r -eq '1' }
    foreach ($cell in $headerRow.c) {
        $col = $cell.r -replace '\d',''
        $val = GetVal $cell $strings
        Write-Host "  Col $col = '$val'"
    }
    
    # Show first 3 data rows
    Write-Host "`n=== SHEET1 FIRST 3 DATA ROWS ==="
    $dataRows = $rows | Where-Object { [int]$_.r -gt 1 } | Select-Object -First 3
    foreach ($row in $dataRows) {
        $rowData = @()
        foreach ($cell in $row.c) {
            $col = $cell.r -replace '\d',''
            $val = GetVal $cell $strings
            $rowData += "$col=$val"
        }
        Write-Host "  Row $($row.r): $($rowData -join ' | ')"
    }
}

$zip.Dispose()
Remove-Item $zipPath -Force
Write-Host "`nDone."
