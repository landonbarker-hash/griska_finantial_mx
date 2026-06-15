
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\Month End Unapplied Payments Apr 2026.xlsx"
$excel = New-Object -ComObject Excel.Application
$workbook = $excel.Workbooks.Open($ExcelPath)
$sheet = $workbook.Worksheets.Item("Unapplied PMT report Mar 2026")
$rowCount = $sheet.UsedRange.Rows.Count
for ($r=2; $r -le $rowCount; $r++) {
    $sub = $sheet.Cells.Item($r, 1).Value2
    $amt = $sheet.Cells.Item($r, 8).Value2
    if ($sub -match "326") {
        Write-Host "Row ${r}: Sub=${sub} | Amt=${amt}"
    }
}
$workbook.Close($false)
$excel.Quit()
