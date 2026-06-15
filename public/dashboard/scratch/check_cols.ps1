
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults923.xls"
$excel = New-Object -ComObject Excel.Application
$wb = $excel.Workbooks.Open($ExcelPath)
$ws = $wb.Worksheets.Item(1)
$row = $ws.UsedRange.Rows.Item(1).Value2
for($c=1; $c -le 15; $c++){
    Write-Host "Col ${c}: $($row[1, $c])"
}
$wb.Close($false)
$excel.Quit()
