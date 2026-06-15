
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults106.xls"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    for ($r = 2; $r -le 10; $r++) {
        $num = $worksheet.Cells.Item($r, 4).Value2
        $curr = $worksheet.Cells.Item($r, 6).Value2
        $usd = $worksheet.Cells.Item($r, 8).Value2
        $rem = $worksheet.Cells.Item($r, 9).Value2
        Write-Host "Num: $num | Curr: $curr | USD: $usd | REM: $rem"
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
