
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

# Read ALL sheets and dump ALL content
foreach ($shFile in @('xl/worksheets/sheet1.xml','xl/worksheets/sheet2.xml','xl/worksheets/sheet3.xml')) {
    $entry = $zip.Entries | Where-Object { $_.FullName -eq $shFile }
    if (-not $entry) { continue }
    $sr = New-Object System.IO.StreamReader($entry.Open())
    [xml]$shXml = $sr.ReadToEnd(); $sr.Close()
    $rows = $shXml.worksheet.sheetData.row
    Write-Host "`n========== $shFile =========="
    foreach ($row in $rows) {
        $rowData = @()
        foreach ($cell in $row.c) {
            $col = $cell.r -replace '\d+',''
            $val = GetVal $cell $strings
            if ("$val" -ne '') { $rowData += "$col=$val" }
        }
        if ($rowData.Count -gt 0) {
            Write-Host "R$($row.r): $($rowData -join ' | ')"
        }
    }
}

$zip.Dispose()
Remove-Item $zipPath -Force
