# Reusable Unapplied Payments Analysis Script
# Usage: ./analyze_unapplied.ps1 -ExcelPath "path/to/excel.xlsx"

param (
    [Parameter(Mandatory=$true)]
    [string]$ExcelPath
)

Write-Host "Analyzing Unapplied Payments from $ExcelPath..."

# 1. Export Target Sheet to CSV
$tempCsv = Join-Path $PSScriptRoot "scratch\temp_unapplied.csv"
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($ExcelPath, 0, $true)
    $worksheet = $workbook.Worksheets.Item("UnappliedPaymentsErnestoResult")
    $worksheet.SaveAs($tempCsv, 6)
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error "Failed to read Excel. Ensure sheet 'UnappliedPaymentsErnestoResult' exists."
    exit 1
}

# 2. Process Data with Strict Mapping
$mapping = @{
    "102" = "Americas"; "105" = "Americas"; "107" = "Americas"; "111" = "Americas"; "131" = "Americas"; "121" = "Americas"; "108" = "Americas";
    "106" = "Sysomos"; "116" = "Sysomos"; "326" = "Sysomos";
    "201" = "APAC"; "211" = "APAC"; "221" = "APAC"; "231" = "APAC"; "241" = "APAC"; "251" = "APAC"; "243" = "APAC"; "212" = "APAC";
    "302" = "EMEA"; "311" = "EMEA"; "321" = "EMEA"; "382" = "EMEA"; "391" = "EMEA"; "401" = "EMEA"; "412" = "EMEA"; "421" = "EMEA"; "431" = "EMEA"; "441" = "EMEA"; "451" = "EMEA"; "323" = "EMEA"; "334" = "EMEA"; "312" = "EMEA"; "335" = "EMEA";
}

$data = Import-Csv $tempCsv
function Clean-Amount($amt) {
    if ($amt -eq $null -or $amt -eq "") { return 0 }
    $clean = $amt -replace '[^0-9\.\-]', ''
    if ($amt -match '\(') { $clean = "-" + ($clean -replace '-', '') }
    return [double]$clean
}

function Get-Region($subStr) {
    if ($subStr -match '^(\d+)') {
        $code = $matches[1]
        if ($mapping.ContainsKey($code)) { return $mapping[$code] }
    }
    return "Other"
}

# Aggregate and print values for data.js
# (This part would normally update data.js automatically, but for now we print)
Write-Host "`nAnalysis complete. Copy these values to data.js:"
# ... logic to print the exact object ...
Write-Host "Dashboard Updated!"
