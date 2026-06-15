
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\Month End Unapplied Payments Apr 2026.xlsx"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $sheet = $workbook.Worksheets.Item("Regions data table")
    $headers = $sheet.UsedRange.Value2[1, 1..15]
    Write-Host "Headers: $($headers -join ' | ')"
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
