
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults923.xls"

$mapping = @{
    "102" = "Americas"; "105" = "Americas"; "107" = "Americas"; "111" = "Americas"; "131" = "Americas"; "121" = "Americas"; "108" = "Americas";
    "106" = "Sysomos"; "116" = "Sysomos"; "326" = "Sysomos";
    "201" = "APAC"; "211" = "APAC"; "221" = "APAC"; "231" = "APAC"; "241" = "APAC"; "251" = "APAC"; "243" = "APAC"; "212" = "APAC";
    "302" = "EMEA"; "311" = "EMEA"; "321" = "EMEA"; "382" = "EMEA"; "391" = "EMEA"; "401" = "EMEA"; "412" = "EMEA"; "421" = "EMEA"; "431" = "EMEA"; "441" = "EMEA"; "451" = "EMEA"; "323" = "EMEA"; "334" = "EMEA"; "312" = "EMEA"; "335" = "EMEA";
}

function Get-Region($subsidiary) {
    if ($subsidiary -match '^(\d+)') {
        $code = $matches[1]
        if ($mapping.ContainsKey($code)) { return $mapping[$code] }
    }
    return "Other"
}

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $worksheet = $workbook.Worksheets.Item(1)
    
    $rowCount = $worksheet.UsedRange.Rows.Count
    
    $results = @()
    for ($row = 2; $row -le $rowCount; $row++) {
        $subsidiary = $worksheet.Cells.Item($row, 1).Value2
        $excelDate = $worksheet.Cells.Item($row, 2).Value2
        $amtRemaining = $worksheet.Cells.Item($row, 9).Value2
        $customer = $worksheet.Cells.Item($row, 11).Value2
        $specialist = $worksheet.Cells.Item($row, 12).Value2
        $memo = $worksheet.Cells.Item($row, 13).Value2
        $currency = $worksheet.Cells.Item($row, 6).Value2
        
        if ($subsidiary -eq $null) { continue }
        
        $date = [DateTime]::FromOADate($excelDate)
        $region = Get-Region $subsidiary
        
        $results += [PSCustomObject]@{
            Region = $region
            Date = $date
            Year = $date.Year
            Month = $date.ToString("MMMM").ToUpper()
            Amount = [double]$amtRemaining
            Customer = $customer
            Specialist = $specialist
            Memo = $memo
            Currency = $currency
        }
    }
    
    $workbook.Close($false)
    $excel.Quit()
    
    # 1. Grand Total
    $grandTotal = ($results | Measure-Object -Property Amount -Sum).Sum
    Write-Host "`nGRAND TOTAL: $grandTotal"
    
    # 2. Regional Totals (Latest State)
    Write-Host "`nREGIONAL TOTALS (Overall):"
    $results | Group-Object Region | ForEach-Object {
        $sum = ($_.Group | Measure-Object -Property Amount -Sum).Sum
        Write-Host "$($_.Name): $sum"
    }
    
    # 3. Monthly Totals for 2026
    Write-Host "`nMONTHLY TOTALS (2026):"
    $results | Where-Object { $_.Year -eq 2026 } | Group-Object Region, Month | ForEach-Object {
        $sum = ($_.Group | Measure-Object -Property Amount -Sum).Sum
        Write-Host "$($_.Name): $sum"
    }
    
    # 4. Top 10 Items
    Write-Host "`nTOP 10 ITEMS:"
    $results | Sort-Object Amount -Descending | Select-Object -First 10 | ForEach-Object {
        Write-Host "$($_.Date.ToString('MM/dd/yyyy')) | $($_.Customer) | $($_.Amount) | $($_.Region)"
    }

    # 5. Export all to JSON for easy parsing in the next step
    $results | ConvertTo-Json | Out-File "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\scratch\extracted_data.json"

} catch {
    Write-Error $_.Exception.Message
}
