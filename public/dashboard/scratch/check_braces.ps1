
$content = Get-Content "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\script.js" -Raw
$openBraces = 0
$closeBraces = 0
$lineNum = 1
foreach ($line in (Get-Content "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\script.js")) {
    $lineOpen = ($line.ToCharArray() | Where-Object { $_ -eq '{' }).Count
    $lineClose = ($line.ToCharArray() | Where-Object { $_ -eq '}' }).Count
    $openBraces += $lineOpen
    $closeBraces += $lineClose
    if ($openBraces -lt $closeBraces) {
        Write-Host "Extra closing brace at line ${lineNum}"
        $openBraces = $closeBraces # Reset to continue
    }
    $lineNum++
}
Write-Host "Total Open: $openBraces | Total Close: $closeBraces"
