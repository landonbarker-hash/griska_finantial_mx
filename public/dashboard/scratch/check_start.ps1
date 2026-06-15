
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults923.xls"
$excel = New-Object -ComObject Excel.Application
$wb = $excel.Workbooks.Open($ExcelPath)
$ws = $wb.Worksheets.Item(1)
for($r=1; $r -le 5; $r++){
    $val = $ws.Cells.Item($r, 1).Value2
    Write-Host "Row ${r}: $val"
}
$wb.Close($false)
$excel.Quit()
