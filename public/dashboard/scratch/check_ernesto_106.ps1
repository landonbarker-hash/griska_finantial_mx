
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults106.xls"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    $rowCount = $worksheet.UsedRange.Rows.Count
    $seenNumbers = @{}
    $totalNoDup = 0
    $totalWithDup = 0
    
    for ($r = 2; $r -le $rowCount; $r++) {
        $num = $worksheet.Cells.Item($r, 4).Value2
        $amt = $worksheet.Cells.Item($r, 9).Value2
        
        if ($amt -eq $null) { $amt = 0 }
        $totalWithDup += $amt
        
        if ($num -ne $null -and -not $seenNumbers.ContainsKey($num)) {
            $seenNumbers[$num] = $true
            $totalNoDup += $amt
        }
    }
    
    Write-Host "File: UnappliedPaymentsErnestoResults106.xls"
    Write-Host "Grand Total (With Duplicates): $totalWithDup"
    Write-Host "Grand Total (No Duplicates on Col 4): $totalNoDup"
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
