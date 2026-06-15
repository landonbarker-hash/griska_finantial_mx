
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\Month End Unapplied Payments Apr 2026.xlsx"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    
    foreach ($sheet in $workbook.Worksheets) {
        $range = $sheet.UsedRange
        $rows = $range.Rows.Count
        Write-Host "Sheet: $($sheet.Name) | Rows: $rows"
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
