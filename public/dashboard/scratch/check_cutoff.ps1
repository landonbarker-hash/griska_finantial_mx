
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults106.xls"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    $rowCount = $worksheet.UsedRange.Rows.Count
    $seenNumbers = @{}
    $totalAsOf2025 = 0
    
    $cutoff = Get-Date -Year 2025 -Month 4 -Day 30
    
    for ($r = 2; $r -le $rowCount; $r++) {
        $num = $worksheet.Cells.Item($r, 4).Value2
        $amt = $worksheet.Cells.Item($r, 9).Value2
        $dateVal = $worksheet.Cells.Item($r, 2).Value2
        
        if ($amt -eq $null) { $amt = 0 }
        
        if ($num -ne $null -and -not $seenNumbers.ContainsKey($num)) {
            $seenNumbers[$num] = $true
            
            if ($dateVal -is [double]) {
                $date = [datetime]::FromOADate($dateVal)
                if ($date -le $cutoff) {
                    $totalAsOf2025 += $amt
                }
            }
        }
    }
    
    Write-Host "Total As Of 04/30/2025 (No Dups): $totalAsOf2025"
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
