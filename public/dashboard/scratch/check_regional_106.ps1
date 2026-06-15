
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults106.xls"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    # Regional Mapping (Simplified)
    $mapping = @{
        "102" = "Americas"; "105" = "Americas"; "107" = "Americas"; "111" = "Americas"; "131" = "Americas"; "121" = "Americas"; "108" = "Americas"; "106" = "Americas"; "116" = "Americas";
        "201" = "APAC"; "211" = "APAC"; "221" = "APAC"; "231" = "APAC"; "241" = "APAC"; "251" = "APAC"; "243" = "APAC"; "212" = "APAC";
        "302" = "EMEA"; "311" = "EMEA"; "321" = "EMEA"; "382" = "EMEA"; "391" = "EMEA"; "401" = "EMEA"; "412" = "EMEA"; "421" = "EMEA"; "431" = "EMEA"; "441" = "EMEA"; "451" = "EMEA"; "326" = "EMEA"; "323" = "EMEA"; "334" = "EMEA"; "312" = "EMEA"; "335" = "EMEA";
    }

    $rowCount = $worksheet.UsedRange.Rows.Count
    $seenNumbers = @{}
    $regionalTotals = @{ "Americas" = 0; "APAC" = 0; "EMEA" = 0; "Other" = 0 }
    
    for ($r = 2; $r -le $rowCount; $r++) {
        $num = $worksheet.Cells.Item($r, 4).Value2
        $amt = $worksheet.Cells.Item($r, 9).Value2
        $subStr = $worksheet.Cells.Item($r, 1).Value2
        
        if ($amt -eq $null) { $amt = 0 }
        
        if ($num -ne $null -and -not $seenNumbers.ContainsKey($num)) {
            $seenNumbers[$num] = $true
            
            $region = "Other"
            if ($subStr -match '^(\d{3})') {
                $code = $matches[1]
                if ($mapping.ContainsKey($code)) { $region = $mapping[$code] }
            }
            
            $regionalTotals[$region] += $amt
        }
    }
    
    Write-Host "Regional Totals (No Duplicates):"
    $regionalTotals.Keys | ForEach-Object {
        $reg = $_
        $val = $regionalTotals[$reg]
        Write-Host "$reg : $val"
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
