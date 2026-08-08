$botDir = "C:\Users\User-X\Desktop\bot"
$botJs = "$botDir\bot.js"

Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Cyan
$cfProcess = Start-Process -FilePath "$botDir\cloudflared.exe" -ArgumentList "tunnel", "--url", "http://localhost:3000" -WindowStyle Hidden -PassThru -RedirectStandardError "$botDir\cf_boot.log"

Write-Host "Waiting for tunnel URL..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$url = Select-String -Path "$botDir\cf_boot.log" -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | ForEach-Object { $_.Line -replace '.*(https://\S+\.trycloudflare\.com).*','$1' } | Select-Object -First 1

if ($url) {
    Write-Host "Tunnel URL: $url" -ForegroundColor Green
    (Get-Content $botJs) -replace 'https://[a-z0-9-]+\.trycloudflare\.com', $url | Set-Content $botJs
    Write-Host "Updated bot.js with new URL" -ForegroundColor Green
} else {
    Write-Host "Could not find tunnel URL!" -ForegroundColor Red
}

Write-Host "Starting bot..." -ForegroundColor Cyan
Start-Process -FilePath "C:\Program Files\nodejs\node.exe" -ArgumentList "bot.js" -WindowStyle Hidden

Write-Host "`nBot is running! Open @ClinicDentall_bot in Telegram" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop..." -ForegroundColor Gray

while ($true) { Start-Sleep -Seconds 5 }
