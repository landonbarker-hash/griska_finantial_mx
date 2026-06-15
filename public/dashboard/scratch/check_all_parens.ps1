
$lines = Get-Content "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\script.js"
for ($i=0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $o = ($line.ToCharArray() | Where-Object {$_ -eq "("}).Count
    $c = ($line.ToCharArray() | Where-Object {$_ -eq ")"}).Count
    if ($o -ne $c) {
        Write-Host "Line $($i+1) ($o/$c): $line"
    }
}
