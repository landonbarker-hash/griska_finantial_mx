
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\Month End Unapplied Payments Apr 2026.xlsx"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    
    # We want the sheet with the raw data. Based on previous inspection, it's sheet 6.
    $worksheet = $workbook.Worksheets.Item(6)
    Write-Host "Analyzing Sheet: $($worksheet.Name)"
    
    $rowCount = $worksheet.UsedRange.Rows.Count
    $seenNumbers = @{}
    $totalRemainingNoDup = 0
    $totalRemainingWithDup = 0
    
    for ($r = 2; $r -le $rowCount; $r++) {
        $num = $worksheet.Cells.Item($r, 4).Value2
        $amt = $worksheet.Cells.Item($r, 8).Value2 # Sheet 6 has Amount Remaining in Col 8
        
        if ($amt -eq $null) { $amt = 0 }
        $totalRemainingWithDup += $amt
        
        if ($num -ne $null -and -not $seenNumbers.ContainsKey($num)) {
            $seenNumbers[$num] = $true
            $totalRemainingNoDup += $amt
        }
    }
    
    Write-Host "Grand Total (With Duplicates): $totalRemainingWithDup"
    Write-Host "Grand Total (No Duplicates on Col 4): $totalRemainingNoDup"
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
