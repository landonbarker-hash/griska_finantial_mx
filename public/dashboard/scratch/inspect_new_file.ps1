
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\Month End Unapplied Payments Apr 2026.xlsx"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    
    foreach ($sheet in $workbook.Worksheets) {
        Write-Host "Sheet: $($sheet.Name)"
        $range = $sheet.UsedRange
        $rows = $range.Rows.Count
        Write-Host "  Rows: $rows"
        if ($rows -gt 0) {
            $headers = $range.Value2[1, 1..$range.Columns.Count]
            Write-Host "  Headers: $($headers -join ' | ')"
        }
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
