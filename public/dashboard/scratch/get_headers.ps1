
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults923.xls"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    $headers = @()
    for ($col = 1; $col -le 30; $col++) {
        $val = $worksheet.Cells.Item(1, $col).Value2
        if ($val -ne $null) { $headers += $val } else { break }
    }
    
    Write-Host "Total Headers: $($headers.Count)"
    for ($i=0; $i -lt $headers.Count; $i++) {
        Write-Host "Col $($i+1): $($headers[$i])"
    }
    
    $rowCount = $worksheet.UsedRange.Rows.Count
    Write-Host "Total Rows: $rowCount"
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
