
$lines = Get-Content "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\script.js"
for ($i=0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line.Trim().EndsWith("(")) {
        Write-Host "Line $($i+1): $line"
    }
}
