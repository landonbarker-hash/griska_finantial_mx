
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults106.xls"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    $rowCount = $worksheet.UsedRange.Rows.Count
    for ($r = 2; $r -le $rowCount; $r++) {
        $subStr = $worksheet.Cells.Item($r, 1).Value2
        if ($subStr -ne $null -and $subStr -notmatch '\d{3}') {
            $num = $worksheet.Cells.Item($r, 4).Value2
            $amt = $worksheet.Cells.Item($r, 9).Value2
            Write-Host "Row $r | Sub: $subStr | Num: $num | Amt: $amt"
        }
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
