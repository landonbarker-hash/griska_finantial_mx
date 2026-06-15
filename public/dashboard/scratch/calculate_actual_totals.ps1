
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults106.xls"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    $rowCount = $worksheet.UsedRange.Rows.Count
    $totalRemaining = 0
    $dataByYear = @{}
    $dataByMonth = @{}
    
    for ($r = 2; $r -le $rowCount; $r++) {
        $amt = $worksheet.Cells.Item($r, 9).Value2
        $dateVal = $worksheet.Cells.Item($r, 2).Value2
        
        if ($amt -eq $null) { $amt = 0 }
        $totalRemaining += $amt
        
        # Date parsing
        if ($dateVal -is [double]) {
            $date = [datetime]::FromOADate($dateVal)
            $year = $date.Year
            $month = $date.ToString("MMMM").ToUpper()
            
            if (-not $dataByYear.ContainsKey($year)) { $dataByYear[$year] = 0 }
            $dataByYear[$year] += $amt
            
            $key = "$year-$month"
            if (-not $dataByMonth.ContainsKey($key)) { $dataByMonth[$key] = 0 }
            $dataByMonth[$key] += $amt
        }
    }
    
    Write-Host "Grand Total (All Rows): $totalRemaining"
    Write-Host "`nTotals by Year:"
    $dataByYear.Keys | Sort-Object | ForEach-Object {
        $y = $_
        $val = $dataByYear[$y]
        Write-Host "$($y): $($val)"
    }
    
    Write-Host "`nTotals by Month (2026):"
    $dataByMonth.Keys | Where-Object { $_ -match "2026" } | Sort-Object | ForEach-Object {
        $m = $_
        $val = $dataByMonth[$m]
        Write-Host "$($m): $($val)"
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
