
$lines = Get-Content "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\script.js"
$open = 0
$close = 0
for ($i=0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $lineOpen = ($line.ToCharArray() | Where-Object {$_ -eq "("}).Count
    $lineClose = ($line.ToCharArray() | Where-Object {$_ -eq ")"}).Count
    $open += $lineOpen
    $close += $lineClose
}
Write-Host "Final: $open / $close"

# Check each function block
$c = Get-Content "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\script.js" -Raw
# This is hard.
