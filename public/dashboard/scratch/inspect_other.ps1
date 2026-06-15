
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
    
    for ($row = 2; $row -le $rowCount; $row++) {
        $subsidiary = $worksheet.Cells.Item($row, 1).Value2
        $amtRemaining = $worksheet.Cells.Item($row, 9).Value2
        $customer = $worksheet.Cells.Item($row, 11).Value2
        
        if ($subsidiary -eq $null) { continue }
        $region = Get-Region $subsidiary
        
        if ($region -eq "Other") {
            Write-Host "Row ${row}: Sub=$subsidiary | Amt=$amtRemaining | Cust=$customer"
        }
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error $_.Exception.Message
}
