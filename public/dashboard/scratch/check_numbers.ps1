
$excel = New-Object -ComObject Excel.Application
$workbook = $excel.Workbooks.Open("C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults923.xls")
$sheet = $workbook.Sheets.Item(1)
$range = $sheet.UsedRange
$vals = $range.Value2
$workbook.Close($false)
$excel.Quit()

for ($i=2; $i -le 10; $i++) {
    $num = $vals[$i, 4]
    $cust = $vals[$i, 11]
    Write-Host "Row $($i): Num=$($num) | Cust=$($cust)"
}
