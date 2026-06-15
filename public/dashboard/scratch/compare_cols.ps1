
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults923.xls"
$excel = New-Object -ComObject Excel.Application
$wb = $excel.Workbooks.Open($ExcelPath)
$ws = $wb.Worksheets.Item(1)
for($r=2; $r -le 10; $r++){
    $c8 = $ws.Cells.Item($r, 8).Value2
    $c9 = $ws.Cells.Item($r, 9).Value2
    $cur = $ws.Cells.Item($r, 6).Value2
    Write-Host "Row ${r}: Cur=$cur | Col8(USD)=$c8 | Col9(Rem)=$c9"
}
$wb.Close($false)
$excel.Quit()
