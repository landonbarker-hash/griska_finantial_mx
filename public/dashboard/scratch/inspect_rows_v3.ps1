
$excel = New-Object -ComObject Excel.Application
$workbook = $excel.Workbooks.Open("C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults923.xls")
$sheet = $workbook.Sheets.Item(1)
$range = $sheet.UsedRange
$vals = $range.Value2
$workbook.Close($false)
$excel.Quit()

for ($i=2; $i -le 30; $i++) {
    $sub = $vals[$i, 1]
    $cust = $vals[$i, 11]
    $amt = $vals[$i, 9]
    $date = $vals[$i, 2]
    Write-Host "Row $($i): Sub=$($sub) | Cust=$($cust) | Amt=$($amt) | Date=$($date)"
}
