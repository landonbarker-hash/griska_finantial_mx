
$excel = New-Object -ComObject Excel.Application
$workbook = $excel.Workbooks.Open("C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults923.xls")
$sheet = $workbook.Sheets.Item(1)
$range = $sheet.UsedRange
$vals = $range.Value2
$workbook.Close($false)
$excel.Quit()

$headers = ""
for ($j=1; $j -le 20; $j++) {
    $val = $vals[1, $j]
    $headers += "Col " + $j + ": " + $val + " | "
}
Write-Host $headers
