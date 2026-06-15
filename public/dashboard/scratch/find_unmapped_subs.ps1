
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults106.xls"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    $mapping = @{
        "102" = "A"; "105" = "A"; "107" = "A"; "111" = "A"; "131" = "A"; "121" = "A"; "108" = "A"; "106" = "A"; "116" = "A";
        "201" = "AP"; "211" = "AP"; "221" = "AP"; "231" = "AP"; "241" = "AP"; "251" = "AP"; "243" = "AP"; "212" = "AP";
        "302" = "E"; "311" = "E"; "321" = "E"; "382" = "E"; "391" = "E"; "401" = "E"; "412" = "E"; "421" = "E"; "431" = "E"; "441" = "E"; "451" = "E"; "326" = "E"; "323" = "E"; "334" = "E"; "312" = "E"; "335" = "E";
    }

    $rowCount = $worksheet.UsedRange.Rows.Count
    $others = @{}
    
    for ($r = 2; $r -le $rowCount; $r++) {
        $subStr = $worksheet.Cells.Item($r, 1).Value2
        if ($subStr -match '^(\d{3})') {
            $code = $matches[1]
            if (-not $mapping.ContainsKey($code)) {
                $others[$subStr]++
            }
        }
    }
    
    Write-Host "Unmapped Subsidiaries:"
    $others.Keys | ForEach-Object {
        Write-Host "$_ : $($others[$_])"
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
