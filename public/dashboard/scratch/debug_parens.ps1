
$lines = Get-Content "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\script.js"
$totalO = 0
$totalC = 0
for ($i=0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $o = ($line.ToCharArray() | Where-Object {$_ -eq '('}).Count
    $c = ($line.ToCharArray() | Where-Object {$_ -eq ')'}).Count
    $totalO += $o
    $totalC += $c
    if ($o -ne $c) {
        Write-Host "Line $($i+1): Open=$o, Close=$c | $line"
    }
}
Write-Host "Total: $totalO / $totalC"
