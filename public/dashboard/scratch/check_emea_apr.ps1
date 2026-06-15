
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\Month End Unapplied Payments Apr 2026.xlsx"
$excel = New-Object -ComObject Excel.Application
$workbook = $excel.Workbooks.Open($ExcelPath)
$sheet = $workbook.Worksheets.Item("EMEA Apr  2026")
for ($c=1; $c -le 10; $c++) {
    $val = $sheet.Cells.Item(1, $c).Value2
    Write-Host "Col ${c}: ${val}"
}
$workbook.Close($false)
$excel.Quit()
