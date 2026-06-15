
$c = Get-Content "c:\Users\ernesto.jaramillo\OneDrive - Meltwater\Desktop\ar_dashboard\script.js" -Raw
$openBrace = ($c.ToCharArray() | Where-Object {$_ -eq "{"}).Count
$closeBrace = ($c.ToCharArray() | Where-Object {$_ -eq "}"}).Count
$openParen = ($c.ToCharArray() | Where-Object {$_ -eq "("}).Count
$closeParen = ($c.ToCharArray() | Where-Object {$_ -eq ")"}).Count
$openBracket = ($c.ToCharArray() | Where-Object {$_ -eq "["}).Count
$closeBracket = ($c.ToCharArray() | Where-Object {$_ -eq "]"}).Count

Write-Host "Braces: $openBrace / $closeBrace"
Write-Host "Parens: $openParen / $closeParen"
Write-Host "Brackets: $openBracket / $closeBracket"
