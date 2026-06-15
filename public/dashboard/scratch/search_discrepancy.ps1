
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\Month End Unapplied Payments Apr 2026.xlsx"
$excel = New-Object -ComObject Excel.Application
$workbook = $excel.Workbooks.Open($ExcelPath)
$sheet = $workbook.Worksheets.Item("Unapplied PMT report Mar 2026")
$rowCount = $sheet.UsedRange.Rows.Count
for ($r=2; $r -le $rowCount; $r++) {
    $amt = $sheet.Cells.Item($r, 8).Value2
    if ($amt -gt 3124 -and $amt -lt 3125) {
        $sub = $sheet.Cells.Item($r, 1).Value2
        $num = $sheet.Cells.Item($r, 4).Value2
        Write-Host "Found Discrepancy Amount! Row ${r}: Sub=${sub} | Num=${num} | Amt=${amt}"
    }
}
$workbook.Close($false)
$excel.Quit()
