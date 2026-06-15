
$lines = Get-Content "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\script.js"
$open = 0
$close = 0
for ($i=0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $lineOpen = ($line.ToCharArray() | Where-Object {$_ -eq "("}).Count
    $lineClose = ($line.ToCharArray() | Where-Object {$_ -eq ")"}).Count
    $open += $lineOpen
    $close += $lineClose
    if ($open -lt $close) {
        Write-Host "Unbalanced at line $($i+1): $line"
        break
    }
}
Write-Host "Total Open: $open, Total Close: $close"
