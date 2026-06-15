
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults106.xls"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    $mapping = @{
        "101"=1;"102"=1;"105"=1;"107"=1;"111"=1;"131"=1;"121"=1;"108"=1;"106"=1;"116"=1
    }

    $rowCount = $worksheet.UsedRange.Rows.Count
    $others = @{}
    
    for ($r = 2; $r -le $rowCount; $r++) {
        $subStr = $worksheet.Cells.Item($r, 1).Value2
        if ($subStr -match '(\d{3})') {
            $code = $matches[1]
            if ($code -match '^1' -and -not $mapping.ContainsKey($code)) {
                $others[$subStr]++
            }
        }
    }
    
    Write-Host "Unmapped Americas Subsidiaries:"
    $others.Keys | ForEach-Object {
        Write-Host "$_ : $($others[$_])"
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
