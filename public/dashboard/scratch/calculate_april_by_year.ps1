
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\Month End Unapplied Payments Apr 2026.xlsx"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(6)
    
    $rowCount = $worksheet.UsedRange.Rows.Count
    $seenNumbers = @{}
    $dataByYear = @{}
    
    for ($r = 2; $r -le $rowCount; $r++) {
        $num = $worksheet.Cells.Item($r, 4).Value2
        $amt = $worksheet.Cells.Item($r, 8).Value2
        $dateVal = $worksheet.Cells.Item($r, 2).Value2
        
        if ($amt -eq $null) { $amt = 0 }
        
        if ($num -ne $null -and -not $seenNumbers.ContainsKey($num)) {
            $seenNumbers[$num] = $true
            
            if ($dateVal -is [double]) {
                $date = [datetime]::FromOADate($dateVal)
                $year = $date.Year
                if (-not $dataByYear.ContainsKey($year)) { $dataByYear[$year] = 0 }
                $dataByYear[$year] += $amt
            }
        }
    }
    
    Write-Host "Totals by Year (No Duplicates):"
    $dataByYear.Keys | Sort-Object | ForEach-Object {
        $y = $_
        $val = $dataByYear[$y]
        Write-Host "$($y): $($val)"
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
