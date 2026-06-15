
$lines = Get-Content "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\script.js"
$stack = New-Object System.Collections.Generic.Stack[int]
$inString = $false
$quoteChar = ""
for ($i=0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    for ($j=0; $j -lt $line.Length; $j++) {
        $char = $line[$j]
        if ($inString) {
            if ($char -eq $quoteChar -and $line[$j-1] -ne "\") {
                $inString = $false
            }
            continue
        }
        if ($char -eq "'" -or $char -eq '"' -or $char -eq "`"") {
            $inString = $true
            $quoteChar = $char
            continue
        }
        if ($char -eq '(') {
            $stack.Push($i + 1)
        } elseif ($char -eq ')') {
            if ($stack.Count -eq 0) {
                Write-Host "Extra ) at line $($i+1) col $($j+1)"
            } else {
                $stack.Pop() | Out-Null
            }
        }
    }
}
while ($stack.Count -gt 0) {
    Write-Host "Unclosed ( from line $($stack.Pop())"
}
