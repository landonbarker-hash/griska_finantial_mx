
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults106.xls"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    Write-Host "`n--- Sheet: $($worksheet.Name) ---"
    $headers = @()
    for ($col = 1; $col -le 30; $col++) {
        $val = $worksheet.Cells.Item(1, $col).Value2
        if ($val -ne $null) { $headers += $val } else { break }
    }
    
    Write-Host "Total Headers: $($headers.Count)"
    for ($i=0; $i -lt $headers.Count; $i++) {
        Write-Host "Col $($i+1): $($headers[$i])"
    }
    
    for ($r = 2; $r -le 6; $r++) {
        $rowVals = @()
        for ($c = 1; $c -le $headers.Count; $c++) {
            $val = $worksheet.Cells.Item($r, $c).Value2
            if ($val -eq $null) { $val = "" }
            $rowVals += $val.ToString()
        }
        Write-Host "Row $($r): $($rowVals -join ' | ')"
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
