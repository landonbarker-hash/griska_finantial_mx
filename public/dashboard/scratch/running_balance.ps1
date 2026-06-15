
$lines = Get-Content "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\script.js"
$bal = 0
for ($i=0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $o = ($line.ToCharArray() | Where-Object {$_ -eq "("}).Count
    $c = ($line.ToCharArray() | Where-Object {$_ -eq ")"}).Count
    $bal += ($o - $c)
    if ($bal -lt 0) {
        Write-Host "NEGATIVE BALANCE at line $($i+1): $line"
        $bal = 0 # reset to continue
    }
}
Write-Host "Final balance: $bal"
