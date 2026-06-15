
$ExcelPath = "C:\Users\ernesto.jaramillo\Downloads\UnappliedPaymentsErnestoResults923.xls"

$mapping = @{
    "102" = "Americas"; "105" = "Americas"; "107" = "Americas"; "111" = "Americas"; "131" = "Americas"; "121" = "Americas"; "108" = "Americas";
    "106" = "Sysomos"; "116" = "Sysomos"; "326" = "Sysomos";
    "201" = "APAC"; "211" = "APAC"; "221" = "APAC"; "231" = "APAC"; "241" = "APAC"; "251" = "APAC"; "243" = "APAC"; "212" = "APAC";
    "302" = "EMEA"; "311" = "EMEA"; "321" = "EMEA"; "382" = "EMEA"; "391" = "EMEA"; "401" = "EMEA"; "412" = "EMEA"; "421" = "EMEA"; "431" = "EMEA"; "441" = "EMEA"; "451" = "EMEA"; "323" = "EMEA"; "334" = "EMEA"; "312" = "EMEA"; "335" = "EMEA";
}

$monthsMap = @{
    "ENERO" = "JANUARY"; "FEBRERO" = "FEBRUARY"; "MARZO" = "MARCH"; "ABRIL" = "APRIL"; "MAYO" = "MAY"; "JUNIO" = "JUNE";
    "JULIO" = "JULY"; "AGOSTO" = "AUGUST"; "SEPTIEMBRE" = "SEPTEMBER"; "OCTUBRE" = "OCTOBER"; "NOVIEMBRE" = "NOVEMBER"; "DICIEMBRE" = "DECEMBER"
}

function Get-Region($subsidiary) {
    if ($subsidiary -eq "Total") { return "IGNORE" }
    if ($subsidiary -match '(\d{3})') {
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
        if ($subsidiary -eq $null -or $subsidiary -eq "Total") { continue }
        
        $region = Get-Region $subsidiary
        if ($region -eq "IGNORE") { continue }

        $excelDate = $worksheet.Cells.Item($row, 2).Value2
        $amtRemaining = $worksheet.Cells.Item($row, 9).Value2
        $customer = $worksheet.Cells.Item($row, 11).Value2
        $currency = $worksheet.Cells.Item($row, 6).Value2
        
        if ($excelDate -eq $null -or $excelDate -lt 1) { continue }
        $date = [DateTime]::FromOADate($excelDate)
        
        $monthES = $date.ToString("MMMM").ToUpper()
        $monthEN = if ($monthsMap.ContainsKey($monthES)) { $monthsMap[$monthES] } else { $monthES }

        $results += [PSCustomObject]@{
            Region = $region
            Date = $date.ToString("M/d/yyyy")
            Year = $date.Year.ToString()
            Month = $monthEN
            Amount = [double]$amtRemaining
            Customer = $customer
            Currency = $currency
        }
    }
    
    $workbook.Close($false)
    $excel.Quit()
    
    # 1. Monthly Data
    $monthlyData = $results | Group-Object Region, Year, Month | ForEach-Object {
        [PSCustomObject]@{
            region = ($_.Name -split ", ")[0]
            year = ($_.Name -split ", ")[1]
            month = ($_.Name -split ", ")[2]
            total = [Math]::Round(($_.Group | Measure-Object -Property Amount -Sum).Sum, 2)
        }
    } | Sort-Object year, month -Descending
    
    # 2. History (Yearly)
    $years = @('2022', '2023', '2024', '2025', '2026')
    $history = @{
        years = $years
        americas = @(0,0,0,0,0)
        apac = @(0,0,0,0,0)
        emea = @(0,0,0,0,0)
    }
    
    $results | Group-Object Region, Year | ForEach-Object {
        $reg = ($_.Name -split ", ")[0].ToLower()
        $yr = ($_.Name -split ", ")[1]
        $sum = [Math]::Round(($_.Group | Measure-Object -Property Amount -Sum).Sum, 2)
        
        $idx = $years.IndexOf($yr)
        if ($idx -ge 0 -and $history.ContainsKey($reg)) {
            $history[$reg][$idx] = $sum
        }
    }

    # 3. Top Items (Top 20)
    $topItems = $results | Sort-Object Amount -Descending | Select-Object -First 20 | ForEach-Object {
        [PSCustomObject]@{
            date = $_.Date
            customer = $_.Customer
            amount = $_.Amount
            region = $_.Region
        }
    }

    $finalData = @{
        monthlyData = $monthlyData
        history = $history
        topItems = $topItems
    }
    
    $finalData | ConvertTo-Json -Depth 5 | Out-File "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\scratch\final_extracted_data.json"
    Write-Host "Success! Data exported to scratch\final_extracted_data.json"

} catch {
    Write-Error $_.Exception.Message
}
