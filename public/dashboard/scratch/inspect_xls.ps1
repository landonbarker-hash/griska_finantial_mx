
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults923.xls"
Write-Host "Opening $ExcelPath..."

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1) # Assuming first sheet
    
    Write-Host "Sheet name: $($worksheet.Name)"
    
    $headers = @()
    for ($col = 1; $col -le 20; $col++) {
        $val = $worksheet.Cells.Item(1, $col).Value2
        if ($val) { $headers += $val } else { break }
    }
    
    Write-Host "Headers: $($headers -join ', ')"
    
    Write-Host "`nFirst 5 rows of data:"
    for ($row = 2; $row -le 6; $row++) {
        $rowData = @()
        for ($col = 1; $col -le $headers.Count; $col++) {
            $rowData += $worksheet.Cells.Item($row, $col).Value2
        }
        Write-Host ($rowData -join " | ")
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
