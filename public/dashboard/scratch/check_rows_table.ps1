
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\Month End Unapplied Payments Apr 2026.xlsx"
$excel = New-Object -ComObject Excel.Application
$workbook = $excel.Workbooks.Open($ExcelPath)
$sheet = $workbook.Worksheets.Item("Regions data table")
for ($r=1; $r -le 5; $r++) {
    $c1 = $sheet.Cells.Item($r, 1).Value2
    $c2 = $sheet.Cells.Item($r, 2).Value2
    $c4 = $sheet.Cells.Item($r, 4).Value2
    $c8 = $sheet.Cells.Item($r, 8).Value2
    Write-Host "Row ${r}: C1=${c1} | C2=${c2} | C4=${c4} | C8=${c8}"
}
$workbook.Close($false)
$excel.Quit()
